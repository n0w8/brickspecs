// Aggregiert die angekündigten/geleakten Sets aus UPCOMING nach Erscheinungsjahr.
// Die Jahrgaenge-Seite nutzt das nur noch als "+N angekündigt"-Hinweis auf den
// Jahres-Kacheln - die eigentlichen Karten leben im Neuheiten-Radar (/neuheiten).
// Client-safe: importiert nur die statischen Daten, keine Server-APIs.

import { UPCOMING } from "@/data/upcoming";

/**
 * Parst robust das Jahr aus einem Release-Fenster-String.
 * Akzeptiert z. B. "2026-08", "H2 2027", "Ende 2027", "2027".
 * Nimmt das erste Vorkommen von 20xx. Gibt null zurueck, wenn kein Jahr gefunden wird.
 */
export function upcomingYear(window: string): number | null {
  const match = /20\d\d/.exec(window);
  return match ? Number(match[0]) : null;
}

/** Anzahl angekuendigter Sets je Jahr. */
export function upcomingCountByYear(): Record<number, number> {
  const counts: Record<number, number> = {};
  for (const set of UPCOMING) {
    const year = upcomingYear(set.window);
    if (year === null) continue;
    counts[year] = (counts[year] ?? 0) + 1;
  }
  return counts;
}
