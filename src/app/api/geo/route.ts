import { NextResponse } from "next/server";

import { getSupabaseAdmin, getSupabaseServer } from "@/lib/supabase/server";

/**
 * POST /api/geo
 *
 * Merkt sich fuer den eingeloggten Nutzer EINMALIG das Herkunftsland als
 * 2-Buchstaben-ISO-Code aus dem Vercel-Geo-Header "x-vercel-ip-country"
 * (profiles.country) - fuer die USt/OSS-Laender-Uebersicht im Admin-Panel.
 *
 * Datensparsamkeit: Es wird NUR der Laendercode gespeichert, KEINE IP-Adresse.
 * Ein bereits gesetztes Land wird NIE ueberschrieben (erste Zuordnung zaehlt).
 *
 * Antwort immer 200 { ok: true } - nur ohne Login 401. Fehler (z. B. Spalte
 * country noch nicht deployt) werden bewusst still geschluckt, damit der
 * unsichtbare Client-Ping nie Laerm macht.
 */
export async function POST(request: Request) {
  const supabase = await getSupabaseServer();
  const admin = getSupabaseAdmin();
  if (!supabase || !admin) {
    // Supabase (noch) nicht konfiguriert -> nichts zu tun, kein Fehler.
    return NextResponse.json({ ok: true });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Bitte zuerst anmelden." }, { status: 401 });
  }

  // Laendercode aus dem Vercel-Geo-Header - nur exakt 2 Grossbuchstaben.
  const raw = request.headers.get("x-vercel-ip-country");
  const country = raw && /^[A-Z]{2}$/.test(raw) ? raw : null;
  if (!country) {
    return NextResponse.json({ ok: true });
  }

  // tagged=false signalisiert dem Client, seinen Einmal-Marker NICHT zu
  // setzen (z. B. Spalte noch nicht deployt) - er versucht es beim naechsten
  // Seitenaufruf erneut. So ist die Deploy-Reihenfolge SQL/Code egal.
  let tagged = false;
  try {
    // Nur setzen, wenn noch KEIN Land hinterlegt ist - nie ueberschreiben.
    const { error } = await admin
      .from("profiles")
      .update({ country })
      .eq("id", user.id)
      .is("country", null);
    if (!error) tagged = true;
  } catch {
    // Netzfehler -> still schlucken, tagged bleibt false.
  }

  return NextResponse.json({ ok: true, tagged });
}
