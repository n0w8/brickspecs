"use client";

// Admin-Panel (Phase 2): zeigt echte Kennzahlen aus Supabase + Brevo.
// Die Daten kommen fertig geladen als Props aus der Server-Komponente
// (src/app/admin/page.tsx) - hier passiert nur noch Darstellung + Sprache.

import { useLang } from "@/lib/i18n";

export interface AdminRecentUser {
  email: string;
  createdAt: string;
  plan: string;
  founderNumber: number | null;
}

export interface AdminCloudStats {
  totalUsers: number | null;
  confirmedUsers: number | null;
  planCounts: Record<string, number> | null;
  founderSold: number | null;
  founderTotal: number;
  portfolioItems: number | null;
  activeAlerts: number | null;
  /** null = Brevo nicht erreichbar / kein Key -> "n/a" */
  newsletterSubscribers: number | null;
  recentUsers: AdminRecentUser[];
  /** Referral-Programm: offene/ausgezahlte Summen + offene Guthaben je Werber. */
  referralPendingTotal: number | null;
  referralPaidTotal: number | null;
  referralRows: { email: string; pendingEur: number }[];
  serviceRoleMissing: boolean;
  /** Sessions, die in den letzten 3 Minuten aktiv waren. */
  onlineNow: number | null;
  /** Umsatzkennzahlen aus Stripe (null = Stripe nicht konfiguriert). */
  revenue: {
    mrrEur: number;
    activeSubs: number;
    monthEur: number;
    totalEur: number;
    /** true = echter Live-Modus, false = Stripe-Testmodus. */
    liveMode: boolean;
  } | null;
}

const PLAN_ORDER = ["free", "sammler", "investor", "founder"] as const;

const PLAN_LABEL: Record<string, { de: string; en: string; badge: string }> = {
  free: { de: "Free", en: "Free", badge: "badge-gray" },
  sammler: { de: "Sammler", en: "Collector", badge: "badge-blue" },
  investor: { de: "Investor", en: "Investor", badge: "badge-green" },
  founder: { de: "Founder", en: "Founder", badge: "badge-yellow" },
};

function fmt(value: number | null, locale: string): string {
  return value === null ? "n/a" : value.toLocaleString(locale);
}

