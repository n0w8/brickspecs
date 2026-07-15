// Admin-Panel: Server-Component-Gate + Datenladung.
//
// - Supabase-Modus: nur eingeloggte Admins (src/lib/admin.ts) sehen die Seite,
//   fuer alle anderen liefert sie 404 (notFound) - sie "existiert" nicht.
// - localStorage-Fallback (Supabase nicht konfiguriert): bisheriges
//   Phase-1-Panel unveraendert (AdminLocal).

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getSupabaseAdmin, getSupabaseServer } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/admin";
import AdminCloud, { type AdminCloudStats } from "./AdminCloud";
import AdminLocal from "./AdminLocal";

// Kennzahlen immer frisch laden, nie cachen.
export const dynamic = "force-dynamic";

// Interne Seite: nie indexieren.
export const metadata: Metadata = {
  title: "Admin | BrickSpecs",
  robots: { index: false, follow: false },
};

/** Founder-Gesamtauflage (muss zur SQL-Funktion claim_founder_number passen). */
const FOUNDER_TOTAL = 500;

/** Newsletter-Abonnenten der Brevo-Liste 5 - null bei Fehler ("n/a"). */
async function fetchNewsletterSubscribers(): Promise<number | null> {
  const key = process.env.BREVO_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.brevo.com/v3/contacts/lists/5", {
      headers: { "api-key": key, accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { uniqueSubscribers?: number };
    return typeof json.uniqueSubscribers === "number"
      ? json.uniqueSubscribers
      : null;
  } catch {
    return null;
  }
}

async function loadStats(): Promise<AdminCloudStats> {
  const admin = getSupabaseAdmin();
  const empty: AdminCloudStats = {
    totalUsers: null,
    confirmedUsers: null,
    planCounts: null,
    founderSold: null,
    founderTotal: FOUNDER_TOTAL,
    portfolioItems: null,
    activeAlerts: null,
    newsletterSubscribers: null,
    recentUsers: [],
    referralPendingTotal: null,
    referralPaidTotal: null,
    referralRows: [],
    serviceRoleMissing: admin === null,
  };
  if (!admin) {
    empty.newsletterSubscribers = await fetchNewsletterSubscribers();
    return empty;
  }

  const [usersRes, profilesRes, portfolioRes, alertsRes, newsletter, earningsRes] =
    await Promise.all([
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      admin.from("profiles").select("id, plan, founder_number"),
      admin.from("portfolio_items").select("id", { count: "exact", head: true }),
      admin
        .from("price_alerts")
        .select("id", { count: "exact", head: true })
        .eq("active", true),
      fetchNewsletterSubscribers(),
      admin.from("referral_earnings").select("referrer_id, amount_eur, status"),
    ]);

  // Nutzerzahlen + letzte Registrierungen aus auth.users
  let totalUsers: number | null = null;
  let confirmedUsers: number | null = null;
  let sortedUsers: User[] = [];
  if (!usersRes.error) {
    const users = usersRes.data.users;
    totalUsers = users.length;
    confirmedUsers = users.filter((u) => Boolean(u.email_confirmed_at)).length;
    sortedUsers = [...users].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  // Plan-Verteilung + Founder-Zaehler aus public.profiles
  let planCounts: Record<string, number> | null = null;
  let founderSold: number | null = null;
  const profileById = new Map<
    string,
    { plan: string; founder_number: number | null }
  >();
  if (!profilesRes.error && profilesRes.data) {
    planCounts = { free: 0, sammler: 0, investor: 0, founder: 0 };
    founderSold = 0;
    for (const row of profilesRes.data as {
      id: string;
      plan: string | null;
      founder_number: number | null;
    }[]) {
      const plan = row.plan && row.plan in planCounts ? row.plan : "free";
      planCounts[plan] += 1;
      if (row.founder_number !== null) founderSold += 1;
      profileById.set(row.id, {
        plan,
        founder_number: row.founder_number ?? null,
      });
    }
  }

  // Referral-Guthaben: offene/ausgezahlte Summen gesamt + offen je Werber.
  let referralPendingTotal: number | null = null;
  let referralPaidTotal: number | null = null;
  const referralRows: { email: string; pendingEur: number }[] = [];
  if (!earningsRes.error && earningsRes.data) {
    referralPendingTotal = 0;
    referralPaidTotal = 0;
    const emailById = new Map<string, string>();
    for (const u of sortedUsers) emailById.set(u.id, u.email ?? "-");
    const pendingByReferrer = new Map<string, number>();
    for (const row of earningsRes.data as {
      referrer_id: string;
      amount_eur: number | string;
      status: string;
    }[]) {
      const amount = Number(row.amount_eur) || 0;
      if (row.status === "paid") {
        referralPaidTotal += amount;
      } else {
        referralPendingTotal += amount;
        pendingByReferrer.set(
          row.referrer_id,
          (pendingByReferrer.get(row.referrer_id) ?? 0) + amount
        );
      }
    }
    referralPendingTotal = Math.round(referralPendingTotal * 100) / 100;
    referralPaidTotal = Math.round(referralPaidTotal * 100) / 100;
    for (const [referrerId, sum] of pendingByReferrer) {
      const rounded = Math.round(sum * 100) / 100;
      if (rounded > 0) {
        referralRows.push({
          email: emailById.get(referrerId) ?? referrerId,
          pendingEur: rounded,
        });
      }
    }
    referralRows.sort((a, b) => b.pendingEur - a.pendingEur);
  }

  const recentUsers = sortedUsers.slice(0, 10).map((u) => {
    const profile = profileById.get(u.id);
    return {
      email: u.email ?? "-",
      createdAt: u.created_at,
      plan: profile?.plan ?? "free",
      founderNumber: profile?.founder_number ?? null,
    };
  });

  return {
    totalUsers,
    confirmedUsers,
    planCounts,
    founderSold,
    founderTotal: FOUNDER_TOTAL,
    portfolioItems: portfolioRes.error ? null : (portfolioRes.count ?? 0),
    activeAlerts: alertsRes.error ? null : (alertsRes.count ?? 0),
    newsletterSubscribers: newsletter,
    recentUsers,
    referralPendingTotal,
    referralPaidTotal,
    referralRows,
    serviceRoleMissing: false,
  };
}

export default async function AdminPage() {
  const supabase = await getSupabaseServer();

  // Phase-1-Fallback: ohne Supabase bleibt alles wie bisher (Client-Panel).
  if (!supabase) return <AdminLocal />;

  const { data } = await supabase.auth.getUser();
  const email = data.user?.email;
  if (!email || !isAdminUser(email)) notFound();

  const stats = await loadStats();
  return <AdminCloud stats={stats} />;
}
