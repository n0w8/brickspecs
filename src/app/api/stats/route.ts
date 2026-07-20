import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { FOUNDER_TOTAL_SUPPLY } from "@/lib/stripe/server";

/**
 * GET /api/stats - oeffentliche Aggregat-Kennzahlen (kein PII).
 *
 * PRIVACY-SCHWELLE: Nutzer- und Portfolio-Zahlen werden erst oeffentlich
 * ausgeliefert, wenn sie 4-stellig sind (>= 1000) - vorher kommt null.
 * Der Betreiber sieht die echten Zahlen immer im Admin-Panel (/admin),
 * das direkt auf die Datenbank geht und nicht ueber diese Route.
 *
 * 60s Prozess-Cache + CDN-Header.
 */

const PUBLIC_THRESHOLD = 1000;

let cache: { data: object; at: number } | null = null;
const CACHE_MS = 60_000;

/** Zahl erst ab Schwelle veroeffentlichen, sonst null. */
function gated(count: number | null): number | null {
  if (count === null || count < PUBLIC_THRESHOLD) return null;
  return count;
}

export async function GET() {
  if (cache && Date.now() - cache.at < CACHE_MS) {
    return NextResponse.json(cache.data, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({
      users: null,
      portfolioSets: null,
      foundersSold: null,
      foundersTotal: FOUNDER_TOTAL_SUPPLY,
      live: false,
    });
  }

  const [usersRes, pfRes, foundersRes] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("portfolio_items").select("id", { count: "exact", head: true }),
    admin.from("profiles").select("id", { count: "exact", head: true }).not("founder_number", "is", null),
  ]);

  const data = {
    users: gated(usersRes.error ? null : (usersRes.count ?? 0)),
    portfolioSets: gated(pfRes.error ? null : (pfRes.count ?? 0)),
    // Founder-Verkaufszahl bleibt bis zum Founder-Launch ebenfalls privat.
    foundersSold: gated(foundersRes.error ? null : (foundersRes.count ?? 0)),
    foundersTotal: FOUNDER_TOTAL_SUPPLY,
    live: true,
  };
  cache = { data, at: Date.now() };
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
  });
}
