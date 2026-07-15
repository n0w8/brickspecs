#!/usr/bin/env node
/**
 * BrickSpecs BrickLink-Minifiguren-Preis-Sync
 *
 * Holt den 6-Monats-Verkaufsschnitt (guide_type=sold) je Minifigur von der
 * BrickLink Store-API - neu (N) UND gebraucht (U) getrennt - und schreibt ihn
 * nach public.minifig_prices in Supabase.
 *
 * ID-Bruecke (Kernproblem): Unsere Figuren-IDs sind Rebrickable-IDs
 * ("fig-006583"), BrickLink-Preise brauchen aber die BrickLink-Minifig-ID
 * ("sw0107"). Aufloesung, gecacht in der bricklink_id-Spalte:
 *   1. Cache (bereits aufgeloeste bricklink_id)
 *   2. Kuratierte Bruecke aus src/data/minifigs.ts (id = BrickLink-ID,
 *      imageUrl traegt die fig-XXXXXX) - Primaerquelle, kostenlos, zuverlaessig.
 *   3. Rebrickable-API (GET /lego/minifigs/{fig}/ -> external_ids.BrickLink[0])
 *      als Best-Effort-Fallback. ACHTUNG: die Rebrickable-API liefert fuer
 *      Minifiguren derzeit KEINE external_ids (Recherche Juli 2026), bleibt also
 *      meist ergebnislos - der Code ist bewusst tolerant und ueberspringt dann.
 * Figuren ohne aufloesbare BrickLink-ID werden sauber uebersprungen.
 *
 * Prioritaet: kuratierte Minifiguren (fig-IDs aus src/data/minifigs.ts) zuerst,
 * dann - falls vorhanden - meistgesehene (minifig_views), dann der Rest aus dem
 * Katalog (src/data/catalog/minifig-catalog.json, teilereichste zuerst). Ein
 * rollierender Cursor (public.sync_state, key "minifig_cursor") deckt ueber
 * mehrere Tagelaeufe den gesamten Katalog ab, ohne das Rate-Limit zu sprengen.
 *
 * Aufruf (voller Lauf):   node scripts/sync-minifig-prices.mjs
 * Gezielt (schreibt trotzdem in die DB):
 *   node scripts/sync-minifig-prices.mjs --sets fig-006583,fig-003908
 *   node scripts/sync-minifig-prices.mjs --limit 20
 *   node scripts/sync-minifig-prices.mjs --budget 30
 *
 * Env (aus .env.local lokal oder aus process.env in CI):
 *   BRICKLINK_CONSUMER_KEY / BRICKLINK_CONSUMER_SECRET
 *   BRICKLINK_TOKEN / BRICKLINK_TOKEN_SECRET
 *   REBRICKABLE_API_KEY
 *   NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
 *
 * Es werden NIEMALS Secret-Werte geloggt.
 */

import { createHmac, randomBytes } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// --------------------------------------------------------------------------
// Konfiguration
// --------------------------------------------------------------------------
const BASE_URL = "https://api.bricklink.com/api/store/v1";
const REBRICKABLE_URL = "https://rebrickable.com/api/v3";
const TIMEOUT_MS = 15_000;
// BrickLink-Tagesbudget (Calls), hart begrenzt. 2 Calls pro Figur (neu + gebr.).
const DEFAULT_BUDGET = 3000;
const FRESH_DAYS = 30; // Figuren, die juenger als 30 Tage aktualisiert sind, ueberspringen
const PACING_MS = 150; // sanfte Pause zwischen einzelnen API-Calls

