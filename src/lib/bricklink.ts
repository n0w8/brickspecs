// BrickLink Price-Guide-Client (server-only).
//
// Spricht die offizielle BrickLink Store-API v1 an und liefert den
// 6-Monats-Verkaufsschnitt eines Sets (guide_type=sold), getrennt nach neu (N)
// und gebraucht (U). Authentifizierung: OAuth 1.0 mit vorab ausgestelltem
// Token (kein Callback-Flow). Nutzt ausschliesslich node:crypto - keine neue
// Dependency. NUR aus Server-Code importieren.

import { createHmac, randomBytes } from "node:crypto";

const BASE_URL = "https://api.bricklink.com/api/store/v1";
const TIMEOUT_MS = 15_000;

export interface BLCredentials {
  consumerKey: string;
  consumerSecret: string;
  token: string;
  tokenSecret: string;
}

export interface SetPriceResult {
  /** 6-Monats-Verkaufsschnitt in EUR, oder null wenn kein Preisguide existiert. */
  avgEUR: number | null;
  /** Anzahl der zugrundeliegenden Verkaeufe (Stichprobengroesse). */
  qty: number;
}

/** Liefert die BrickLink-Zugangsdaten aus der Umgebung oder null, falls unvollstaendig. */
export function bricklinkCredentials(): BLCredentials | null {
  const consumerKey = process.env.BRICKLINK_CONSUMER_KEY;
  const consumerSecret = process.env.BRICKLINK_CONSUMER_SECRET;
  const token = process.env.BRICKLINK_TOKEN;
  const tokenSecret = process.env.BRICKLINK_TOKEN_SECRET;
  if (!consumerKey || !consumerSecret || !token || !tokenSecret) return null;
  return { consumerKey, consumerSecret, token, tokenSecret };
}

/**
 * RFC-3986-konforme Prozent-Kodierung. encodeURIComponent laesst ! * ' ( )
 * unkodiert - die muessen fuer eine gueltige OAuth-Signatur aber kodiert sein.
 */
