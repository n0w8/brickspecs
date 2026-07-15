"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SETS } from "@/data/sets";
import type { Lang, PricePoint } from "@/data/types";
import { useLang } from "@/lib/i18n";
import { formatEUR } from "@/lib/format";
import { isAuthenticated } from "@/lib/auth";
import { getPortfolio, type PortfolioItem } from "@/lib/portfolio";
import PriceChart from "./PriceChart";

// Beispiel-Portfolio als Fallback (klar gekennzeichnet)
const DEMO_PORTFOLIO: PricePoint[] = [
  { year: 2020, priceEUR: 1240 },
  { year: 2021, priceEUR: 1690 },
  { year: 2022, priceEUR: 2150 },
  { year: 2023, priceEUR: 2480 },
  { year: 2024, priceEUR: 3120 },
  { year: 2025, priceEUR: 3890 },
  { year: 2026, priceEUR: 4560 },
];

/** Interpoliert eine kuratierte Preishistorie linear am gegebenen Jahr. */
function interpolate(history: PricePoint[], year: number): number {
  const sorted = [...history].sort((a, b) => a.year - b.year);
  if (year <= sorted[0].year) return sorted[0].priceEUR;
  const last = sorted[sorted.length - 1];
  if (year >= last.year) return last.priceEUR;
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (year >= a.year && year <= b.year) {
      const t = (year - a.year) / (b.year - a.year);
      return a.priceEUR + t * (b.priceEUR - a.priceEUR);
    }
  }
  return last.priceEUR;
}

/** Wert eines Postens (pro Stück) im gegebenen Jahr, normiert auf den heutigen API-Wert. */
function unitValueAtYear(
  item: PortfolioItem,
  year: number,
  nowYear: number,
  unitNow: number
): number {
  const addedYear = new Date(item.addedAt).getFullYear();
  if (year < addedYear) return 0;
  if (year >= nowYear) return unitNow;

  const curated = SETS.find((s) => s.id === item.setId.replace(/-\d+$/, ""));
  if (curated && curated.priceHistory.length >= 2) {
    const base = interpolate(curated.priceHistory, year);
    const baseNow = interpolate(curated.priceHistory, nowYear);
    return baseNow > 0 ? (base / baseNow) * unitNow : unitNow;
  }
  if (item.purchasePriceEUR !== null && nowYear > addedYear) {
    const t = (year - addedYear) / (nowYear - addedYear);
    return item.purchasePriceEUR + t * (unitNow - item.purchasePriceEUR);
  }
  return unitNow;
}

/**
 * Frische Portfolios haben noch keine Jahres-Historie - statt eines
 * Platzhalters zeigen wir eine einfache 2-Punkte-Linie von "Investiert"
 * (Summe Kaufpreise) zu "Wert heute". Optik wie PriceChart.
 */
