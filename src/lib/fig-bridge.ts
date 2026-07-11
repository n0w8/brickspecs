// Brücke zwischen BrickLink-Minifiguren-IDs (z. B. "cas185", wie sie die
// Brickognize-Bilderkennung liefert) und Rebrickable-IDs (z. B. "fig-006583",
// wie sie unser Katalog nutzt). NUR aus Server-Code importieren.
//
// Zwei Wege, gleiche Quelle (Rebrickable kennt die BrickLink-IDs als
// externe IDs und findet sie über die Suche):
//   1. Mit REBRICKABLE_API_KEY: offizielle API /lego/minifigs/?search=<blId>
//   2. Ohne Key: HTML-Suche https://rebrickable.com/search/?q=<blId> -
//      bei exaktem Treffer leitet Rebrickable direkt auf die Figurenseite
//      /minifigs/fig-XXXXXX/... um; die fig-ID steckt in der Ziel-URL.
//
// Ergebnisse (auch Fehlschläge) werden im Prozess-Speicher gecacht, damit
// pro Figur höchstens eine externe Anfrage entsteht.

const TIMEOUT_MS = 6_000;
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

/** BrickLink-Fig-IDs sind kurz-alphanumerisch ("cas185", "sw0107", "hp150"). */
const BL_ID_RE = /^[a-z]{2,8}[0-9]{1,5}[a-z0-9]{0,4}$/i;

const cache = new Map<string, string | null>();

async function fetchWithTimeout(url: string, headers: Record<string, string>) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { headers, signal: controller.signal, redirect: "follow" });
  } finally {
    clearTimeout(timer);
  }
}

/** Weg 1: offizielle Rebrickable-API (nur bei genau einem Treffer vertrauen). */
async function viaApi(blId: string, apiKey: string): Promise<string | null> {
  const url = `https://rebrickable.com/api/v3/lego/minifigs/?search=${encodeURIComponent(blId)}&page_size=2`;
  const res = await fetchWithTimeout(url, {
    Authorization: `key ${apiKey}`,
    "User-Agent": "BrickSpecs/1.0 (Minifig-ID-Bruecke)",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { count?: number; results?: Array<{ set_num?: string }> };
  if (data.count === 1 && data.results?.[0]?.set_num?.startsWith("fig-")) {
    return data.results[0].set_num;
  }
  return null;
}

/** Weg 2: Such-Redirect der Rebrickable-Website. */
async function viaSearchRedirect(blId: string): Promise<string | null> {
  const url = `https://rebrickable.com/search/?q=${encodeURIComponent(blId)}`;
  const res = await fetchWithTimeout(url, { "User-Agent": BROWSER_UA });
  if (!res.ok) return null;
  const match = res.url.match(/\/minifigs\/(fig-\d+)\//);
  return match ? match[1] : null;
}

/**
 * Löst eine BrickLink-Fig-ID zur Rebrickable-ID auf (oder null).
 * Fehlschläge werden nicht geworfen, sondern als null gecacht -
 * der Scanner funktioniert dann einfach ohne Steckbrief-Link weiter.
 */
export async function resolveBrickLinkFig(blId: string): Promise<string | null> {
  const id = blId.trim().toLowerCase();
  if (!BL_ID_RE.test(id)) return null;

  const cached = cache.get(id);
  if (cached !== undefined) return cached;

  let figId: string | null = null;
  try {
    const apiKey = process.env.REBRICKABLE_API_KEY;
    figId = apiKey ? await viaApi(id, apiKey) : await viaSearchRedirect(id);
    if (!figId && apiKey) figId = await viaSearchRedirect(id);
  } catch {
    figId = null;
  }

  cache.set(id, figId);
  return figId;
}