function pctEnc(value: string): string {
  return encodeURIComponent(value).replace(
    /[!*'()]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

/**
 * Baut den Authorization-Header fuer einen signierten GET-Request. Die
 * Query-Parameter MUESSEN mit in den Signatur-Basisstring, sonst antwortet
 * BrickLink mit 401.
 */
function buildAuthHeader(
  creds: BLCredentials,
  urlWithoutQuery: string,
  query: Record<string, string>
): string {
  const oauth: Record<string, string> = {
    oauth_consumer_key: creds.consumerKey,
    oauth_token: creds.token,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_nonce: randomBytes(16).toString("hex"),
    oauth_version: "1.0",
  };

  // Signatur-Basisstring: alle OAuth- UND Query-Parameter alphabetisch sortiert.
  const allParams: Record<string, string> = { ...query, ...oauth };
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

class BrickLinkError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "BrickLinkError";
    this.status = status;
  }
}

/**
 * Holt den Verkaufs-Preisguide eines Sets (letzte 6 Monate).
 *
 * @param setNo   Katalog-Setnummer im BrickLink-Format inkl. Variante, z. B. "10305-1".
 * @param newOrUsed  "N" (neu/versiegelt) oder "U" (gebraucht).
 * @returns { avgEUR, qty }. avgEUR ist null, wenn kein Preisguide existiert
 *          (Set zu selten verkauft, meta.code 404) - das ist KEIN Fehler.
 * @throws  bei Netzwerkfehlern, Timeout oder API-Fehlern (z. B. 401/429) -
 *          damit die aufrufende Retry-/Skip-Logik reagieren kann.
 */
export async function getSetPrice(
  setNo: string,
  newOrUsed: "N" | "U"
): Promise<SetPriceResult> {
  const creds = bricklinkCredentials();
  if (!creds) throw new Error("BrickLink-Zugangsdaten fehlen (BRICKLINK_* nicht gesetzt)");

  const urlWithoutQuery = `${BASE_URL}/items/SET/${encodeURIComponent(setNo)}/price`;
  const query: Record<string, string> = {
    guide_type: "sold",
    new_or_used: newOrUsed,
    currency_code: "EUR",
  };

  const authHeader = buildAuthHeader(creds, urlWithoutQuery, query);
  const qs = Object.entries(query)
    .map(([k, v]) => `${pctEnc(k)}=${pctEnc(v)}`)
    .join("&");

  let res: Response;
  try {
    res = await fetch(`${urlWithoutQuery}?${qs}`, {
      headers: { Authorization: authHeader },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    throw new BrickLinkError(
      `BrickLink nicht erreichbar: ${err instanceof Error ? err.message : "Fehler"}`,
      0
    );
  }

  // Manche Fehler kommen als HTTP-Status (401 Signatur, 429 Rate-Limit).
  if (res.status === 404) return { avgEUR: null, qty: 0 };
  const text = await res.text();
  let json: {
    meta?: { code?: number; message?: string; description?: string };
    data?: {
      avg_price?: string;
      qty_avg_price?: string;
      unit_quantity?: number | string;
      total_quantity?: number | string;
    };
  };
  try {
    json = JSON.parse(text);
  } catch {
    throw new BrickLinkError(`BrickLink: ungueltige Antwort (HTTP ${res.status})`, res.status);
  }

  const code = json.meta?.code;
  // meta.code 404 = kein Preisguide (Set zu selten verkauft) -> keine Daten.
  if (code === 404) return { avgEUR: null, qty: 0 };
  if (code !== 200 || !json.data) {
    const detail = json.meta?.description ?? json.meta?.message ?? "Fehler";
    throw new BrickLinkError(`BrickLink meta ${code ?? res.status}: ${detail}`, res.status || 500);
  }

  const rawAvg = json.data.avg_price;
  const avg = rawAvg !== undefined && rawAvg !== "" ? Number(rawAvg) : NaN;
  const avgEUR = Number.isFinite(avg) && avg > 0 ? avg : null;

  const rawQty = json.data.unit_quantity ?? json.data.total_quantity ?? 0;
  const qtyNum = Number(rawQty);
  const qty = Number.isFinite(qtyNum) && qtyNum > 0 ? Math.round(qtyNum) : 0;

  return { avgEUR, qty };
}

// ===========================================================================
// Part-Out-Value: Teile- und Minifiguren-Preise + Set-Inventar
//
// Fuer den Teilewert eines Sets (Summe der Einzelpreise) brauchen wir drei
// zusaetzliche Endpunkte. Anders als getSetPrice nehmen diese die Credentials
// explizit entgegen (der Aufrufer baut sie einmal und reicht sie durch).
// guide_type=STOCK = aktueller Durchschnitt der ANGEBOTE (nicht "sold"):
// Einzelteile werden selten als "sold" gefuehrt, "stock" hat volle Abdeckung.
// ===========================================================================

export interface PartPriceResult {
  /** Aktueller Angebots-Durchschnitt in EUR, oder null wenn kein Guide existiert. */
  avgEUR: number | null;
  /** Anzahl der zugrundeliegenden Angebote (Stichprobengroesse). */
  qty: number;
}

export interface SubsetEntry {
  itemType: "PART" | "MINIFIG";
  no: string;
  /** BrickLink-Farb-ID (bei Minifiguren/farb-losen Teilen 0). */
  colorId: number;
  qty: number;
}

interface BLPriceData {
  avg_price?: string;
  unit_quantity?: number | string;
  total_quantity?: number | string;
}

interface BLSubsetEntry {
  item?: { no?: string; type?: string };
  color_id?: number | string;
  quantity?: number | string;
  is_alternate?: boolean;
  is_counterpart?: boolean;
}

interface BLSubsetGroup {
  entries?: BLSubsetEntry[];
}

/**
 * Signierter GET auf einen beliebigen BrickLink-Store-Endpunkt. Liefert
 * { code, data }. 404 (HTTP oder meta.code) -> { code:404, data:null } (kein
 * Fehler). Andere meta-Fehler bzw. Netzwerkfehler werfen (Retry/Skip beim
 * Aufrufer). Query-Parameter gehen zwingend in die Signatur ein.
 */
async function blSignedGet(
  creds: BLCredentials,
  urlWithoutQuery: string,
  query: Record<string, string>
): Promise<{ code: number; data: unknown }> {
  const authHeader = buildAuthHeader(creds, urlWithoutQuery, query);
  const qs = Object.entries(query)
    .map(([k, v]) => `${pctEnc(k)}=${pctEnc(v)}`)
    .join("&");
  const url = qs ? `${urlWithoutQuery}?${qs}` : urlWithoutQuery;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Authorization: authHeader },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    throw new BrickLinkError(
      `BrickLink nicht erreichbar: ${err instanceof Error ? err.message : "Fehler"}`,
      0
    );
  }

  if (res.status === 404) return { code: 404, data: null };
  const text = await res.text();
  let json: { meta?: { code?: number; message?: string; description?: string }; data?: unknown };
  try {
    json = JSON.parse(text);
  } catch {
    throw new BrickLinkError(`BrickLink: ungueltige Antwort (HTTP ${res.status})`, res.status);
  }

  const code = json.meta?.code;
  if (code === 404) return { code: 404, data: null };
  if (code !== 200) {
    const detail = json.meta?.description ?? json.meta?.message ?? "Fehler";
    throw new BrickLinkError(`BrickLink meta ${code ?? res.status}: ${detail}`, res.status || 500);
  }
  return { code: 200, data: json.data ?? null };
}

function parsePriceData(data: unknown): PartPriceResult {
  const d = (data ?? null) as BLPriceData | null;
  if (!d) return { avgEUR: null, qty: 0 };
  const rawAvg = d.avg_price;
  const avg = rawAvg !== undefined && rawAvg !== "" ? Number(rawAvg) : NaN;
  const avgEUR = Number.isFinite(avg) && avg > 0 ? avg : null;
  const rawQty = d.unit_quantity ?? d.total_quantity ?? 0;
  const qtyNum = Number(rawQty);
  const qty = Number.isFinite(qtyNum) && qtyNum > 0 ? Math.round(qtyNum) : 0;
  return { avgEUR, qty };
}

/**
 * Angebots-Durchschnitt eines Einzelteils. color_id MUSS mitgegeben werden
 * (steckt in Query UND Signatur-Basisstring). 404/leer -> avgEUR null.
 */
export async function getPartPrice(
  creds: BLCredentials,
  partNo: string,
  colorId: number,
  newOrUsed: "N" | "U"
): Promise<PartPriceResult> {
  const urlWithoutQuery = `${BASE_URL}/items/PART/${encodeURIComponent(partNo)}/price`;
  const query: Record<string, string> = {
    guide_type: "stock",
    new_or_used: newOrUsed,
    color_id: String(colorId),
    currency_code: "EUR",
  };
  const { data } = await blSignedGet(creds, urlWithoutQuery, query);
  return parsePriceData(data);
}

/** Angebots-Durchschnitt einer Minifigur (ohne color_id). 404/leer -> null. */
export async function getMinifigPrice(
  creds: BLCredentials,
  minifigNo: string,
  newOrUsed: "N" | "U"
): Promise<PartPriceResult> {
  const urlWithoutQuery = `${BASE_URL}/items/MINIFIG/${encodeURIComponent(minifigNo)}/price`;
  const query: Record<string, string> = {
    guide_type: "stock",
    new_or_used: newOrUsed,
    currency_code: "EUR",
  };
  const { data } = await blSignedGet(creds, urlWithoutQuery, query);
  return parsePriceData(data);
}

/**
 * Set-Inventar (Teile + Minifiguren) ueber /items/SET/{no}/subsets. data ist
 * ein Array von Match-Gruppen mit .entries[]. Alternativteile (is_alternate)
 * und Gegenstuecke (is_counterpart) werden ausgelassen, damit jedes physische
 * Teil genau einmal zaehlt; identische (Typ,Nr,Farbe) werden aufsummiert.
 * 404/leer -> [].
 */
export async function getSetSubsets(
  creds: BLCredentials,
  setNo: string
): Promise<SubsetEntry[]> {
  const urlWithoutQuery = `${BASE_URL}/items/SET/${encodeURIComponent(setNo)}/subsets`;
  const { data } = await blSignedGet(creds, urlWithoutQuery, {});
  if (!Array.isArray(data)) return [];

  const agg = new Map<string, SubsetEntry>();
  for (const group of data as BLSubsetGroup[]) {
    const entries = Array.isArray(group?.entries) ? group.entries : [];
    for (const e of entries) {
      if (e?.is_alternate || e?.is_counterpart) continue;
      const type = e?.item?.type;
      if (type !== "PART" && type !== "MINIFIG") continue;
      const no = e?.item?.no;
      if (!no) continue;
      const colorId = Number(e?.color_id ?? 0) || 0;
      const qty = Number(e?.quantity ?? 0) || 0;
      if (qty <= 0) continue;
      const key = `${type}|${no}|${colorId}`;
      const prev = agg.get(key);
      if (prev) prev.qty += qty;
      else agg.set(key, { itemType: type, no, colorId, qty });
    }
  }
  return [...agg.values()];
}
