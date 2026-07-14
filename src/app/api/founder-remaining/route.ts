import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { FOUNDER_TOTAL_SUPPLY } from "@/lib/stripe/server";

/** Demo-Fallback ohne Supabase (muss zu FOUNDER_REMAINING in src/lib/plan.ts passen). */
const DEMO_REMAINING = 473;

/**
 * GET /api/founder-remaining - echte Restanzahl der Founder Bricks.
 * Antwort: { remaining, total, live } - live=false im Demo-Fallback.
 * Ergebnis wird 60 Sekunden im Prozess gecacht (plus CDN-Cache-Header).
 */

let cache: { remaining: number; at: number } | null = null;
const CACHE_MS = 60_000;

export async function GET() {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({
      remaining: DEMO_REMAINING,
      total: FOUNDER_TOTAL_SUPPLY,
      live: false,
    });
  }

  if (cache && Date.now() - cache.at < CACHE_MS) {
    return NextResponse.json(
      { remaining: cache.remaining, total: FOUNDER_TOTAL_SUPPLY, live: true },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=60" } }
    );
  }

  const { count, error } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .not("founder_number", "is", null);

  if (error) {
    console.error(`[founder-remaining] ${error.message}`);
    return NextResponse.json({
      remaining: DEMO_REMAINING,
      total: FOUNDER_TOTAL_SUPPLY,
      live: false,
    });
  }

  const remaining = Math.max(0, FOUNDER_TOTAL_SUPPLY - (count ?? 0));
  cache = { remaining, at: Date.now() };
  return NextResponse.json(
    { remaining, total: FOUNDER_TOTAL_SUPPLY, live: true },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=60" } }
  );
}
