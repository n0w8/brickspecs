import { NextResponse } from "next/server";

/**
 * GET /api/sets/[setId]/parts
 *
 * setId ist die Katalog-Setnummer im "-1"-Format (z. B. "6552-1"). Liefert die
 * Teileliste des Sets aus der Rebrickable-API auf ein schlankes Format gemappt.
 *
 * Braucht REBRICKABLE_API_KEY (kostenloser Key auf rebrickable.com). Ohne Key
 * oder bei jedem Fehler: { available:false } mit Status 200 - die Detailseite
 * zeigt dann nur die Buy-Parts-Links, ohne zu brechen.
 *
 * Teile aendern sich praktisch nie -> aggressiv cachen (24h).
 */

export const runtime = "nodejs";

const REBRICKABLE_BASE = "https://rebrickable.com/api/v3/lego";
const MAX_PARTS = 300; // an den Client zurueckgegebene Teile (Rest via total)
const DAY = 86_400;

interface RebrickablePartEntry {
  id?: number;
  quantity?: number;
  is_spare?: boolean;
  element_id?: string | null;
  color?: { id?: number; name?: string };
  part?: {
    part_num?: string;
    name?: string;
    part_img_url?: string | null;
  };
}

interface RebrickableResponse {
  count?: number;
  results?: RebrickablePartEntry[];
}

export interface SetPart {
  id: string;
  name: string;
  color: string;
  qty: number;
  img: string | null;
  partNum: string;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ setId: string }> }
) {
  const { setId: raw } = await ctx.params;
  const setNum = decodeURIComponent(raw).trim();

  const key = process.env.REBRICKABLE_API_KEY;
  if (!key || !setNum) {
    return NextResponse.json({ available: false });
  }

  try {
    const res = await fetch(
      `${REBRICKABLE_BASE}/sets/${encodeURIComponent(setNum)}/parts/?page_size=1000`,
      {
        headers: {
          Authorization: `key ${key}`,
          Accept: "application/json",
        },
        // Teile sind statisch -> 24h cachen.
        next: { revalidate: DAY },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ available: false });
    }

    const data = (await res.json()) as RebrickableResponse;
    const entries = Array.isArray(data.results) ? data.results : [];

    // Ersatzteile (is_spare) rausfiltern, dann auf schlankes Format mappen.
    const mapped: SetPart[] = entries
      .filter((e) => !e.is_spare && e.part?.part_num)
      .map((e, i) => ({
        id: `${e.part?.part_num ?? "part"}-${e.color?.id ?? 0}-${i}`,
        name: e.part?.name ?? "",
        color: e.color?.name ?? "",
        qty: typeof e.quantity === "number" ? e.quantity : 1,
        img: e.part?.part_img_url ?? null,
        partNum: e.part?.part_num ?? "",
      }));

    return NextResponse.json({
      available: true,
      total: mapped.length,
      parts: mapped.slice(0, MAX_PARTS),
    });
  } catch {
    return NextResponse.json({ available: false });
  }
}