function TwoPointChart({
  investedEUR,
  todayEUR,
  lang,
}: {
  investedEUR: number;
  todayEUR: number;
  lang: Lang;
}) {
  // Ohne hinterlegte Kaufpreise (investiert = 0) waere die Linie irrefuehrend
  // steil - dann flach beim heutigen Wert starten.
  const start = investedEUR > 0 ? investedEUR : todayEUR;
  const data = [
    { label: lang === "de" ? "Investiert" : "Invested", valueEUR: Math.round(start) },
    { label: lang === "de" ? "Heute" : "Today", valueEUR: Math.round(todayEUR) },
  ];
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="heroTwoPointFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f6c700" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#f6c700" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#232c47" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="#94a0bd"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: "#232c47" }}
            padding={{ left: 24, right: 24 }}
          />
          <YAxis
            stroke="#94a0bd"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={70}
            domain={["auto", "auto"]}
            tickFormatter={(v: number) => formatEUR(v, lang)}
          />
          <Tooltip
            contentStyle={{
              background: "#1a2138",
              border: "1px solid #232c47",
              borderRadius: 10,
              color: "#f2f4fb",
            }}
            labelStyle={{ color: "#94a0bd" }}
            formatter={(value) => [
              formatEUR(value as number, lang),
              lang === "de" ? "Wert" : "Value",
            ]}
          />
          <Area
            type="monotone"
            dataKey="valueEUR"
            stroke="#f6c700"
            strokeWidth={2.5}
            fill="url(#heroTwoPointFill)"
            dot={{ fill: "#f6c700", r: 4 }}
            activeDot={{ r: 5.5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Teaser für Gäste (nicht eingeloggt): Beispiel-Kurve + Nutzen + Registrieren-CTA.
 * Klar als Beispiel gekennzeichnet.
 */
function GuestTeaser({ lang }: { lang: Lang }) {
  const benefits =
    lang === "de"
      ? [
          "Wertentwicklung deiner Sets live verfolgen",
          "Preisalarme bei deinem Wunschpreis",
          "EOL-Warnungen, bevor ein Set verschwindet",
        ]
      : [
          "Track the value of your sets live",
          "Price alerts at your target price",
          "EOL warnings before a set retires",
        ];
  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-bold">
          📈 {lang === "de" ? "Deine Sammlung als Depot" : "Your collection as a portfolio"}
        </h2>
        <span className="badge badge-yellow">
          {lang === "de" ? "Beispiel-Depot" : "Sample portfolio"}
        </span>
      </div>
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={DEMO_PORTFOLIO} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="guestTeaserStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#23a45c" />
                <stop offset="100%" stopColor="#f6c700" />
              </linearGradient>
              <linearGradient id="guestTeaserFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#23a45c" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#f6c700" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#232c47" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="year"
              stroke="#94a0bd"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#232c47" }}
            />
            <YAxis
              stroke="#94a0bd"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={62}
              tickFormatter={(v: number) => formatEUR(v, lang)}
            />
            <Tooltip
              contentStyle={{
                background: "#1a2138",
                border: "1px solid #232c47",
                borderRadius: 10,
                color: "#f2f4fb",
              }}
              labelStyle={{ color: "#94a0bd" }}
              formatter={(value) => [
                formatEUR(value as number, lang),
                lang === "de" ? "Beispielwert" : "Sample value",
              ]}
            />
            <Area
              type="monotone"
              dataKey="priceEUR"
              stroke="url(#guestTeaserStroke)"
              strokeWidth={2.5}
              fill="url(#guestTeaserFill)"
              dot={false}
              activeDot={{ r: 5, fill: "#f6c700" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-[var(--muted)]">
        {lang === "de"
          ? "Beispiel: 12 Sets, 2020 zur UVP gekauft - heute 4.560 €"
          : "Example: 12 sets bought at RRP in 2020 - worth 4,560 € today"}{" "}
        <span className="badge badge-green">+268%</span>
      </p>
      <ul className="flex flex-col gap-1.5 text-sm">
        {benefits.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <span className="text-[#4cd587] font-bold" aria-hidden>
              ✓
            </span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-3 mt-1">
        <Link href="/registrieren" className="btn btn-primary flex-1">
          {lang === "de" ? "Kostenlos registrieren" : "Sign up for free"} →
        </Link>
        <Link
          href="/login"
          className="text-sm text-[var(--muted)] hover:text-[var(--yellow)] whitespace-nowrap"
        >
          {lang === "de" ? "Anmelden" : "Log in"}
        </Link>
      </div>
    </div>
  );
}

export default function HeroPortfolioChart() {
  const { lang } = useLang();
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [items, setItems] = useState<PortfolioItem[] | null>(null);
  const [unitPrices, setUnitPrices] = useState<Record<string, number | null> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const li = await isAuthenticated();
      const pf = li ? await getPortfolio() : [];
      if (cancelled) return;
      setLoggedIn(li);
      setItems(pf);
      if (pf.length === 0) {
        setUnitPrices({});
        return;
      }
      const country = window.localStorage.getItem("bricktopia.country") ?? "DE";
      const source = window.localStorage.getItem("bricktopia.priceSource") ?? "bricklink";
      const conditionOf = new Map(pf.map((i) => [i.setId, i.condition]));
      const ids = Array.from(new Set(pf.map((i) => i.setId)));
      const entries = await Promise.all(
        ids.map((id) =>
          fetch(`/api/prices/${encodeURIComponent(id)}?source=${source}&country=${country}`)
            .then((r) => r.json())
            .then((j: { avgNewEUR: number | null; avgUsedEUR: number | null }) => {
              const primary =
                conditionOf.get(id) === "used"
                  ? (j.avgUsedEUR ?? j.avgNewEUR)
                  : (j.avgNewEUR ?? j.avgUsedEUR);
              return [id, primary] as const;
            })
            .catch(() => [id, null] as const)
        )
      );
      if (!cancelled) setUnitPrices(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const real = useMemo(() => {
    if (!items || items.length === 0 || !unitPrices) return null;
    const nowYear = new Date().getFullYear();

    let totalNow = 0;
    let invested = 0;
    let units = 0;
    for (const item of items) {
      const unit = unitPrices[item.setId] ?? item.purchasePriceEUR ?? 0;
      totalNow += unit * item.quantity;
      units += item.quantity;
      if (item.purchasePriceEUR !== null) invested += item.purchasePriceEUR * item.quantity;
    }

    const startYear = Math.min(
      nowYear,
      ...items.map((i) => new Date(i.addedAt).getFullYear())
    );
    const history: PricePoint[] = [];
    for (let y = Math.max(startYear, nowYear - 6); y <= nowYear; y++) {
      let total = 0;
      for (const item of items) {
        const unit = unitPrices[item.setId] ?? item.purchasePriceEUR ?? 0;
        total += unitValueAtYear(item, y, nowYear, unit) * item.quantity;
      }
      history.push({ year: y, priceEUR: Math.round(total) });
    }

    const gainPct =
      invested > 0 ? Math.round(((totalNow - invested) / invested) * 100) : null;
    return { totalNow, invested, units, count: items.length, history, gainPct };
  }, [items, unitPrices]);

  // Noch am Laden: Platzhalter in Kartenhöhe, kein Layout-Springen
  if (loggedIn === null || items === null || (items.length > 0 && unitPrices === null)) {
    return (
      <div className="card p-5 min-h-[380px] flex items-center justify-center">
        <p className="text-sm text-[var(--muted)]">
          {lang === "de" ? "Portfolio wird geladen ..." : "Loading portfolio ..."}
        </p>
      </div>
    );
  }

  // Gäste sehen den Teaser mit Beispiel-Kurve und Registrieren-CTA
  if (!loggedIn) {
    return <GuestTeaser lang={lang} />;
  }

  // Fallback: Beispiel-Portfolio (eingeloggt, aber Portfolio noch leer)
  if (!real) {
    return (
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <h2 className="font-bold">
            📈 {lang === "de" ? "Portfolio-Wertentwicklung" : "Portfolio value growth"}
          </h2>
          <span className="badge badge-green">+268%</span>
        </div>
        <p className="text-xs text-[var(--muted)] mb-3">
          {lang === "de"
            ? "Beispiel-Portfolio: 12 Sets, gekauft 2020 zur UVP"
            : "Sample portfolio: 12 sets, bought at RRP in 2020"}
        </p>
        <PriceChart data={DEMO_PORTFOLIO} />
        <div className="flex items-center justify-between mt-3">
          <div>
            <p className="text-xs text-[var(--muted)]">
              {lang === "de" ? "Wert heute" : "Value today"}
            </p>
            <p className="text-xl font-extrabold text-[var(--yellow)]">4.560 €</p>
          </div>
          <Link href="/portfolio" className="btn btn-primary !py-1.5 !px-4 text-sm">
            {lang === "de" ? "Eigenes Portfolio anlegen" : "Build your own"} →
          </Link>
        </div>
      </div>
    );
  }

  // Echtes Portfolio
  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <h2 className="font-bold">
          📈 {lang === "de" ? "Dein Portfolio" : "Your portfolio"}
        </h2>
        {real.gainPct !== null && (
          <span className={`badge ${real.gainPct >= 0 ? "badge-green" : "badge-red"}`}>
            {real.gainPct >= 0 ? "+" : ""}
            {real.gainPct}%
          </span>
        )}
      </div>
      <p className="text-xs text-[var(--muted)] mb-3">
        {real.count} Sets · {real.units}{" "}
        {lang === "de" ? "Exemplare" : "units"}
        {real.invested > 0
          ? ` · ${lang === "de" ? "investiert" : "invested"}: ${formatEUR(real.invested, lang)}`
          : ""}
      </p>
      {real.history.length >= 2 ? (
        <PriceChart data={real.history} />
      ) : (
        <TwoPointChart
          investedEUR={real.invested}
          todayEUR={real.totalNow}
          lang={lang}
        />
      )}
      <div className="flex items-center justify-between mt-3">
        <div>
          <p className="text-xs text-[var(--muted)]">
            {lang === "de" ? "Wert heute" : "Value today"}
          </p>
          <p className="text-xl font-extrabold text-[var(--yellow)]">
            {formatEUR(real.totalNow, lang)}
          </p>
        </div>
        <Link href="/portfolio" className="btn btn-primary !py-1.5 !px-4 text-sm">
          {lang === "de" ? "Zum Portfolio" : "Open portfolio"} →
        </Link>
      </div>
    </div>
  );
}
