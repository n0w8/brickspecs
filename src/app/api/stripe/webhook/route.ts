import { NextResponse } from "next/server";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getStripe, planFromLookupKey } from "@/lib/stripe/server";

/**
 * POST /api/stripe/webhook - Stripe-Ereignisse (Signatur-geprüft, raw body!).
 *
 * Verarbeitete Events:
 * - checkout.session.completed  (mode=payment -> Founder-Nummer vergeben)
 * - customer.subscription.created|updated (Plan sammler/investor + Abrechnung setzen)
 * - customer.subscription.deleted (zurück auf free - Founder wird NIE downgegradet)
 *
 * Profil-Zuordnung: primär über profiles.stripe_customer_id, als Fallback
 * über client_reference_id bzw. subscription_data.metadata (User-Id aus dem Checkout).
 */

/** Profil-Id über die Stripe-Customer-Id finden, Fallback: mitgelieferte User-Id. */
async function resolveProfileId(
  admin: SupabaseClient,
  customerId: string | null,
  fallbackUserId: string | null
): Promise<string | null> {
  if (customerId) {
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    if (data?.id) return data.id;
  }
  if (fallbackUserId) {
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("id", fallbackUserId)
      .maybeSingle();
    if (data?.id) {
      // Customer-Id nachtragen, damit künftige Events direkt zuordenbar sind.
      if (customerId) {
        await admin
          .from("profiles")
          .update({ stripe_customer_id: customerId })
          .eq("id", data.id)
          .is("stripe_customer_id", null);
      }
      return data.id;
    }
  }
  return null;
}

function customerIdOf(value: string | Stripe.Customer | Stripe.DeletedCustomer | null): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const admin = getSupabaseAdmin();
  if (!stripe || !secret || !admin) {
    return NextResponse.json({ error: "Webhook nicht konfiguriert." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Signatur fehlt." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    console.error(`[stripe/webhook] Ungültige Signatur: ${(err as Error).message}`);
    return NextResponse.json({ error: "Ungültige Signatur." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        // Abos werden über die subscription-Events verarbeitet - hier zählt
        // nur die Einmalzahlung (Founder Brick).
        if (session.mode !== "payment" || session.payment_status !== "paid") break;
        const profileId = await resolveProfileId(
          admin,
          customerIdOf(session.customer),
          session.client_reference_id ?? null
        );
        if (!profileId) {
          console.error(
            `[stripe/webhook] Founder-Zahlung ohne zuordenbares Profil (Session ${session.id}).`
          );
          break;
        }
        const { data: existing } = await admin
          .from("profiles")
          .select("founder_number")
          .eq("id", profileId)
          .maybeSingle();
        if (existing?.founder_number) break; // idempotent: Nummer schon vergeben
        const { data: founderNo, error } = await admin.rpc("claim_founder_number", {
          p_user: profileId,
        });
        if (error) {
          // "founder_sold_out" oder DB-Fehler: loggen, aber 200 antworten -
          // erneute Zustellung des Events würde daran nichts ändern.
          console.error(`[stripe/webhook] claim_founder_number: ${error.message}`);
        } else {
          console.log(`[stripe/webhook] Founder #${founderNo} vergeben (${profileId}).`);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const lookupKey = sub.items.data[0]?.price?.lookup_key ?? null;
        const mapped = planFromLookupKey(lookupKey);
        if (!mapped) break; // fremdes/unbekanntes Produkt - ignorieren
        // Nur aktive/testende Abos setzen den Plan; Kündigung läuft über deleted.
        if (sub.status !== "active" && sub.status !== "trialing") break;
        const profileId = await resolveProfileId(
          admin,
          customerIdOf(sub.customer),
          (sub.metadata?.supabase_user_id as string | undefined) ?? null
        );
        if (!profileId) {
          console.error(
            `[stripe/webhook] Abo ohne zuordenbares Profil (Subscription ${sub.id}).`
          );
          break;
        }
        // Founder behält seinen Lifetime-Plan, auch wenn parallel ein Abo läuft.
        const { data: current } = await admin
          .from("profiles")
          .select("plan")
          .eq("id", profileId)
          .maybeSingle();
        if (current?.plan === "founder") break;
        await admin
          .from("profiles")
          .update({ plan: mapped.plan, plan_billing: mapped.billing })
          .eq("id", profileId);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const profileId = await resolveProfileId(
          admin,
          customerIdOf(sub.customer),
          (sub.metadata?.supabase_user_id as string | undefined) ?? null
        );
        if (!profileId) break;
        const { data: current } = await admin
          .from("profiles")
          .select("plan")
          .eq("id", profileId)
          .maybeSingle();
        if (current?.plan === "founder") break; // Founder nie downgraden
        await admin
          .from("profiles")
          .update({ plan: "free", plan_billing: null })
          .eq("id", profileId);
        break;
      }

      default:
        // Nicht abonnierte Event-Typen einfach bestätigen.
        break;
    }
  } catch (err) {
    console.error(`[stripe/webhook] Verarbeitung fehlgeschlagen: ${(err as Error).message}`);
    return NextResponse.json({ error: "Verarbeitung fehlgeschlagen." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
