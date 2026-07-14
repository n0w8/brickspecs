import { NextResponse } from "next/server";

import { getSupabaseAdmin, getSupabaseServer } from "@/lib/supabase/server";

/**
 * GET /api/referral/me - Referral-Kennzahlen des eingeloggten Nutzers.
 *
 * Liefert:
 * - referredTotal: Anzahl aller Geworbenen (profiles.referred_by = ich)
 * - referredPaying: davon mit bezahltem Plan (plan != 'free')
 * - pendingEur / paidEur: Summen aus referral_earnings nach Status
 * - recent: die letzten 20 Gutschriften (Datum, Betrag, Quelle, Status)
 *
 * Immer frisch (keine Caches), 503 ohne Supabase-Konfiguration.
 */
export const dynamic = "force-dynamic";

export interface ReferralMeResponse {
  referredTotal: number;
  referredPaying: number;
  pendingEur: number;
  paidEur: number;
  recent: {
    amountEur: number;
    source: string;
    status: "pending" | "paid";
    createdAt: string;
  }[];
}

export async function GET() {
  const supabase = await getSupabaseServer();
  const admin = getSupabaseAdmin();
  if (!supabase || !admin) {
    return NextResponse.json(
      { error: "Referral-Programm ist noch nicht konfiguriert." },
      { status: 503 }
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Bitte zuerst anmelden." }, { status: 401 });
  }

  const [referredRes, earningsRes] = await Promise.all([
    admin.from("profiles").select("plan").eq("referred_by", user.id),
    admin
      .from("referral_earnings")
      .select("amount_eur, source, status, created_at")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  if (referredRes.error || earningsRes.error) {
    return NextResponse.json({ error: "Datenbankfehler." }, { status: 500 });
  }

  const referred = (referredRes.data ?? []) as { plan: string | null }[];
  const earnings = (earningsRes.data ?? []) as {
    amount_eur: number | string;
    source: string;
    status: string;
    created_at: string;
  }[];

  let pendingEur = 0;
  let paidEur = 0;
  for (const row of earnings) {
    const amount = Number(row.amount_eur) || 0;
    if (row.status === "paid") paidEur += amount;
    else pendingEur += amount;
  }

  const body: ReferralMeResponse = {
    referredTotal: referred.length,
    referredPaying: referred.filter((r) => (r.plan ?? "free") !== "free").length,
    pendingEur: Math.round(pendingEur * 100) / 100,
    paidEur: Math.round(paidEur * 100) / 100,
    recent: earnings.slice(0, 20).map((row) => ({
      amountEur: Number(row.amount_eur) || 0,
      source: row.source,
      status: row.status === "paid" ? "paid" : "pending",
      createdAt: row.created_at,
    })),
  };
  return NextResponse.json(body);
}