function fmtEur(value: number | null, locale: string): string {
  if (value === null) return "n/a";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export default function AdminCloud({ stats }: { stats: AdminCloudStats }) {
  const { lang } = useLang();
  const locale = lang === "de" ? "de-DE" : "en-GB";

  const tiles = [
    {
      label: lang === "de" ? "Gerade online" : "Online now",
      value: stats.onlineNow === null ? "n/a" : `🟢 ${stats.onlineNow.toLocaleString(locale)}`,
    },
    {
      label: lang === "de" ? "Nutzer gesamt" : "Total users",
      value: fmt(stats.totalUsers, locale),
      sub:
        stats.confirmedUsers !== null
          ? lang === "de"
            ? `davon ${stats.confirmedUsers.toLocaleString(locale)} bestätigt`
            : `${stats.confirmedUsers.toLocaleString(locale)} confirmed`
          : undefined,
    },
    {
      label: lang === "de" ? "Founder verkauft" : "Founders sold",
      value:
        stats.founderSold === null
          ? "n/a"
          : `${stats.founderSold.toLocaleString(locale)} / ${stats.founderTotal.toLocaleString(locale)}`,
    },
    {
      label: lang === "de" ? "Portfolio-Einträge" : "Portfolio entries",
      value: fmt(stats.portfolioItems, locale),
    },
    {
      label: lang === "de" ? "Aktive Preisalarme" : "Active price alerts",
      value: fmt(stats.activeAlerts, locale),
    },
    {
      label: lang === "de" ? "Newsletter-Abonnenten" : "Newsletter subscribers",
      value: fmt(stats.newsletterSubscribers, locale),
    },
  ];

  return (
    <div className="flex flex-col gap-6 pt-8">
      <div>
        <h1 className="text-3xl font-extrabold mb-1">🛡️ Admin</h1>
        <p className="text-[var(--muted)] max-w-2xl">
          {lang === "de"
            ? "Live-Kennzahlen aus der Datenbank: Nutzer, Pläne, Portfolios und Newsletter."
            : "Live metrics from the database: users, plans, portfolios and newsletter."}
        </p>
      </div>

      {stats.serviceRoleMissing && (
        <div className="card p-4 border-l-4 !border-l-[var(--red,#e5484d)] text-sm text-[var(--muted)]">
          {lang === "de"
            ? "SUPABASE_SERVICE_ROLE_KEY fehlt auf dem Server - Kennzahlen können nicht geladen werden."
            : "SUPABASE_SERVICE_ROLE_KEY is missing on the server - metrics cannot be loaded."}
        </div>
      )}

      {/* Kennzahlen */}
      <section>
        <h2 className="font-bold text-lg mb-4">
          📊 {lang === "de" ? "Kennzahlen" : "Key metrics"}
        </h2>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {tiles.map((t) => (
            <div key={t.label} className="card p-4">
              <p className="text-xs text-[var(--muted)] mb-1">{t.label}</p>
              <p className="font-bold text-lg">{t.value}</p>
              {t.sub && <p className="text-xs text-[var(--muted)] mt-1">{t.sub}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Umsatz (Stripe) */}
      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="font-bold text-lg">
            💰 {lang === "de" ? "Umsatz" : "Revenue"}
          </h2>
          {stats.revenue && (
            <span className={`badge ${stats.revenue.liveMode ? "badge-green" : "badge-yellow"}`}>
              {stats.revenue.liveMode
                ? lang === "de" ? "Live" : "Live"
                : lang === "de" ? "Stripe-Testmodus" : "Stripe test mode"}
            </span>
          )}
        </div>
        {stats.revenue === null ? (
          <p className="text-sm text-[var(--muted)]">
            {lang === "de"
              ? "Stripe ist nicht konfiguriert - keine Umsatzdaten."
              : "Stripe is not configured - no revenue data."}
          </p>
        ) : (
          <>
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
              <div className="card !bg-[var(--surface-2)] p-4">
                <p className="text-xs text-[var(--muted)] mb-1">
                  MRR {lang === "de" ? "(monatl. wiederkehrend)" : "(monthly recurring)"}
                </p>
                <p className="font-bold text-lg text-[var(--yellow)]">
                  {fmtEur(stats.revenue.mrrEur, locale)}
                </p>
              </div>
              <div className="card !bg-[var(--surface-2)] p-4">
                <p className="text-xs text-[var(--muted)] mb-1">
                  {lang === "de" ? "Aktive Abos" : "Active subs"}
                </p>
                <p className="font-bold text-lg">
                  {stats.revenue.activeSubs.toLocaleString(locale)}
                </p>
              </div>
              <div className="card !bg-[var(--surface-2)] p-4">
                <p className="text-xs text-[var(--muted)] mb-1">
                  {lang === "de" ? "Umsatz diesen Monat" : "Revenue this month"}
                </p>
                <p className="font-bold text-lg">{fmtEur(stats.revenue.monthEur, locale)}</p>
              </div>
              <div className="card !bg-[var(--surface-2)] p-4">
                <p className="text-xs text-[var(--muted)] mb-1">
                  {lang === "de" ? "Umsatz gesamt" : "Total revenue"}
                </p>
                <p className="font-bold text-lg">{fmtEur(stats.revenue.totalEur, locale)}</p>
              </div>
            </div>
            {!stats.revenue.liveMode && (
              <p className="text-xs text-[var(--muted)] mt-3">
                {lang === "de"
                  ? "Hinweis: Stripe läuft noch im Testmodus - hier erscheinen erst echte Zahlen, sobald die Zahlung live geschaltet ist."
                  : "Note: Stripe is still in test mode - real figures appear once payments go live."}
              </p>
            )}
          </>
        )}
      </section>

      {/* Plan-Verteilung */}
      <section className="card p-5">
        <h2 className="font-bold text-lg mb-4">
          🧱 {lang === "de" ? "Plan-Verteilung" : "Plan distribution"}
        </h2>
        {stats.planCounts === null ? (
          <p className="text-sm text-[var(--muted)]">n/a</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {PLAN_ORDER.map((plan) => {
              const meta = PLAN_LABEL[plan];
              const count = stats.planCounts?.[plan] ?? 0;
              return (
                <div
                  key={plan}
                  className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2"
                >
                  <span className={`badge ${meta.badge}`}>
                    {lang === "de" ? meta.de : meta.en}
                  </span>
                  <span className="font-bold">{count.toLocaleString(locale)}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Referral-Guthaben */}
      <section className="card p-5">
        <h2 className="font-bold text-lg mb-4">
          🤝 {lang === "de" ? "Referral-Guthaben" : "Referral balances"}
        </h2>
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2">
            <span className="badge badge-yellow">
              {lang === "de" ? "Gesamt offen" : "Total pending"}
            </span>
            <span className="font-bold">
              {fmtEur(stats.referralPendingTotal, locale)}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2">
            <span className="badge badge-green">
              {lang === "de" ? "Gesamt ausgezahlt" : "Total paid out"}
            </span>
            <span className="font-bold">{fmtEur(stats.referralPaidTotal, locale)}</span>
          </div>
        </div>
        {stats.referralRows.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            {lang === "de"
              ? "Kein offenes Guthaben - noch keine unbezahlten Gutschriften."
              : "No pending balances - no unpaid credits yet."}
          </p>
        ) : (
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--muted)] border-b border-[var(--border)]">
                  <th className="py-2 pr-4">{lang === "de" ? "Nutzer" : "User"}</th>
                  <th className="py-2">
                    {lang === "de" ? "Offenes Guthaben" : "Pending balance"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.referralRows.map((row) => (
                  <tr
                    key={row.email}
                    className="border-b border-[var(--border)] last:border-0"
                  >
                    <td className="py-3 pr-4 font-semibold">{row.email}</td>
                    <td className="py-3 font-bold text-[var(--yellow)]">
                      {fmtEur(row.pendingEur, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Letzte Registrierungen */}
      <section className="card p-5">
        <h2 className="font-bold text-lg mb-4">
          👥 {lang === "de" ? "Letzte Registrierungen" : "Latest sign-ups"}
        </h2>
        {stats.recentUsers.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            {lang === "de" ? "Noch keine Registrierungen." : "No sign-ups yet."}
          </p>
        ) : (
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--muted)] border-b border-[var(--border)]">
                  <th className="py-2 pr-4">E-Mail</th>
                  <th className="py-2 pr-4">{lang === "de" ? "Registriert" : "Registered"}</th>
                  <th className="py-2 pr-4">Plan</th>
                  <th className="py-2">{lang === "de" ? "Founder-Nr." : "Founder no."}</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentUsers.map((u) => {
                  const meta = PLAN_LABEL[u.plan] ?? PLAN_LABEL.free;
                  return (
                    <tr
                      key={u.email + u.createdAt}
                      className="border-b border-[var(--border)] last:border-0"
                    >
                      <td className="py-3 pr-4 font-semibold">{u.email}</td>
                      <td className="py-3 pr-4 text-[var(--muted)]">
                        {new Date(u.createdAt).toLocaleString(locale)}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`badge ${meta.badge}`}>
                          {lang === "de" ? meta.de : meta.en}
                        </span>
                      </td>
                      <td className="py-3">
                        {u.founderNumber !== null
                          ? `#${String(u.founderNumber).padStart(3, "0")}`
                          : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
