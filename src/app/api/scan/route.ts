import { NextRequest, NextResponse } from "next/server";
import { figsInSet, getCatalogFig } from "@/lib/minifig-catalog";
import { getCatalogSet } from "@/lib/catalog";
import { resolveBrickLinkFig } from "@/lib/fig-bridge";
import { MINIFIGS } from "@/data/minifigs";

/**
 * POST /api/scan - Foto-Erkennung über die öffentliche Brickognize-API.
 *
 * Nimmt formData mit "image" (File) entgegen und fragt parallel
 * /predict/sets/ (beste Set-Treffer) und /predict/ (alle Typen, inkl.
 * Minifiguren und Teile) ab. Antwort wird auf ein schlankes Format
 * gemappt: { items: [{ id, name, score, img, type }] } - Sets zuerst,
 * Score absteigend, max. 8 Treffer.
 *
 * Brickognize-IDs sind Rebrickable-Style ("10188-1", "fig-000123") und
 * passen damit direkt auf /lexikon/{id} bzw. /minifiguren/{id}.
 */

export const runtime = "nodejs";

const BRICKOGNIZE_BASE = "https://api.brickognize.com";
const MAX_BYTES = 10 * 1024 * 1024; // ~10 MB
const TIMEOUT_MS = 20_000;
const MAX_ITEMS = 8;
const USER_AGENT = "BrickSpecs/1.0 (LEGO-Portal Set-Scanner)";

interface BrickognizeItem {
  id: string;
  name: string;
  img_url: string;
  type: "set" | "part" | "fig" | "sticker";
  category: string | null;
  score: number;
}

interface BrickognizeResponse {
  listing_id?: string;
  items?: BrickognizeItem[];
}

export interface ScanItem {
  id: string;
  name: string;
  /** Nur bei Sets: deutscher Katalogname, falls er vom englischen abweicht */
  nameDe?: string;
  score: number;
  img: string;
  type: string;
  /** Nur bei Minifiguren: Sets, in denen die Figur vorkommt (max. 8) */
  sets?: string[];
  /** Nur bei Minifiguren: Gesamtzahl der Sets */
  setCount?: number;
  /** Nur bei Minifiguren: existiert eine Steckbrief-Seite bei uns? */
  known?: boolean;
  /** Nur bei Minifiguren: Katalog-ID ("fig-..."), falls die Erkennung eine BrickLink-ID lieferte */
  figId?: string;
  /** Nur bei Sets: enthaltene Minifiguren (max. 8) */
  figs?: Array<{ id: string; name: string; img: string }>;
  /** Nur bei Sets: Gesamtzahl der Minifiguren */
  figCount?: number;
}

function jsonError(status: number, error: string, message: string) {
  return NextResponse.json({ error, message }, { status });
}

