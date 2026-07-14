// Zuordnung kuratierte Minifigur <-> Katalog-Figur über Namens-Token.
// Reines String-Modul (kein fs) - darf auch in Client-Komponenten verwendet
// werden. Gleiche Logik wie in scripts/check-curated-figs.mjs.

const STOP_WORDS = new Set([
  "the", "and", "with", "on", "in", "of", "for", "a", "an",
  "der", "die", "das", "und", "mit", "von",
]);

// Zu generisch, um eine Zuordnung allein zu tragen (Gewicht 1 statt 2):
const GENERIC_TOKENS = new Set([
  "knight", "castle", "man", "woman", "boy", "girl", "classic", "figure",
  "minifig", "lego", "black", "white", "red", "blue", "yellow", "green",
  "gray", "grey", "dark", "light", "brown", "tan", "legs", "torso", "head",
  "helmet", "hair", "cape", "outfit", "era",
]);

export function nameTokens(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9äöüß]+/g, " ")
    .split(" ")
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w) && !/^\d+$/.test(w));
}

/** Klammerzusätze entfernen: "Boba Fett (Cloud City)" -> "Boba Fett" */
function stripParens(name: string): string {
  return name.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
}

export interface MatchCandidate {
  id: string;
  name: string;
}

interface Scored<T> {
  best: T | null;
  tie: boolean;
  score: number;
  nonGeneric: number;
}

function scoreCandidates<T extends MatchCandidate>(
  curTokens: string[],
  candidates: T[]
): Scored<T> {
  const cur = new Set(curTokens);
  let best: T | null = null;
  let bestScore = 0;
  let bestNonGeneric = 0;
  let tie = false;
  for (const cand of candidates) {
    const candTokens = new Set(nameTokens(cand.name));
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

/**
 * Findet für eine kuratierte Figur die EINDEUTIG beste Katalog-Figur eines
 * Sets (oder null). Kriterien:
 *  1. Exakter Namenstreffer (ohne Klammerzusatz) -> sofortige Zuordnung,
 *     wenn genau ein Kandidat so heißt.
 *  2. Gewichtete Token-Überlappung (aussagekräftige Token zählen doppelt):
 *     eindeutig bestes Ergebnis, Score >= 2 und mindestens ein
 *     nicht-generisches gemeinsames Token.
 *  3. Bei Gleichstand: erneuter Versuch ohne Klammerzusatz im kuratierten
 *     Namen ("Boba Fett (Cloud City)" -> "Boba Fett").
 */
export function matchCuratedToCatalog<T extends MatchCandidate>(
  curatedNameEn: string,
  candidates: T[]
): T | null {
  if (candidates.length === 0) return null;

  // 1) Exakter Namenstreffer
  const stripped = stripParens(curatedNameEn).toLowerCase();
  if (stripped) {
    const exact = candidates.filter((c) => c.name.trim().toLowerCase() === stripped);
    if (exact.length === 1) return exact[0];
  }

  const accept = (r: Scored<T>): T | null =>
    r.best && !r.tie && r.score >= 2 && r.nonGeneric >= 1 ? r.best : null;

  // 2) Voller kuratierter Name
  const full = scoreCandidates(nameTokens(curatedNameEn), candidates);
  const fullHit = accept(full);
  if (fullHit) return fullHit;

  // 3) Fallback ohne Klammerzusatz (nur wenn der etwas ändert)
  const strippedTokens = nameTokens(stripped);
  if (strippedTokens.length > 0 && stripped !== curatedNameEn.toLowerCase().trim()) {
    return accept(scoreCandidates(strippedTokens, candidates));
  }
  return null;
}
