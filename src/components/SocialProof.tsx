"use client";

/**
 * Social Proof + Founder-Fortschritt auf der Startseite: schafft Vertrauen
 * ("X Sammler / Y Sets verwaltet") und Dringlichkeit (Founder X/500 vergeben).
 * Zahlen kommen aus /api/stats (oeffentliche Aggregate, kein PII).
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";

interface Stats {
  users: number | null;
  portfolioSets: number | null;
  foundersSold: number | null;
  foundersTotal: number;
  live: boolean;
}

export default function SocialProof() {
  const { lang } = useLang();
  const de = lang === "de";
  const locale = de ? "de-DE" : "en-GB";
  const [s, setS] = useState<Stats | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stats")
      .then((r) => r.json())
      .then((j: Stats) => {
        if (!cancelled) setS(j);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!s) return null;

  const nf = (v: number | null) => (v === null ? "-" : v.toLocaleString(locale));
  const sold = s.foundersSold ?? 0;
  const total = s.foundersTotal || 500;
  const remaining = Math.max(0, total - sold);
  const pct = Math.min(100, Math.round((sold / total) * 100));
  const showFounder = s.foundersSold !== null && remaining > 0;

  const tiles = [
    { value: nf(s.users), label: de ? "registrierte Sammler" : "registered collectors" },
    { value: nf(s.portfolioSets), label: de ? "Sets im Portfolio verwaltet" : "sets tracked in portfolios" },
  ];

  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_1.4fr] items-stretch">
      {/* Social-Proof-Kacheln */}
      <div className="grid grid-cols-2 gap-4">
        {tiles.map((t) => (
          <div key={t.label} className="card p-5 flex flex-col justify-center">
            <p className="text-2xl sm:text-3xl font-extrabold text-[var(--yellow)]">{t.value}</p>
            <p className="text-xs text-[var(--muted)] mt-1 leading-snug">{t.label}</p>
          </div>
        ))}
      </div>

      {/* Founder-Fortschritt */}
      {showFounder ? (
        <Link href="/preise" className="card card-hover p-5 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold">
              👑 {de ? "Founder Brick" : "Founder Brick"}
            </span>
            <span className="badge badge-yellow">
              {de ? `nur noch ${nf(remaining)} frei` : `only ${nf(remaining)} left`}
            </span>
          </div>
          <div className="h-3 rounded-full bg-[var(--surface-2)] overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${pct}%`, background: "linear-gradient(90deg,#f6c700,#d01012)" }}
            />
          </div>
          <p className="text-xs text-[var(--muted)] mt-2">
            {de
              ? `${nf(sold)} von ${nf(total)} limitierten Founder-Plätzen vergeben - dauerhafte Vorteile + eigenes Emblem.`
              : `${nf(sold)} of ${nf(total)} limited Founder seats taken - lifetime perks + exclusive emblem.`}
          </p>
        </Link>
      ) : (
        <div className="card p-5 flex flex-col justify-center">
          <p className="font-bold mb-1">💎 {de ? "Werde Teil von BrickSpecs" : "Join BrickSpecs"}</p>
          <p className="text-sm text-[var(--muted)]">
            {de
              ? "Portfolio, Preisalarme, Wunschliste und echte BrickLink-Marktdaten - kostenlos starten."
              : "Portfolio, price alerts, wishlist and real BrickLink market data - start for free."}
          </p>
        </div>
      )}
    </section>
  );
}
