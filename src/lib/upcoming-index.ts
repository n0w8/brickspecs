// Aggregiert die angekündigten/geleakten Sets aus UPCOMING nach Erscheinungsjahr,
// damit die Jahrgaenge-Ansicht auch Zukunftsjahre (z. B. 2027) sinnvoll fuellen kann.
// Client-safe: importiert nur die statischen Daten, keine Server-APIs.

import { UPCOMING, type UpcomingSet } from "@/data/upcoming";

/**
 * Parst robust das Jahr aus einem Release-Fenster-String.
 * Akzeptiert z. B. "2026-08", "H2 2027", "Ende 2027", "2027".
 * Nimmt das erste Vorkommen von 20xx. Gibt null zurueck, wenn kein Jahr gefunden wird.
 */
export function upcomingYear(window: string): number | null {
  const match = /20\d\d/.exec(window);
  return match ? Number(match[0]) : null;
}

/** Gruppiert alle UPCOMING-Sets nach ihrem Erscheinungsjahr. */
export function upcomingByYear(): Record<number, UpcomingSet[]> {
  const byYear: Record<number, UpcomingSet[]> = {};
  for (const set of UPCOMING) {
    const year = upcomingYear(set.window);
    if (year === null) continue;
    (byYear[year] ??= []).push(set);
  }
  return byYear;
}

/** Anzahl angekuendigter Sets je Jahr. */
export function upcomingCountByYear(): Record<number, number> {
  const counts: Record<number, number> = {};
  const byYear = upcomingByYear();
  for (const [year, sets] of Object.entries(byYear)) {
    counts[Number(year)] = sets.length;
  }
  return counts;
}
