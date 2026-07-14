import { NextResponse } from "next/server";

import { getSupabaseAdmin, getSupabaseServer } from "@/lib/supabase/server";

/**
 * POST /api/referral/claim  { code: string }
 *
 * Ordnet den eingeloggten Nutzer dem Inhaber des Referral-Codes zu
 * (profiles.referred_by). Regeln:
 * - nur eingeloggt (Supabase-Session),
 * - Code muss existieren und darf nicht der eigene sein,
 * - referred_by wird NUR gesetzt, wenn es noch null ist (erste Zuordnung zaehlt).
 *
 * Antworten: 200 { ok, claimed } - claimed=false, wenn bereits zugeordnet.
 * 400/404 sind endgueltig (Client entfernt den Marker), 503 ohne Konfiguration.
 */
export async function POST(request: Request) {
  const supabase = await getSupabaseServer();
  const admin = getSupabaseAdmin();
  if (!supabase || !admin) {
    return NextResponse.json(
      { error: "Referral-Programm ist noch nicht konfiguriert." },
      { status: 503 }
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Bitte zuerst anmelden." }, { status: 401 });
  }

  let code = "";
  try {
    const body = (await request.json()) as { code?: unknown };
    if (typeof body.code === "string") code = body.code.trim().toLowerCase();
  } catch {
    // kein/kaputtes JSON -> unten als ungueltig behandelt
  }
  if (!/^[a-z0-9]{4,32}$/.test(code)) {
    return NextResponse.json({ error: "Ungültiger Code." }, { status: 400 });
  }

  // Code-Inhaber suchen.
  const { data: referrer, error: referrerError } = await admin
    .from("profiles")
    .select("id")
    .eq("referral_code", code)
    .maybeSingle();
  if (referrerError) {
    return NextResponse.json({ error: "Datenbankfehler." }, { status: 500 });
  }
  if (!referrer) {
    return NextResponse.json({ error: "Unbekannter Code." }, { status: 404 });
  }
  if (referrer.id === user.id) {
    return NextResponse.json({ error: "Eigener Code zählt nicht." }, { status: 400 });
  }

  // Nur setzen, wenn noch keine Zuordnung existiert (erste Zuordnung gewinnt).
  const { data: me } = await admin
    .from("profiles")
    .select("referred_by")
    .eq("id", user.id)
    .maybeSingle();
  if (me?.referred_by) {
    return NextResponse.json({ ok: true, claimed: false });
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({ referred_by: referrer.id })
    .eq("id", user.id)
    .is("referred_by", null);
  if (updateError) {
    return NextResponse.json({ error: "Zuordnung fehlgeschlagen." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, claimed: true });
}