// --------------------------------------------------------------------------
// .env.local laden (nur was noch nicht in process.env steht; nie loggen)
// --------------------------------------------------------------------------
function loadDotEnvLocal() {
  const file = join(ROOT, ".env.local");
  if (!existsSync(file)) return;
  const text = readFileSync(file, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue; // Muell-Zeilen ignorieren
    if (process.env[key] !== undefined) continue;
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}
loadDotEnvLocal();

// --------------------------------------------------------------------------
// Argumente
// --------------------------------------------------------------------------
function parseArgs(argv) {
  const args = { limit: null, sets: null, budget: DEFAULT_BUDGET };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--limit") args.limit = Math.max(1, Number(argv[++i]) || 1);
    else if (argv[i] === "--sets")
      args.sets = String(argv[++i] || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    else if (argv[i] === "--budget") args.budget = Math.max(1, Number(argv[++i]) || DEFAULT_BUDGET);
  }
  return args;
}
const ARGS = parseArgs(process.argv.slice(2));
// Anders als der Set-Sync: --sets/--limit schreiben BEWUSST auch in die DB
// (nur der Cursor wird dann nicht fortgeschrieben). "TARGETED" = gezielter Lauf.
const TARGETED = ARGS.limit !== null || ARGS.sets !== null;

// --------------------------------------------------------------------------
// BrickLink OAuth 1.0 (Muster aus scripts/sync-bricklink-prices.mjs)
// --------------------------------------------------------------------------
function credentials() {
  const consumerKey = process.env.BRICKLINK_CONSUMER_KEY;
  const consumerSecret = process.env.BRICKLINK_CONSUMER_SECRET;
  const token = process.env.BRICKLINK_TOKEN;
  const tokenSecret = process.env.BRICKLINK_TOKEN_SECRET;
  if (!consumerKey || !consumerSecret || !token || !tokenSecret) return null;
  return { consumerKey, consumerSecret, token, tokenSecret };
}

function pctEnc(value) {
  return encodeURIComponent(value).replace(
    /[!*'()]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function buildAuthHeader(creds, urlWithoutQuery, query) {
  const oauth = {
    oauth_consumer_key: creds.consumerKey,
    oauth_token: creds.token,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_nonce: randomBytes(16).toString("hex"),
    oauth_version: "1.0",
  };
  const allParams = { ...query, ...oauth };
  const paramString = Object.keys(allParams)
    .sort()
    .map((k) => `${pctEnc(k)}=${pctEnc(allParams[k])}`)
    .join("&");
  const baseString = `GET&${pctEnc(urlWithoutQuery)}&${pctEnc(paramString)}`;
  const signingKey = `${pctEnc(creds.consumerSecret)}&${pctEnc(creds.tokenSecret)}`;
  const signature = createHmac("sha1", signingKey).update(baseString).digest("base64");
  return (
    "OAuth " +
    Object.entries({ ...oauth, oauth_signature: signature })
      .map(([k, v]) => `${pctEnc(k)}="${pctEnc(v)}"`)
      .join(", ")
  );
}

/**
 * Holt den VERKAUFSschnitt einer Minifigur (guide_type=sold, letzte 6 Monate).
 * getMinifigPrice in src/lib/bricklink.ts nutzt guide_type=stock (aktuelle
 * Angebote) - fuer den Verkaufsschnitt bauen wir den signierten GET daher hier
 * direkt nach. Wirft bei echten Fehlern (429/401), damit die Retry-/Skip-Logik
 * reagieren kann. 404/kein Guide -> { avgEUR: null, qty: 0 }.
 */
async function getMinifigSoldPrice(creds, minifigNo, newOrUsed) {
  const urlWithoutQuery = `${BASE_URL}/items/MINIFIG/${encodeURIComponent(minifigNo)}/price`;
  const query = { guide_type: "sold", new_or_used: newOrUsed, currency_code: "EUR" };
  const authHeader = buildAuthHeader(creds, urlWithoutQuery, query);
  const qs = Object.entries(query)
    .map(([k, v]) => `${pctEnc(k)}=${pctEnc(v)}`)
    .join("&");

  let res;
  try {
    res = await fetch(`${urlWithoutQuery}?${qs}`, {
      headers: { Authorization: authHeader },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const e = new Error(`Netzwerk/Timeout: ${err?.message ?? err}`);
    e.status = 0;
    throw e;
  }

  if (res.status === 404) return { avgEUR: null, qty: 0 };
  const textBody = await res.text();
  let json;
  try {
    json = JSON.parse(textBody);
  } catch {
    const e = new Error(`ungueltige Antwort (HTTP ${res.status})`);
    e.status = res.status;
    throw e;
  }

  const code = json?.meta?.code;
  if (code === 404) return { avgEUR: null, qty: 0 };
  if (code !== 200 || !json.data) {
    const detail = json?.meta?.description ?? json?.meta?.message ?? "Fehler";
    const e = new Error(`meta ${code ?? res.status}: ${detail}`);
    e.status = res.status || 500;
    throw e;
  }

  const rawAvg = json.data.avg_price;
  const avg = rawAvg !== undefined && rawAvg !== "" ? Number(rawAvg) : NaN;
  const avgEUR = Number.isFinite(avg) && avg > 0 ? avg : null;
  const rawQty = json.data.unit_quantity ?? json.data.total_quantity ?? 0;
  const qtyNum = Number(rawQty);
  const qty = Number.isFinite(qtyNum) && qtyNum > 0 ? Math.round(qtyNum) : 0;
  return { avgEUR, qty };
}

// --------------------------------------------------------------------------
// Rebrickable: fig-ID -> BrickLink-ID (external_ids.BrickLink[0])
// --------------------------------------------------------------------------
/**
 * Loest eine Rebrickable-Figurnummer ("fig-006583") zur BrickLink-ID ("sw0107")
 * auf. Liefert null (nicht werfen), wenn keine BrickLink-ID hinterlegt ist oder
 * die Figur unbekannt ist - solche Figuren werden sauber uebersprungen. Wirft
 * nur bei echten Transportfehlern nicht (auch die faengt der Aufrufer ab).
 */
async function resolveBrickLinkId(figId, apiKey) {
  if (!apiKey) return null;
  const url = `${REBRICKABLE_URL}/lego/minifigs/${encodeURIComponent(figId)}/`;
  let res;
  try {
    res = await fetch(url, {
      headers: {
        Authorization: `key ${apiKey}`,
        "User-Agent": "BrickSpecs/1.0 (Minifig-Preis-Sync)",
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  let data;
  try {
    data = await res.json();
  } catch {
    return null;
  }
  const bl = data?.external_ids?.BrickLink;
  const id = Array.isArray(bl) ? bl.find((x) => typeof x === "string" && x.trim()) : null;
  return id ? String(id).trim() : null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --------------------------------------------------------------------------
// Prioritaetsliste (fig-IDs)
// --------------------------------------------------------------------------
/**
 * Kuratierte Bruecke fig-ID -> BrickLink-ID aus src/data/minifigs.ts.
 *
 * WICHTIG (Recherche-Ergebnis): Die Rebrickable-API liefert fuer Minifiguren
 * KEINE external_ids (weder im Detail-Endpunkt noch ueber die Suche) und die
 * HTML-Seite ist bot-geschuetzt (403). Die einzige zuverlaessige, kostenlose
 * fig->BrickLink-Zuordnung sind unsere kuratierten Daten selbst: dort ist die
 * id die BrickLink-ID ("sw0107") und die imageUrl traegt die fig-XXXXXX. Wir
 * paaren beide (id kommt im Objekt vor imageUrl).
 */
function loadCuratedBridge() {
  const map = new Map();
  try {
    const text = readFileSync(join(ROOT, "src", "data", "minifigs.ts"), "utf8");
    for (const m of text.matchAll(
      /id:\s*["']([^"']+)["'][\s\S]*?imageUrl:\s*["']([^"']*)["']/g
    )) {
      const blId = m[1];
      const fig = m[2].match(/fig-\d+/)?.[0];
      if (fig && !map.has(fig)) map.set(fig, blId);
    }
  } catch {
    // ignorieren - Bruecke bleibt leer
  }
  return map;
}

/** Alle Katalog-Figuren (teilereichste/bekannteste zuerst). */
function loadCatalogFigIds() {
  try {
    const raw = JSON.parse(
      readFileSync(join(ROOT, "src", "data", "catalog", "minifig-catalog.json"), "utf8")
    );
    const figs = Array.isArray(raw.figs) ? raw.figs : [];
    // Bekannteste zuerst: nach Anzahl Sets absteigend, dann Teilezahl.
    return [...figs]
      .sort((a, b) => (b.s?.length ?? 0) - (a.s?.length ?? 0) || (b.p ?? 0) - (a.p ?? 0))
      .map((f) => f.n)
      .filter((n) => typeof n === "string" && n.startsWith("fig-"));
  } catch {
    return [];
  }
}

/** Baut die priorisierte, deduplizierte fig-ID-Liste. */
async function buildPriorityList(supabase, curatedBridge) {
  const ordered = [];
  const seen = new Set();
  const push = (id) => {
    if (id && !seen.has(id)) {
      seen.add(id);
      ordered.push(id);
    }
  };

  // 1) Kuratierte Figuren zuerst (die mit bekannter BrickLink-ID).
  for (const id of curatedBridge.keys()) push(id);

  // 2) Meistgesehene Figuren (falls eine minifig_views-Tabelle existiert).
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("minifig_views")
        .select("fig_id, views")
        .order("views", { ascending: false })
        .limit(2000);
      if (!error && Array.isArray(data)) {
        for (const row of data) if (row?.fig_id) push(String(row.fig_id));
      }
    } catch {
      // minifig_views evtl. nicht vorhanden - ignorieren
    }
  }

  // 3) Rest in Katalogreihenfolge (bekannteste zuerst).
  for (const id of loadCatalogFigIds()) push(id);

  return ordered;
}

// --------------------------------------------------------------------------
// Supabase-Helfer
// --------------------------------------------------------------------------
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function isMissingTableError(error) {
  if (!error) return false;
  const msg = `${error.message ?? ""} ${error.details ?? ""} ${error.hint ?? ""}`.toLowerCase();
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    msg.includes("does not exist") ||
    msg.includes("could not find the table") ||
    msg.includes("schema cache")
  );
}

/** fig_id -> { updatedMs, bricklinkId } aus dem bestehenden Cache. */
async function loadCache(supabase) {
  const map = new Map();
  if (!supabase) return { map, tableMissing: false };
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("minifig_prices")
      .select("fig_id, bricklink_id, updated_at")
      .range(from, from + pageSize - 1);
    if (error) {
      if (isMissingTableError(error)) return { map, tableMissing: true };
      throw error;
    }
    if (!data || data.length === 0) break;
    for (const row of data) {
      map.set(row.fig_id, {
        updatedMs: row.updated_at ? Date.parse(row.updated_at) : 0,
        bricklinkId: row.bricklink_id ?? null,
      });
    }
    if (data.length < pageSize) break;
  }
  return { map, tableMissing: false };
}

async function readCursor(supabase) {
  if (!supabase) return 0;
  const { data, error } = await supabase
    .from("sync_state")
    .select("value")
    .eq("key", "minifig_cursor")
    .maybeSingle();
  if (error) return 0;
  const n = Number(data?.value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

async function writeCursor(supabase, value) {
  if (!supabase) return;
  await supabase
    .from("sync_state")
    .upsert({ key: "minifig_cursor", value: String(value) }, { onConflict: "key" });
}

// --------------------------------------------------------------------------
// Hauptlauf
// --------------------------------------------------------------------------
async function main() {
  const creds = credentials();
  if (!creds) {
    console.error(
      "[minifig] FEHLER: BrickLink-Zugangsdaten fehlen (BRICKLINK_CONSUMER_KEY/SECRET, BRICKLINK_TOKEN/SECRET)."
    );
    process.exit(1);
  }

  // Kuratierte fig->BrickLink-Bruecke (Primaerquelle, kostenlos, zuverlaessig).
  const curatedBridge = loadCuratedBridge();

  // Rebrickable ist nur ein Best-Effort-Fallback: die API liefert fuer
  // Minifiguren derzeit KEINE external_ids, daher bleibt sie meist ergebnislos.
  const rebrickableKey = process.env.REBRICKABLE_API_KEY;
  console.log(
    `[minifig] Kuratierte Bruecke: ${curatedBridge.size} fig->BrickLink-Paare${
      rebrickableKey ? " (+ Rebrickable-Fallback aktiv)" : ""
    }.`
  );

  const supabase = getSupabase();
  if (!supabase) {
    console.warn(
      "[minifig] Warnung: Supabase nicht konfiguriert (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) - es wird nur abgefragt, kein Upsert."
    );
  }

  // Ziel-Liste bestimmen.
  let workList;
  let startIndex = 0;
  if (ARGS.sets) {
    workList = ARGS.sets;
    console.log(`[minifig] Gezielter Lauf: ${workList.length} explizit angegebene Figuren.`);
  } else {
    const priority = await buildPriorityList(supabase, curatedBridge);
    if (ARGS.limit) {
      workList = priority.slice(0, ARGS.limit);
      console.log(`[minifig] Gezielter Lauf: erste ${workList.length} Figuren der Prioritaetsliste.`);
    } else {
      workList = priority;
      startIndex = (await readCursor(supabase)) % Math.max(1, priority.length);
      console.log(
        `[minifig] Voller Lauf: ${priority.length} Figuren in Prioritaetsliste, Cursor bei Index ${startIndex}.`
      );
    }
  }

  // Cache (Frische + gecachte BrickLink-IDs) laden.
  let cache = new Map();
  let tableMissing = false;
  if (supabase) {
    try {
      const c = await loadCache(supabase);
      cache = c.map;
      tableMissing = c.tableMissing;
      if (tableMissing && !TARGETED) {
        // Voller Lauf ohne Tabelle ist sinnlos (nichts zu schreiben) -> sauber
        // beenden. Gezielter Lauf (--sets/--limit) laeuft dagegen weiter und
        // beweist ID-Bruecke + Preis-Fetch (Upsert wird dann uebersprungen).
        console.error(
          "[minifig] Tabelle minifig_prices fehlt - Betreiber muss supabase/minifig-prices.sql deployen. Voller Lauf wird abgebrochen."
        );
        return;
      }
      if (tableMissing) {
        console.warn(
          "[minifig] Tabelle minifig_prices fehlt - gezielter Lauf laeuft NUR-Fetch weiter (kein Upsert bis Deploy von supabase/minifig-prices.sql)."
        );
      }
    } catch (err) {
      console.warn(`[minifig] Cache-Laden uebersprungen: ${err?.message ?? err}`);
    }
  }

  const N = workList.length;
  const nowMs = Date.now();

  let examined = 0;
  let calls = 0; // gezaehlte BrickLink-Calls (Budget)
  let priced = 0;
  let resolved = 0;
  let noBlId = 0;
  let noData = 0;
  let skippedFresh = 0;
  let errors = 0;
  let idx = TARGETED ? 0 : startIndex;

  while (examined < N && calls + 2 <= ARGS.budget) {
    const figId = workList[idx];
    examined++;
    const nextIdx = (idx + 1) % N;

    const cached = cache.get(figId);

    // Frische-Skip (auch im gezielten Lauf sinnvoll, spart Budget bei --limit;
    // bei explizitem --sets aber NICHT skippen, damit der Test echte Calls macht).
    if (cached && !ARGS.sets) {
      if (cached.updatedMs && nowMs - cached.updatedMs < FRESH_DAYS * 86_400_000) {
        skippedFresh++;
        idx = nextIdx;
        continue;
      }
    }

    // 1) BrickLink-ID beschaffen. Reihenfolge:
    //    a) Cache (bereits aufgeloest)
    //    b) kuratierte Bruecke (fig->BL aus src/data/minifigs.ts)
    //    c) figId ist selbst schon eine BrickLink-ID (kein "fig-"-Praefix)
    //    d) Rebrickable-Fallback (derzeit meist ergebnislos, s. o.)
    let bricklinkId = cached?.bricklinkId ?? curatedBridge.get(figId) ?? null;
    if (!bricklinkId && !figId.startsWith("fig-")) {
      bricklinkId = figId; // direkt uebergebene BrickLink-ID
    }
    if (!bricklinkId) {
      bricklinkId = await resolveBrickLinkId(figId, rebrickableKey);
      await sleep(PACING_MS);
    }
    if (bricklinkId && !cached?.bricklinkId) {
      resolved++;
      // BrickLink-ID sofort cachen (auch wenn Preis gleich folgt).
      if (supabase && !tableMissing) {
        const { error } = await supabase
          .from("minifig_prices")
          .upsert({ fig_id: figId, bricklink_id: bricklinkId }, { onConflict: "fig_id" });
        if (error && isMissingTableError(error)) tableMissing = true;
      }
    }

    if (!bricklinkId) {
      // Nicht aufloesbar (keine BrickLink-ID hinterlegt) -> sauber ueberspringen.
      noBlId++;
      idx = nextIdx;
      continue;
    }

    // 2) Preise holen (neu + gebraucht, guide_type=sold).
    let stop = false;
    try {
      const nw = await getMinifigSoldPrice(creds, bricklinkId, "N");
      calls++;
      await sleep(PACING_MS);
      const us = await getMinifigSoldPrice(creds, bricklinkId, "U");
      calls++;
      await sleep(PACING_MS);

      if (nw.avgEUR === null && us.avgEUR === null) noData++;

      const fmt = (p) =>
        p.avgEUR === null ? "keine Daten" : `${p.avgEUR.toFixed(2)} EUR (${p.qty} Verk.)`;
      console.log(
        `  ${figId.padEnd(12)} -> ${bricklinkId.padEnd(10)} neu: ${fmt(nw).padEnd(26)} gebraucht: ${fmt(us)}`
      );

      if (supabase && !tableMissing) {
        const { error } = await supabase.from("minifig_prices").upsert(
          {
            fig_id: figId,
            bricklink_id: bricklinkId,
            new_eur: nw.avgEUR,
            used_eur: us.avgEUR,
            new_qty: nw.qty,
            used_qty: us.qty,
            currency: "EUR",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "fig_id" }
        );
        if (error) {
          if (isMissingTableError(error)) {
            tableMissing = true;
            console.error(
              "[minifig] Tabelle minifig_prices fehlt - Betreiber muss supabase/minifig-prices.sql deployen."
            );
            stop = true;
          } else {
            errors++;
            console.warn(`  ! Upsert-Fehler bei ${figId}: ${error.message}`);
          }
        } else {
          priced++;
        }
      } else {
        priced++;
      }
    } catch (err) {
      errors++;
      const status = err?.status;
      console.warn(`  ! Fehler bei ${figId} (${bricklinkId}): ${err?.message ?? err}`);
      if (status === 429) {
        console.warn("[minifig] Rate-Limit (429) erreicht - Lauf wird beendet.");
        stop = true;
      }
    }

    idx = nextIdx;
    if (stop) break;
  }

  // Cursor fortschreiben (nur voller Lauf, Tabelle vorhanden).
  if (!TARGETED && supabase && !tableMissing) {
    const wrapped = examined >= N; // Liste komplett durchlaufen -> zurueck auf 0
    const newCursor = wrapped ? 0 : idx;
    await writeCursor(supabase, newCursor);
    console.log(
      `[minifig] Cursor neu gesetzt auf Index ${newCursor}${wrapped ? " (Liste komplett - Neustart)" : ""}.`
    );
  }

  console.log("[minifig] ------------------------------------------------");
  console.log(`[minifig] Zusammenfassung${TARGETED ? " (gezielt)" : ""}:`);
  console.log(`  geprueft:            ${examined}`);
  console.log(`  BrickLink-Calls:     ${calls} (Budget ${ARGS.budget})`);
  console.log(`  bepreist (Upsert):   ${priced}`);
  console.log(`  IDs aufgeloest:      ${resolved}`);
  console.log(`  ohne BrickLink-ID:   ${noBlId}`);
  console.log(`  ohne Preisguide:     ${noData}`);
  console.log(`  frisch (skip):       ${skippedFresh}`);
  console.log(`  Fehler:              ${errors}`);
  if (tableMissing) {
    console.log(
      "[minifig] HINWEIS: minifig_prices fehlt noch - nach Deploy von supabase/minifig-prices.sql laeuft der Upsert."
    );
  }
}

main().catch((err) => {
  console.error(`[minifig] Abbruch: ${err?.message ?? err}`);
  process.exit(1);
});
