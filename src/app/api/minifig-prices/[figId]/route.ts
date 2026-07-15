import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * Liefert die BrickLink-Minifiguren-Preise (6-Monats-Verkaufsschnitt, neu +
 * gebraucht) fuer eine Figur. figId ist entweder die Rebrickable-ID
 * ("fig-006583") - so kommt sie von der Katalog-Seite - oder die BrickLink-ID
 * ("sw0107"), wie sie kuratierte Figuren tragen. Wir suchen daher ueber beide
 * Spalten. Antwortet IMMER mit 200 (nie 500): faellt etwas aus, kommt der
 * ehrliche Demo-Modus zurueck.
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ figId: string }> }
) {
  const { figId } = await ctx.params;

  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ figId, mode: "demo" });
    }

    const { data, error } = await supabase
      .from("minifig_prices")
      .select("fig_id, bricklink_id, new_eur, used_eur, new_qty, used_qty")
      .or(`fig_id.eq.${figId},bricklink_id.eq.${figId}`)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ figId, mode: "demo" });
    }

    // Nur "live", wenn tatsaechlich mindestens ein Preis vorliegt. Eine reine
    // ID-Bruecken-Zeile (bricklink_id gesetzt, aber noch kein Preis) bleibt demo.
    const hasPrice = data.new_eur != null || data.used_eur != null;
    if (!hasPrice) {
      return NextResponse.json({ figId, mode: "demo" });
    }

    return NextResponse.json({
      figId,
      newEUR: data.new_eur != null ? Number(data.new_eur) : null,
      usedEUR: data.used_eur != null ? Number(data.used_eur) : null,
      newQty: data.new_qty ?? 0,
      usedQty: data.used_qty ?? 0,
      mode: "live",
    });
  } catch {
    return NextResponse.json({ figId, mode: "demo" });
  }
}
