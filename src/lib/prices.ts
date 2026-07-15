// Preis-Schicht: Durchschnittspreise pro Land & Quelle.
//
// Modus "live":  BrickLink 6-Monats-Verkaufsschnitt (neu + gebraucht) aus der
//                Tabelle public.set_prices in Supabase. Befuellt vom taeglichen
//                Sync-Job (scripts/sync-bricklink-prices.mjs). Solange fuer ein
//                Set noch keine Zeile existiert, faellt die Anzeige auf den
//                ehrlichen Demo-Platzhalter zurueck.
// Modus "demo":  Kein irrefuehrender Zahlenwert - PricePanel zeigt einen
//                Platzhalter ("echte Marktdaten folgen").
//
// eBay-Verkaufsdaten liegen uns NICHT vor - fuer source=ebay-sold bleibt es
// daher immer bei Modus "demo" (wir erfinden keine Werte).

import { SETS } from "@/data/sets";
import { curatedForCatalogId, getCatalogSet } from "@/lib/catalog";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export type PriceSource = "bricklink" | "ebay-sold";

export interface CountryInfo {
  code: string;
  label: { de: string; en: string };
  /** Preisniveau relativ zu DE (Demo-Modell) */
  factor: number;
}

export const COUNTRIES: CountryInfo[] = [
  { code: "DE", label: { de: "Deutschland", en: "Germany" }, factor: 1.0 },
  { code: "AT", label: { de: "Österreich", en: "Austria" }, factor: 1.03 },
  { code: "CH", label: { de: "Schweiz", en: "Switzerland" }, factor: 1.14 },
  { code: "US", label: { de: "USA", en: "United States" }, factor: 0.97 },
  { code: "GB", label: { de: "Großbritannien", en: "United Kingdom" }, factor: 0.93 },
  { code: "FR", label: { de: "Frankreich", en: "France" }, factor: 1.04 },
  { code: "NL", label: { de: "Niederlande", en: "Netherlands" }, factor: 1.02 },
  { code: "IT", label: { de: "Italien", en: "Italy" }, factor: 1.01 },
  { code: "ES", label: { de: "Spanien", en: "Spain" }, factor: 0.99 },
  { code: "PL", label: { de: "Polen", en: "Poland" }, factor: 0.89 },
];

export interface PriceResult {
  setId: string;
  source: PriceSource;
  country: string;
  currency: "EUR";
  avgNewEUR: number | null;
  avgUsedEUR: number | null;
  samplesNew: number;
  samplesUsed: number;
  mode: "live" | "demo";
  note?: string;
}

/* ---------- Demo-Modell ---------- */

/** Deterministischer Hash → 0..1, damit Demo-Preise stabil bleiben. */
function hash01(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

function demoPrices(catalogId: string, source: PriceSource, country: string): PriceResult {
  const countryInfo = COUNTRIES.find((c) => c.code === country) ?? COUNTRIES[0];
  const curated =
    curatedForCatalogId(catalogId) ??
    SETS.find((s) => s.id === catalogId.replace(/-\d+$/, "")) ??
    null;
  const entry = getCatalogSet(catalogId);

  let baseNew: number | null = null;
  let baseUsed: number | null = null;

  if (curated?.currentValueNewEUR) {
    baseNew = curated.currentValueNewEUR;
    baseUsed = curated.currentValueUsedEUR ?? Math.round(baseNew * 0.55);
  } else if (entry && entry.p > 0) {
    const age = Math.max(0, new Date().getFullYear() - entry.y);
    const jitter = 0.85 + hash01(entry.n) * 0.3;
    const retirementBoost = age > 3 ? 1 + Math.min(2.2, age * 0.055) : 1;
    baseNew = Math.max(5, Math.round(entry.p * 0.088 * retirementBoost * jitter));
    baseUsed = Math.round(baseNew * (age > 10 ? 0.5 : 0.62));
  }

  const sourceFactor = source === "ebay-sold" ? 0.88 : 1.0;
  const f = countryInfo.factor * sourceFactor;
  const seed = hash01(`${catalogId}:${source}:${country}`);

  return {
    setId: catalogId,
    source,
    country: countryInfo.code,
    currency: "EUR",
    avgNewEUR: baseNew !== null ? Math.round(baseNew * f) : null,
    avgUsedEUR: baseUsed !== null ? Math.round(baseUsed * f) : null,
    samplesNew: baseNew !== null ? 4 + Math.floor(seed * 46) : 0,
    samplesUsed: baseUsed !== null ? 6 + Math.floor(seed * 70) : 0,
    mode: "demo",
  };
}

/* ---------- BrickLink Live-Daten aus Supabase (set_prices) ---------- */

interface SetPriceRow {
  new_eur: number | string | null;
  used_eur: number | string | null;
  new_qty: number | null;
  used_qty: number | null;
}

function toNum(v: number | string | null): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Liest die vom Sync-Job befuellte set_prices-Zeile (6-Monats-Verkaufsschnitt).
 * Liefert null, wenn Supabase nicht konfiguriert ist, keine Zeile existiert
 * oder die Tabelle noch nicht deployt wurde.
 */
async function livePriceFromDb(catalogId: string): Promise<SetPriceRow | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  try {
    const { data, error } = await admin
      .from("set_prices")
      .select("new_eur, used_eur, new_qty, used_qty")
      .eq("set_id", catalogId)
      .maybeSingle();
    if (error || !data) return null;
    return data as SetPriceRow;
  } catch {
    return null;
  }
}

/* ---------- Öffentliche API ---------- */

export async function getPrices(
  setId: string,
  source: PriceSource,
  country: string
): Promise<PriceResult> {
  const entry = getCatalogSet(setId);
  // Lookup-Schluessel = Katalog-ID im BrickLink-Format ("10305-1"). setId kann
  // kuratiert ("10305") oder Katalog ("10305-1") sein - beide normalisieren.
  const catalogId = entry?.n ?? (/-\d+$/.test(setId) ? setId : `${setId}-1`);

  // eBay-Verkaufsdaten haben wir nicht -> immer ehrlicher Demo-Platzhalter.
  if (source === "bricklink") {
    const row = await livePriceFromDb(catalogId);
    if (row) {
      const avgNew = toNum(row.new_eur);
      const avgUsed = toNum(row.used_eur);
      if (avgNew !== null || avgUsed !== null) {
        return {
          setId: catalogId,
          source,
          country,
          currency: "EUR",
          avgNewEUR: avgNew !== null ? Math.round(avgNew) : null,
          avgUsedEUR: avgUsed !== null ? Math.round(avgUsed) : null,
          samplesNew: row.new_qty ?? 0,
          samplesUsed: row.used_qty ?? 0,
          mode: "live",
        };
      }
    }
  }

  return demoPrices(catalogId, source, country);
}
