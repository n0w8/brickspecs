// Preis-Schicht: Durchschnittspreise pro Land & Quelle.
//
// Modus "live":  BrickLink Price Guide API (sobald BRICKLINK_*-Env-Keys gesetzt
//                sind - Seller-Konto mit API-Freischaltung nötig).
// Modus "demo":  Deterministisches Schätzmodell auf Basis kuratierter Werte
//                bzw. Teilezahl/Alter - klar als Demo gekennzeichnet.
//
// eBay-Verkaufsdaten: Die offizielle "Marketplace Insights"-API ist
// zugangsbeschränkt; der Adapter ist vorbereitet und fällt bis zur
// Freischaltung auf das Demo-Modell zurück.

import { createHmac, randomBytes } from "node:crypto";
import { SETS } from "@/data/sets";
import { curatedForCatalogId, getCatalogSet } from "@/lib/catalog";

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

/* ---------- BrickLink Live-Adapter (OAuth 1.0a) ---------- */

interface BLCredentials {
  consumerKey: string;
  consumerSecret: string;
  tokenValue: string;
  tokenSecret: string;
}

function blCredentials(): BLCredentials | null {
  const {
    BRICKLINK_CONSUMER_KEY: consumerKey,
    BRICKLINK_CONSUMER_SECRET: consumerSecret,
    BRICKLINK_TOKEN_VALUE: tokenValue,
    BRICKLINK_TOKEN_SECRET: tokenSecret,
  } = process.env;
  if (!consumerKey || !consumerSecret || !tokenValue || !tokenSecret) return null;
  return { consumerKey, consumerSecret, tokenValue, tokenSecret };
}

function pctEnc(s: string): string {
  return encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

async function blPriceGuide(
  creds: BLCredentials,
  setNo: string,
  condition: "N" | "U",
  country: string
): Promise<{ avg: number; count: number } | null> {
  const url = `https://api.bricklink.com/api/store/v1/items/SET/${setNo}/price`;
  const query: Record<string, string> = {
    guide_type: "sold",
    new_or_used: condition,
    country_code: country,
    currency_code: "EUR",
  };
  const oauth: Record<string, string> = {
    oauth_consumer_key: creds.consumerKey,
    oauth_token: creds.tokenValue,
    oauth_nonce: randomBytes(16).toString("hex"),
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_signature_method: "HMAC-SHA1",
    oauth_version: "1.0",
  };
  const allParams = { ...query, ...oauth };
  const paramString = Object.keys(allParams)
    .sort()
    .map((k) => `${pctEnc(k)}=${pctEnc(allParams[k])}`)
    .join("&");
  const baseString = `GET&${pctEnc(url)}&${pctEnc(paramString)}`;
  const signingKey = `${pctEnc(creds.consumerSecret)}&${pctEnc(creds.tokenSecret)}`;
  const signature = createHmac("sha1", signingKey).update(baseString).digest("base64");

  const authHeader =
    "OAuth " +
    Object.entries({ ...oauth, oauth_signature: signature })
      .map(([k, v]) => `${pctEnc(k)}="${pctEnc(v)}"`)
      .join(",");

  const qs = new URLSearchParams(query).toString();
  const res = await fetch(`${url}?${qs}`, {
    headers: { Authorization: authHeader },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`BrickLink API: HTTP ${res.status}`);
  const json = (await res.json()) as {
    meta: { code: number };
    data?: { avg_price: string; total_quantity: number };
  };
  if (json.meta.code !== 200 || !json.data) return null;
  return { avg: Number(json.data.avg_price), count: json.data.total_quantity };
}

/* ---------- Öffentliche API ---------- */

export async function getPrices(
  setId: string,
  source: PriceSource,
  country: string
): Promise<PriceResult> {
  const entry = getCatalogSet(setId);
  const catalogId = entry?.n ?? setId;

  const creds = blCredentials();
  if (source === "bricklink" && creds) {
    try {
      const [priceNew, priceUsed] = await Promise.all([
        blPriceGuide(creds, catalogId, "N", country),
        blPriceGuide(creds, catalogId, "U", country),
      ]);
      return {
        setId: catalogId,
        source,
        country,
        currency: "EUR",
        avgNewEUR: priceNew ? Math.round(priceNew.avg) : null,
        avgUsedEUR: priceUsed ? Math.round(priceUsed.avg) : null,
        samplesNew: priceNew?.count ?? 0,
        samplesUsed: priceUsed?.count ?? 0,
        mode: "live",
      };
    } catch (err) {
      const fallback = demoPrices(catalogId, source, country);
      fallback.note = `BrickLink-API nicht erreichbar (${err instanceof Error ? err.message : "Fehler"}) - Demo-Werte.`;
      return fallback;
    }
  }

  return demoPrices(catalogId, source, country);
}
