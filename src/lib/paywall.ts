"use client";

/**
 * Client-Helfer für die echte Stripe-Paywall (Phase 2b).
 *
 * stripePaywallEnabled(): true, sobald Supabase UND der Stripe-Publishable-Key
 * konfiguriert sind - erst dann werden die echten Checkout-Pfade betreten.
 * Ohne Konfiguration bleibt alles beim Phase-1-Demo-Verhalten.
 */

export function stripePaywallEnabled(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  );
}

/** true, solange der Stripe-Key ein Test-Key ist (pk_test...). */
export function stripeTestMode(): boolean {
  return (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "").startsWith("pk_test");
}

export interface CheckoutError {
  status: number;
  message: string;
}

/**
 * Startet den Stripe-Checkout für einen bezahlten Plan.
 * Bei Erfolg wird der Browser zu Stripe weitergeleitet (Rückkehr auf /profil).
 */
export async function startCheckout(
  plan: "sammler" | "investor" | "founder",
  billing: "monthly" | "yearly"
): Promise<CheckoutError | null> {
  try {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ plan, billing }),
    });
    const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
    if (res.ok && body.url) {
      window.location.href = body.url;
      return null;
    }
    return { status: res.status, message: body.error ?? "" };
  } catch {
    return { status: 0, message: "" };
  }
}

/** Öffnet das Stripe-Billing-Portal (Abo verwalten). */
export async function openBillingPortal(): Promise<CheckoutError | null> {
  try {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
    if (res.ok && body.url) {
      window.location.href = body.url;
      return null;
    }
    return { status: res.status, message: body.error ?? "" };
  } catch {
    return { status: 0, message: "" };
  }
}
