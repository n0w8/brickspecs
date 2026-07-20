import { NextResponse } from "next/server";

import { getSupabaseAdmin, getSupabaseServer } from "@/lib/supabase/server";
import { FOUNDER_COMING_SOON } from "@/lib/plan";
import {
  FOUNDER_TOTAL_SUPPLY,
  baseUrlFromRequest,
  getStripe,
  lookupKeyFor,
  priceForLookupKey,
} from "@/lib/stripe/server";

/**
 * POST /api/stripe/checkout  { plan: "sammler"|"investor"|"founder", billing?: "monthly"|"yearly" }
 *
 * Erstellt eine Stripe-Checkout-Session für den eingeloggten Supabase-Nutzer
 * und liefert { url } für den Redirect. Antwortformat bei Fehlern:
 * { error: string } mit passendem HTTP-Status.
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

  let plan = "";
  let billing = "monthly";
  try {
    const body = (await request.json()) as { plan?: unknown; billing?: unknown };
    if (typeof body.plan === "string") plan = body.plan;
    if (typeof body.billing === "string") billing = body.billing;
  } catch {
    // kein/kaputtes JSON -> unten als ungültig behandelt
  }

  const lookupKey = lookupKeyFor(plan, billing);
  if (!lookupKey) {
    return NextResponse.json({ error: "Unbekannter Plan." }, { status: 400 });
  }

  // Founder Brick ist noch nicht freigeschaltet (Teaser-Phase) - auch
  // direkte API-Aufrufe duerfen keinen Founder-Checkout starten.
  if (plan === "founder" && FOUNDER_COMING_SOON) {
    return NextResponse.json(
      { error: "Der Founder Brick kommt mit einem der nächsten Updates." },
      { status: 403 }
    );
  }

  const admin = getSupabaseAdmin();

  // Founder: vor dem Checkout prüfen, ob überhaupt noch Nummern frei sind.
  if (plan === "founder" && admin) {
    const { count, error } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .not("founder_number", "is", null);
    if (!error && (count ?? 0) >= FOUNDER_TOTAL_SUPPLY) {
      return NextResponse.json(
        { error: "Der Founder Brick ist ausverkauft." },
        { status: 409 }
      );
    }
  }

  try {
    // Stripe-Customer je Profil wiederverwenden bzw. einmalig anlegen.
    let customerId: string | null = null;
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.stripe_customer_id) customerId = profile.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      // Nur der Server darf diese Spalte schreiben (RLS) - Admin-Client nutzen.
      if (admin) {
        await admin
          .from("profiles")
          .update({ stripe_customer_id: customerId })
          .eq("id", user.id);
      }
    }

    const price = await priceForLookupKey(stripe, lookupKey);
    if (!price) {
      console.error(`[stripe/checkout] Kein aktiver Preis für lookup_key "${lookupKey}".`);
      return NextResponse.json(
        { error: "Dieser Plan ist gerade nicht verfügbar." },
        { status: 500 }
      );
    }

    const base = baseUrlFromRequest(request);
    const isSubscription = plan !== "founder";

    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? "subscription" : "payment",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: price.id, quantity: 1 }],
      success_url: `${base}/profil?checkout=success`,
      cancel_url: `${base}/preise`,
      ...(isSubscription
        ? { subscription_data: { metadata: { supabase_user_id: user.id } } }
        : { payment_intent_data: { metadata: { supabase_user_id: user.id } } }),
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Checkout konnte nicht gestartet werden." },
        { status: 500 }
      );
    }
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error(`[stripe/checkout] ${(err as Error).message}`);
    return NextResponse.json(
      { error: "Checkout konnte nicht gestartet werden." },
      { status: 502 }
    );
  }
}
