// Stripe-Helfer für Server-Code (Route-Handler). NUR aus Server-Code importieren.
//
// Null-Sicherheit: Ohne STRIPE_SECRET_KEY liefert getStripe() null - alle
// Stripe-Routen antworten dann mit 503 und die UI bleibt im Demo-Fallback.

import Stripe from "stripe";

import type { Billing, Plan } from "@/lib/plan";

let cached: Stripe | null | undefined;

/** Stripe-Client, wenn STRIPE_SECRET_KEY gesetzt ist - sonst null. */
export function getStripe(): Stripe | null {
  if (cached !== undefined) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  cached = key ? new Stripe(key) : null;
  return cached;
}

/** Bezahlbare Pläne und ihre Stripe-lookup_keys (Test- und Live-Modus identisch). */
export const PLAN_LOOKUP_KEYS = {
  sammler_monthly: "sammler_monthly",
  sammler_yearly: "sammler_yearly",
  investor_monthly: "investor_monthly",
  investor_yearly: "investor_yearly",
  founder_once: "founder_once",
} as const;

export type PaidPlan = "sammler" | "investor" | "founder";

/** Liefert den lookup_key für Plan + Abrechnung, null bei ungültiger Kombination. */
export function lookupKeyFor(plan: string, billing: string): string | null {
  if (plan === "founder") return PLAN_LOOKUP_KEYS.founder_once;
  if (plan !== "sammler" && plan !== "investor") return null;
  if (billing !== "monthly" && billing !== "yearly") return null;
  return `${plan}_${billing}`;
}

/**
 * Kehrseite für den Webhook: lookup_key -> { plan, billing }.
 * Unbekannte Keys liefern null (Event wird dann ignoriert).
 */
export function planFromLookupKey(
  lookupKey: string | null | undefined
): { plan: Extract<Plan, "sammler" | "investor">; billing: Extract<Billing, "monthly" | "yearly"> } | null {
  if (!lookupKey) return null;
  const m = /^(sammler|investor)_(monthly|yearly)$/.exec(lookupKey);
  if (!m) return null;
  return {
    plan: m[1] as "sammler" | "investor",
    billing: m[2] as "monthly" | "yearly",
  };
}

/** Preis (Stripe Price) zu einem lookup_key auflösen - null, wenn nicht angelegt. */
export async function priceForLookupKey(
  stripe: Stripe,
  lookupKey: string
): Promise<Stripe.Price | null> {
  const res = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  });
  return res.data[0] ?? null;
}

/**
 * Basis-URL für success/cancel/return-URLs: lokal die Request-Origin
 * (http://localhost:3100), in Produktion immer https://brickspecs.com.
 */
export function baseUrlFromRequest(request: Request): string {
  const origin = request.headers.get("origin");
  if (origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    return origin;
  }
  try {
    const url = new URL(request.url);
    if (/^(localhost|127\.0\.0\.1)$/.test(url.hostname)) return url.origin;
  } catch {
    // fällt unten auf die Produktions-Domain zurück
  }
  return "https://brickspecs.com";
}

/** Founder-Gesamtauflage (muss zur SQL-Funktion claim_founder_number passen). */
export const FOUNDER_TOTAL_SUPPLY = 500;
