import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * POST /api/sets/[setId]/view
 *
 * Zaehlt den Seitenaufruf eines Sets hoch und liefert die oeffentliche
 * Statistik zurueck. Zaehlung und Sammler-Aggregat laufen ueber SECURITY-
 * DEFINER-Funktionen (increment_set_view, set_holder_count), aufgerufen mit
 * dem service_role-Client.
 *
 * Antwort IMMER 200 mit { views:number|null, holders:number|null }. Ohne
 * Supabase-Konfiguration oder solange das Schema (Tabelle set_views + die
 * Funktionen) noch nicht deployt ist, kommt { views:null, holders:null } -
 * bewusst kein 500, damit die oeffentliche Detailseite nie bricht.
 */
export async function POST(
  _req: Request,
  ctx: { params: Promise<{ setId: string }> }
) {
  const { setId: raw } = await ctx.params;
  const setId = decodeURIComponent(raw);

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ views: null, holders: null });
  }

  let views: number | null = null;
  let holders: number | null = null;

  try {
    const [viewRes, holderRes] = await Promise.all([
      admin.rpc("increment_set_view", { p_set_id: setId }),
      admin.rpc("set_holder_count", { p_set_id: setId }),
    ]);

    if (!viewRes.error && typeof viewRes.data === "number") {
      views = viewRes.data;
    }
    if (!holderRes.error && typeof holderRes.data === "number") {
      holders = holderRes.data;
    }
  } catch {
    // Funktionen noch nicht deployt o. Netzfehler -> null/null, kein 500.
  }

  return NextResponse.json({ views, holders });
}
