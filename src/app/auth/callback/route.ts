// Ziel des Bestaetigungs-Links aus der Supabase-Mail (E-Mail-Verifikation).
// Tauscht den Code gegen eine Session und leitet dann auf /profil weiter.

import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/profil";
  // Nur relative Ziele zulassen (kein Open-Redirect).
  const target = next.startsWith("/") && !next.startsWith("//") ? next : "/profil";

  const supabase = await getSupabaseServer();
  if (supabase) {
    if (code) {
      // PKCE-Flow: ?code=... (Standard bei signUp mit emailRedirectTo)
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(`${origin}${target}`);
    } else if (tokenHash && type) {
      // OTP-Variante: ?token_hash=...&type=signup (alternative Mail-Templates)
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      });
      if (!error) return NextResponse.redirect(`${origin}${target}`);
    }
  }

  // Ohne Supabase-Konfiguration oder bei ungueltigem/abgelaufenem Link:
  return NextResponse.redirect(`${origin}/login?fehler=bestaetigung`);
}
