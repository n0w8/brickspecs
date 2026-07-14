#!/usr/bin/env node
/**
 * Prüfskript: Konsistenz der kuratierten Minifiguren (src/data/minifigs.ts)
 * gegen das Rebrickable-Katalog-Inventar (src/data/catalog/minifig-catalog.json).
 *
 * Für jede kuratierte Figur wird geprüft:
 *  1. Existieren die appearsInSetIds im Set-Katalog (ggf. mit "-1"-Suffix)?
 *  2. Lässt sich die Figur per Namens-Token-Abgleich EINDEUTIG einer
 *     Katalog-Figur im Set-Inventar zuordnen? (gleiche Logik wie
 *     src/lib/fig-match.ts)
 *  3. Mit --online: Löst die BrickLink-ID (z. B. "cas212") über den
 *     Rebrickable-Such-Redirect zur fig-ID auf und prüft, ob diese Figur
 *     wirklich in einem der appearsInSetIds-Sets vorkommt. Deckt falsche
 *     BrickLink-IDs (und damit falsche imageUrl-Bilder) auf.
 *
 * Aufruf:  node scripts/check-curated-figs.mjs [--online]
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ONLINE = process.argv.includes("--online");

// ── Kuratierte Figuren aus minifigs.ts parsen (uniforme Struktur) ─────────
const src = readFileSync(join(ROOT, "src", "data", "minifigs.ts"), "utf8");
const FIG_RE =
  /id:\s*"([^"]+)"[\s\S]*?name:\s*\{[^}]*?en:\s*"([^"]*)"[\s\S]*?appearsInSetIds:\s*\[([^\]]*)\][\s\S]*?imageUrl:\s*"([^"]+)"/g;
const curated = [];
let m;
while ((m = FIG_RE.exec(src)) !== null) {
  curated.push({
    id: m[1],
    nameEn: m[2],
    setIds: Array.from(m[3].matchAll(/"([^"]+)"/g)).map((x) => x[1]),
    imageUrl: m[4],
  });
}
if (curated.length === 0) {
  console.error("FEHLER: keine Figuren aus minifigs.ts geparst.");
  process.exit(1);
}

// ── Katalogdaten laden ────────────────────────────────────────────────────
const dir = join(ROOT, "src", "data", "catalog");
const figCat = JSON.parse(readFileSync(join(dir, "minifig-catalog.json"), "utf8"));
const setCat = JSON.parse(readFileSync(join(dir, "catalog.json"), "utf8"));

const setIds = new Set(setCat.sets.map((s) => s.n));
const bySet = new Map();
const figById = new Map();
for (const f of figCat.figs) {
  figById.set(f.n, f);
  for (const s of f.s) {
    const list = bySet.get(s);
    if (list) list.push(f);
    else bySet.set(s, [f]);
  }
}

// Varianten-Index: Basisnummer -> alle Set-IDs mit Inventar ("375" -> ["375-2"])
const variantsByBase = new Map();
for (const id of bySet.keys()) {
  const base = id.replace(/-\d+$/, "");
  const list = variantsByBase.get(base);
  if (list) list.push(id);
  else variantsByBase.set(base, [id]);
}

function inventoryOf(setId) {
  const direct = bySet.get(setId) ?? bySet.get(`${setId}-1`);
  if (direct) return { setId: bySet.has(setId) ? setId : `${setId}-1`, figs: direct };
  const variants = variantsByBase.get(setId.replace(/-\d+$/, "")) ?? [];
  if (variants.length === 1) return { setId: variants[0], figs: bySet.get(variants[0]) };
  return { setId, figs: [] };
}
function setExists(setId) {
  return setIds.has(setId) || setIds.has(`${setId}-1`);
}

// ── Namens-Token-Abgleich (identisch zu src/lib/fig-match.ts) ─────────────
const STOP_WORDS = new Set([
  "the", "and", "with", "on", "in", "of", "for", "a", "an",
  "der", "die", "das", "und", "mit", "von",
]);
const GENERIC_TOKENS = new Set([
  "knight", "castle", "man", "woman", "boy", "girl", "classic", "figure",
  "minifig", "lego", "black", "white", "red", "blue", "yellow", "green",
  "gray", "grey", "dark", "light", "brown", "tan", "legs", "torso", "head",
  "helmet", "hair", "cape", "outfit", "era",
]);

function nameTokens(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9äöüß]+/g, " ")
    .split(" ")
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w) && !/^\d+$/.test(w));
}

function stripParens(name) {
  return name.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
}

function scoreCandidates(curTokens, candidates) {
  const cur = new Set(curTokens);
  let best = null;
  let bestScore = 0;
  let bestNonGeneric = 0;
  let tie = false;
  for (const cand of candidates) {
    const candTokens = new Set(nameTokens(cand.t));
    let score = 0;
    let nonGeneric = 0;
    for (const t of cur) {
      if (!candTokens.has(t)) continue;
      if (GENERIC_TOKENS.has(t)) {
        score += 1;
      } else {
        score += 2;
        nonGeneric += 1;
      }
    }
    if (score > bestScore) {
      best = cand;
      bestScore = score;
      bestNonGeneric = nonGeneric;
      tie = false;
    } else if (score === bestScore && score > 0) {
      tie = true;
    }
  }
  return { best, tie, score: bestScore, nonGeneric: bestNonGeneric };
}

function matchCuratedToCatalog(curatedNameEn, candidates) {
  if (candidates.length === 0) return null;
  const stripped = stripParens(curatedNameEn).toLowerCase();
  if (stripped) {
    const exact = candidates.filter((c) => c.t.trim().toLowerCase() === stripped);
    if (exact.length === 1) return exact[0];
  }
  const accept = (r) => (r.best && !r.tie && r.score >= 2 && r.nonGeneric >= 1 ? r.best : null);
  const fullHit = accept(scoreCandidates(nameTokens(curatedNameEn), candidates));
  if (fullHit) return fullHit;
  const strippedTokens = nameTokens(stripped);
  if (strippedTokens.length > 0 && stripped !== curatedNameEn.toLowerCase().trim()) {
    return accept(scoreCandidates(strippedTokens, candidates));
  }
  return null;
}

// ── Optional: BrickLink-ID online zur Rebrickable-fig-ID auflösen ─────────
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

async function resolveBrickLinkFig(blId) {
  try {
    const res = await fetch(`https://rebrickable.com/search/?q=${encodeURIComponent(blId)}`, {
      headers: { "User-Agent": BROWSER_UA },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const hit = res.url.match(/\/minifigs\/(fig-\d+)\//);
    return hit ? hit[1] : null;
  } catch {
    return null;
  }
}

// ── Prüfung ───────────────────────────────────────────────────────────────
let problems = 0;
console.log(`Prüfe ${curated.length} kuratierte Figuren gegen den Katalog${ONLINE ? " (inkl. Online-BrickLink-Check)" : ""} ...\n`);

for (const fig of curated) {
  const lines = [];

  const missingSets = fig.setIds.filter((s) => !setExists(s));
  if (missingSets.length > 0) {
    lines.push(`  - Sets ohne Katalog-Eintrag: ${missingSets.join(", ")} (Promo/Polybag?)`);
  }

  let matchedAnywhere = false;
  const matchDetails = [];
  for (const setId of fig.setIds) {
    const inv = inventoryOf(setId);
    if (inv.figs.length === 0) {
      matchDetails.push(`${setId}: kein Inventar`);
      continue;
    }
    const match = matchCuratedToCatalog(fig.nameEn, inv.figs);
    if (match) {
      matchedAnywhere = true;
      matchDetails.push(`${inv.setId}: ${match.n} "${match.t}"`);
    } else {
      matchDetails.push(`${inv.setId}: KEINE eindeutige Zuordnung (${inv.figs.length} Figuren im Inventar)`);
    }
  }
  if (!matchedAnywhere) {
    lines.push(`  - In KEINEM Set eindeutig zuordenbar:`);
    for (const d of matchDetails) lines.push(`      ${d}`);
  }

  // Offline-Bild-Check: Rebrickable-Bild muss zu einer Figur gehören, die
  // laut Katalog in einem der appearsInSetIds-Sets (beliebige Variante)
  // vorkommt. CMF-Packs (z. B. 71001-19) zählen als Variante der Basis.
  const rbImg = fig.imageUrl.match(/cdn\.rebrickable\.com\/media\/sets\/(fig-\d+)\.jpg/);
  if (rbImg) {
    const figId = rbImg[1];
    const inAny = fig.setIds.some((s) => {
      const variants = variantsByBase.get(s.replace(/-\d+$/, "")) ?? [];
      return variants.some((v) => (bySet.get(v) ?? []).some((f) => f.n === figId));
    });
    if (!inAny) {
      problems++;
      const rbFig = figById.get(figId);
      lines.push(
        `  - BILD-FIGUR NICHT IM SET: imageUrl zeigt ${figId} ("${rbFig?.t ?? "?"}"),` +
          ` laut Katalog aber in keiner Variante von ${fig.setIds.join(", ")} enthalten` +
          ` (appearsInSetIds prüfen!)`
      );
    }
  }

  if (ONLINE && /img\.bricklink\.com/.test(fig.imageUrl)) {
    const blId = fig.imageUrl.match(/\/([a-z0-9]+)\.png$/i)?.[1] ?? fig.id;
    const resolved = await resolveBrickLinkFig(blId);
    await new Promise((r) => setTimeout(r, 800));
    if (!resolved) {
      lines.push(`  - Online: BrickLink-ID "${blId}" nicht auflösbar (Bild ungeprüft)`);
    } else {
      const rbFig = figById.get(resolved);
      const inAnySet = fig.setIds.some((s) =>
        inventoryOf(s).figs.some((f) => f.n === resolved)
      );
      if (!inAnySet) {
        problems++;
        lines.push(
          `  - FALSCHES BILD: BrickLink "${blId}" ist Rebrickable ${resolved}` +
            ` ("${rbFig?.t ?? "?"}") und kommt in KEINEM der Sets ${fig.setIds.join(", ")} vor!`
        );
      } else {
        lines.push(`  - Online OK: "${blId}" = ${resolved} ("${rbFig?.t ?? "?"}")`);
      }
    }
  }

  const hasIssue = lines.some((l) => !l.includes("Online OK"));
  const okMatches = matchDetails.filter((d) => d.includes('"'));
  console.log(`${hasIssue ? "⚠" : "✓"} ${fig.id} "${fig.nameEn}" [${fig.setIds.join(", ")}]`);
  if (matchedAnywhere && okMatches.length > 0) {
    for (const d of okMatches) console.log(`      Zuordnung ${d}`);
  }
  for (const l of lines) console.log(l);
}

console.log(
  `\nFertig. ${problems} Figuren mit sicher falschem Bild gefunden.` +
    `${ONLINE ? "" : " (BrickLink-Bilder nur mit --online prüfbar.)"}`
);