/** Schickt das Bild an einen Brickognize-Predict-Endpunkt. */
async function predict(
  path: string,
  image: File,
  signal: AbortSignal
): Promise<BrickognizeItem[]> {
  const form = new FormData();
  form.append("query_image", image, image.name || "scan.jpg");

  const res = await fetch(`${BRICKOGNIZE_BASE}${path}`, {
    method: "POST",
    headers: { "User-Agent": USER_AGENT },
    body: form,
    signal,
  });

  if (res.status === 429) {
    throw Object.assign(new Error("rate_limited"), { code: 429 });
  }
  if (!res.ok) {
    throw Object.assign(new Error(`upstream_${res.status}`), { code: 502 });
  }

  const data = (await res.json()) as BrickognizeResponse;
  return Array.isArray(data.items) ? data.items : [];
}

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonError(400, "bad_request", "Ungültige Anfrage: multipart/form-data mit Feld 'image' erwartet.");
  }

  const image = form.get("image");
  if (!(image instanceof File) || image.size === 0) {
    return jsonError(400, "no_image", "Kein Bild übermittelt. Feld 'image' (File) erwartet.");
  }
  if (image.size > MAX_BYTES) {
    return jsonError(413, "too_large", "Das Bild ist zu groß (max. 10 MB).");
  }
  if (image.type && !image.type.startsWith("image/")) {
    return jsonError(415, "not_an_image", "Nur Bilddateien (image/*) werden unterstützt.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    // Sets-Endpunkt für die besten Set-Treffer, allgemeiner Endpunkt
    // zusätzlich für Minifiguren-/Teile-Treffer.
    const [setsResult, allResult] = await Promise.allSettled([
      predict("/predict/sets/", image, controller.signal),
      predict("/predict/", image, controller.signal),
    ]);

    if (setsResult.status === "rejected" && allResult.status === "rejected") {
      const reason = setsResult.reason as { code?: number; name?: string; message?: string };
      if (controller.signal.aborted || reason?.name === "AbortError") {
        return jsonError(504, "timeout", "Die Erkennung hat zu lange gedauert. Bitte versuche es erneut.");
      }
      if (reason?.code === 429) {
        return jsonError(429, "rate_limited", "Zu viele Anfragen an die Erkennung. Bitte warte kurz und versuche es erneut.");
      }
      return jsonError(502, "upstream_error", "Die Brickognize-Erkennung ist gerade nicht erreichbar.");
    }

    // Zusammenführen und nach ID deduplizieren (höchster Score gewinnt).
    const merged = new Map<string, BrickognizeItem>();
    for (const result of [setsResult, allResult]) {
      if (result.status !== "fulfilled") continue;
      for (const item of result.value) {
        if (!item?.id || typeof item.score !== "number") continue;
        const existing = merged.get(item.id);
        if (!existing || item.score > existing.score) merged.set(item.id, item);
      }
    }

    const items: ScanItem[] = await Promise.all(
      Array.from(merged.values())
        .sort((a, b) => {
          // Sets zuerst, danach Score absteigend.
          if ((a.type === "set") !== (b.type === "set")) {
            return a.type === "set" ? -1 : 1;
          }
          return b.score - a.score;
        })
        .slice(0, MAX_ITEMS)
        .map(async (item) => {
          const base: ScanItem = {
            id: item.id,
            name: item.name,
            score: item.score,
            img: item.img_url,
            type: item.type,
          };
          // Sets: deutschen Katalognamen und enthaltene Minifiguren mitliefern.
          if (item.type === "set") {
            const catalogEntry = getCatalogSet(item.id);
            if (catalogEntry?.d) base.nameDe = catalogEntry.d;
            const setFigs = figsInSet(item.id);
            if (setFigs.length > 0) {
              base.figs = setFigs.slice(0, 8).map((f) => ({ id: f.n, name: f.t, img: f.i }));
              base.figCount = setFigs.length;
            }
          }
          // Minifiguren: Set-Zuordnung direkt mitliefern. Brickognize liefert
          // BrickLink-IDs (z. B. "cas185"); der Rebrickable-Katalog nutzt
          // "fig-..."-IDs. Reihenfolge: Katalog direkt, dann kuratierte
          // Figuren, dann die BrickLink→Rebrickable-Brücke (fig-bridge).
          if (item.type === "fig") {
            let fig = getCatalogFig(item.id);
            const curated = fig ? null : (MINIFIGS.find((f) => f.id === item.id) ?? null);
            if (!fig && !curated) {
              const bridged = await resolveBrickLinkFig(item.id);
              if (bridged) {
                fig = getCatalogFig(bridged);
                if (fig) base.figId = fig.n;
              }
            }
            base.known = Boolean(fig || curated);
            if (fig && fig.s.length > 0) {
              base.sets = fig.s.slice(0, 8);
              base.setCount = fig.s.length;
            } else if (curated && curated.appearsInSetIds.length > 0) {
              base.sets = curated.appearsInSetIds.slice(0, 8);
              base.setCount = curated.appearsInSetIds.length;
            }
          }
          return base;
        })
    );

    return NextResponse.json({ items });
  } catch (err) {
    const e = err as { name?: string; code?: number };
    if (controller.signal.aborted || e?.name === "AbortError") {
      return jsonError(504, "timeout", "Die Erkennung hat zu lange gedauert. Bitte versuche es erneut.");
    }
    if (e?.code === 429) {
      return jsonError(429, "rate_limited", "Zu viele Anfragen an die Erkennung. Bitte warte kurz und versuche es erneut.");
    }
    return jsonError(502, "upstream_error", "Die Brickognize-Erkennung ist gerade nicht erreichbar.");
  } finally {
    clearTimeout(timer);
  }
}
