import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { baseUrlFromRequest, getStripe } from "@/lib/stripe/server";

/**
 * POST /api/stripe/portal - Stripe-Billing-Portal für den eingeloggten Nutzer
 * (Kündigung, Zahlungsdaten, Rechnungen). Antwort: { url } für den Redirect.
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  const supabase = await getSupabaseServer();
  if (!stripe || !supabase) {
    return NextResponse.json(
      { error: "Zahlungen sind noch nicht konfiguriert." },
      { status: 503 }
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Bitte zuerst anmelden." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json(
      { error: "Kein aktives Abo für dieses Konto gefunden." },
      { status: 400 }
    );
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${baseUrlFromRequest(request)}/profil`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error(`[stripe/portal] ${(err as Error).message}`);
    return NextResponse.json(
      { error: "Das Abo-Portal ist gerade nicht erreichbar." },
      { status: 502 }
    );
  }
}
