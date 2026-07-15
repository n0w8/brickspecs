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

interface BLCredentials {
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
