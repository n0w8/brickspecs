import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { FOUNDER_TOTAL_SUPPLY } from "@/lib/stripe/server";

/**
 * GET /api/stats - oeffentliche Aggregat-Kennzahlen fuer Social Proof auf der
 * Startseite (keine personenbezogenen Daten). 60s Prozess-Cache + CDN-Header.
 * Antwort: { users, portfolioSets, foundersSold, foundersTotal, live }.
 */

let cache: { data: object; at: number } | null = null;
const CACHE_MS = 60_000;

export async function GET() {
  if (cache && Date.now() - cache.at < CACHE_MS) {
    return NextResponse.json(cache.data, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    const demo = {
      users: null,
      portfolioSets: null,
      foundersSold: null,
      foundersTotal: FOUNDER_TOTAL_SUPPLY,
      live: false,
    };
    return NextResponse.json(demo);
  }

  const [usersRes, pfRes, foundersRes] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("portfolio_items").select("id", { count: "exact", head: true }),
    admin.from("profiles").select("id", { count: "exact", head: true }).not("founder_number", "is", null),
  ]);

  const data = {
    users: usersRes.error ? null : (usersRes.count ?? 0),
    portfolioSets: pfRes.error ? null : (pfRes.count ?? 0),
    foundersSold: foundersRes.error ? null : (foundersRes.count ?? 0),
    foundersTotal: FOUNDER_TOTAL_SUPPLY,
    live: true,
  };
  cache = { data, at: Date.now() };
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
  });
}
