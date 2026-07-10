import type { Lang, LegoSet } from "@/data/types";

export function formatEUR(value: number | null | undefined, lang: Lang = "de"): string {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat(lang === "de" ? "de-DE" : "en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);
}

export function formatDate(iso: string, lang: Lang = "de"): string {
  const d = new Date(iso);
  return d.toLocaleDateString(lang === "de" ? "de-DE" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Prozentuale Wertsteigerung gegenüber UVP, null wenn nicht berechenbar. */
export function growthPercent(set: LegoSet): number | null {
  if (!set.retailPriceEUR || !set.currentValueNewEUR) return null;
  return Math.round(
    ((set.currentValueNewEUR - set.retailPriceEUR) / set.retailPriceEUR) * 100
  );
}

const HOT_THEMES = new Set([
  "Star Wars",
  "Icons",
  "Creator Expert",
  "Modular Buildings",
  "Harry Potter",
  "Castle",
  "Trains",
  "Eisenbahn",
  "Space",
]);

/**
 * Einfacher heuristischer Investment-Score (0-100).
 * Faktoren: bisherige Wertsteigerung p. a., Verfügbarkeit, Thema, Minifiguren.
 * Phase 1: bewusst simpel und deterministisch - kein Finanz-Ratgeber.
 */
export function investmentScore(set: LegoSet): number {
  let score = 40;

  const growth = growthPercent(set);
  if (growth !== null) {
    const years = Math.max(1, (set.eolYear ?? 2026) - set.year);
    const perYear = growth / years;
    score += Math.max(-15, Math.min(30, perYear));
  }

  if (set.availability === "retiring-soon") score += 15;
  if (set.availability === "retired") score += 5;
  if (HOT_THEMES.has(set.theme)) score += 8;
  if (set.minifigCount >= 4) score += 5;
  if (set.pieces >= 2000) score += 4;

  return Math.max(0, Math.min(100, Math.round(score)));
}
