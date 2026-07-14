"use client";

// Phase-1-Fallback: Admin-Panel auf localStorage-Basis. Wird nur gerendert,
// solange Supabase nicht konfiguriert ist (bisheriges Verhalten unveraendert).

import Link from "next/link";
import { useEffect, useState } from "react";
import { SETS } from "@/data/sets";
import { MINIFIGS } from "@/data/minifigs";
import { ARTICLES } from "@/data/articles";
import { LEAKS } from "@/data/leaks";
import { useLang } from "@/lib/i18n";
import { formatEUR } from "@/lib/format";
import { getUser, isLoggedIn } from "@/lib/auth";

interface UserRow {
  username: string;
  email?: string;
  createdAt?: string;
  bricklinkStore?: string;
  isCurrent: boolean;
  portfolioItems: number;
  portfolioUnits: number;
  portfolioInvested: number;
  alertCount: number;
}

interface CatalogStats {
  sets: number | null;
  setsFetchedAt: string | null;
  figs: number | null;
}

function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export default function AdminLocal() {
  const { lang } = useLang();
  const locale = lang === "de" ? "de-DE" : "en-GB";

  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [catalog, setCatalog] = useState<CatalogStats>({
    sets: null,
    setsFetchedAt: null,
    figs: null,
  });

  useEffect(() => {
    const ok = isLoggedIn();
    setAllowed(ok);
    setReady(true);
    if (!ok) return;

    // Alle Benutzer dieses Browsers aus den localStorage-Keys ableiten
    const current = getUser();
    const names = new Set<string>();
    if (current) names.add(current.username);
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i) ?? "";
      const m = key.match(/^bricktopia\.(?:portfolio|alerts)\.(.+)$/);
      if (m) names.add(m[1]);
    }

    const rows: UserRow[] = Array.from(names).map((username) => {
      const pf =
        readJson<{ quantity: number; purchasePriceEUR: number | null }[]>(
          `bricktopia.portfolio.${username}`
        ) ?? [];
      const alerts = readJson<unknown[]>(`bricktopia.alerts.${username}`) ?? [];
      const isCurrent = current?.username === username;
      return {
        username,
        email: isCurrent ? current?.email : undefined,
        createdAt: isCurrent ? current?.createdAt : undefined,
        bricklinkStore: isCurrent ? current?.bricklinkStore : undefined,
        isCurrent,
        portfolioItems: pf.length,
        portfolioUnits: pf.reduce((s, i) => s + i.quantity, 0),
        portfolioInvested: pf.reduce(
          (s, i) => s + (i.purchasePriceEUR ?? 0) * i.quantity,
          0
        ),
        alertCount: alerts.length,
      };
    });
    rows.sort((a, b) => Number(b.isCurrent) - Number(a.isCurrent));
    setUsers(rows);

    // Katalog-Statistiken
    fetch("/api/catalog/search?meta=1")
      .then((r) => r.json())
      .then((m: { total: number; fetchedAt: string }) =>
        setCatalog((c) => ({ ...c, sets: m.total, setsFetchedAt: m.fetchedAt }))
      )
      .catch(() => {});
    fetch("/api/catalog/minifigs?meta=1")
      .then((r) => r.json())
      .then((m: { total: number }) => setCatalog((c) => ({ ...c, figs: m.total })))
      .catch(() => {});
  }, []);

  if (!ready) return null;

  if (!allowed) {
    return (
      <div className="max-w-md mx-auto pt-14 text-center card p-10">
        <p className="text-4xl mb-3">🛡️</p>
        <p className="mb-5 text-[var(--muted)]">
          {lang === "de"
            ? "Das Admin-Panel ist nur für angemeldete Benutzer sichtbar."
            : "The admin panel is only visible to logged-in users."}
        </p>
        <Link href="/login" className="btn btn-primary">
          {lang === "de" ? "Anmelden" : "Log in"}
        </Link>
      </div>
    );
  }

  const siteStats = [
    { label: lang === "de" ? "Sets im Katalog" : "Sets in catalog", value: catalog.sets },
    { label: lang === "de" ? "Minifiguren im Katalog" : "Minifigs in catalog", value: catalog.figs },
    { label: lang === "de" ? "Kuratierte Sets" : "Curated sets", value: SETS.length },
    { label: lang === "de" ? "Kuratierte Figuren" : "Curated figures", value: MINIFIGS.length },
    { label: lang === "de" ? "Artikel" : "Articles", value: ARTICLES.length },
    { label: lang === "de" ? "Leak-Feed-Einträge" : "Leak feed entries", value: LEAKS.length },
  ];

  return (
    <div className="flex flex-col gap-6 pt-8">
      <div>
        <h1 className="text-3xl font-extrabold mb-1">🛡️ Admin</h1>
        <p className="text-[var(--muted)] max-w-2xl">
          {lang === "de"
            ? "Benutzer, Aktivität und Systemstatus im Überblick."
            : "Users, activity and system status at a glance."}
        </p>
      </div>

      <div className="card p-4 border-l-4 !border-l-[var(--yellow)] text-sm text-[var(--muted)]">
        {lang === "de"
          ? "Demo-Modus: Konten liegen in Phase 1 nur im localStorage des jeweiligen Browsers. Dieses Panel zeigt daher die Benutzer DIESES Browsers. Mit der echten Datenbank in Phase 2 erscheinen hier alle registrierten Benutzer der Website."
          : "Demo mode: in phase 1, accounts live only in each browser's localStorage. This panel therefore shows the users of THIS browser. With the real database in phase 2, all registered users of the site will appear here."}
      </div>

      {/* Benutzer */}
      <section className="card p-5">
        <h2 className="font-bold text-lg mb-4">
          👥 {lang === "de" ? "Benutzer" : "Users"} ({users.length})
        </h2>
        {users.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            {lang === "de" ? "Keine Benutzerdaten gefunden." : "No user data found."}
          </p>
        ) : (
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--muted)] border-b border-[var(--border)]">
                  <th className="py-2 pr-4">{lang === "de" ? "Benutzer" : "User"}</th>
                  <th className="py-2 pr-4">E-Mail</th>
                  <th className="py-2 pr-4">{lang === "de" ? "Registriert" : "Registered"}</th>
                  <th className="py-2 pr-4">BrickLink</th>
                  <th className="py-2 pr-4">Portfolio</th>
                  <th className="py-2 pr-4">{lang === "de" ? "Investiert" : "Invested"}</th>
                  <th className="py-2">{lang === "de" ? "Alarme" : "Alerts"}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.username} className="border-b border-[var(--border)] last:border-0">
                    <td className="py-3 pr-4 font-semibold">
                      {u.username}{" "}
                      {u.isCurrent && (
                        <span className="badge badge-yellow ml-1">
                          {lang === "de" ? "Du" : "You"}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-[var(--muted)]">{u.email ?? "-"}</td>
                    <td className="py-3 pr-4 text-[var(--muted)]">
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString(locale)
                        : "-"}
                    </td>
                    <td className="py-3 pr-4">
                      {u.bricklinkStore ? (
                        <span className="badge badge-blue">{u.bricklinkStore}</span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      {u.portfolioItems} Sets · {u.portfolioUnits}{" "}
                      {lang === "de" ? "Stk." : "units"}
                    </td>
                    <td className="py-3 pr-4 font-bold text-[var(--yellow)]">
                      {u.portfolioInvested > 0
                        ? formatEUR(u.portfolioInvested, lang)
                        : "-"}
                    </td>
                    <td className="py-3">🔔 {u.alertCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* System */}
      <section>
        <h2 className="font-bold text-lg mb-4">
          ⚙️ {lang === "de" ? "Systemstatus" : "System status"}
        </h2>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
          {siteStats.map((s) => (
            <div key={s.label} className="card p-4">
              <p className="text-xs text-[var(--muted)] mb-1">{s.label}</p>
              <p className="font-bold text-lg">
                {s.value !== null ? s.value.toLocaleString(locale) : "…"}
              </p>
            </div>
          ))}
        </div>
        {catalog.setsFetchedAt && (
          <p className="text-xs text-[var(--muted)] mt-3">
            {lang === "de" ? "Letzter Katalog-Sync: " : "Last catalog sync: "}
            {new Date(catalog.setsFetchedAt).toLocaleString(locale)} ·{" "}
            {lang === "de"
              ? "täglicher Auto-Sync um 08:00 aktiv"
              : "daily auto sync at 08:00 active"}
          </p>
        )}
      </section>
    </div>
  );
}
