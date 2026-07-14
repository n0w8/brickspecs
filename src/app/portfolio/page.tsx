"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLang, useT } from "@/lib/i18n";
import { formatEUR } from "@/lib/format";
import { getProfile, isAuthenticated } from "@/lib/auth";
import { portfolioLimit } from "@/lib/plan";
import { getPortfolio, removeItem, updateItem, type PortfolioItem } from "@/lib/portfolio";
import BrickImage from "@/components/BrickImage";
import PortfolioAllocation from "@/components/PortfolioAllocation";

const COUNTRIES: { code: string; de: string; en: string }[] = [
  { code: "DE", de: "Deutschland", en: "Germany" },
  { code: "AT", de: "Österreich", en: "Austria" },
  { code: "CH", de: "Schweiz", en: "Switzerland" },
  { code: "US", de: "USA", en: "United States" },
  { code: "GB", de: "Großbritannien", en: "United Kingdom" },
  { code: "FR", de: "Frankreich", en: "France" },
  { code: "NL", de: "Niederlande", en: "Netherlands" },
  { code: "IT", de: "Italien", en: "Italy" },
  { code: "ES", de: "Spanien", en: "Spain" },
  { code: "PL", de: "Polen", en: "Poland" },
];

interface PriceInfo {
  avgNewEUR: number | null;
  avgUsedEUR: number | null;
}

export default function PortfolioPage() {
  const { lang } = useLang();
  const t = useT();

  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [prices, setPrices] = useState<Record<string, PriceInfo>>({});
  const [country, setCountry] = useState("DE");
  const [source, setSource] = useState<"bricklink" | "ebay-sold">("bricklink");
  const [pricesLoading, setPricesLoading] = useState(false);
  const [freePlan, setFreePlan] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const c = window.localStorage.getItem("bricktopia.country");
    if (c && COUNTRIES.some((x) => x.code === c)) setCountry(c);
    const s = window.localStorage.getItem("bricktopia.priceSource");
    if (s === "ebay-sold") setSource(s);
    void (async () => {
      const li = await isAuthenticated();
      if (cancelled) return;
      setLoggedIn(li);
      if (li) {
        const [pf, profile] = await Promise.all([getPortfolio(), getProfile()]);
        if (cancelled) return;
        setItems(pf);
        // Nur im Supabase-Modus gibt es ein Profil - dort greifen die Limits.
        setFreePlan(profile?.plan === "free");
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Preise für alle Positionen laden
  useEffect(() => {
    if (items.length === 0) {
      setPrices({});
      return;
    }
    let cancelled = false;
    setPricesLoading(true);
    const uniqueIds = Array.from(new Set(items.map((i) => i.setId)));
    Promise.all(
      uniqueIds.map((id) =>
        fetch(`/api/prices/${encodeURIComponent(id)}?source=${source}&country=${country}`)
          .then((r) => r.json())
          .then((j: PriceInfo) => [id, { avgNewEUR: j.avgNewEUR, avgUsedEUR: j.avgUsedEUR }] as const)
          .catch(() => [id, { avgNewEUR: null, avgUsedEUR: null }] as const)
      )
    ).then((entries) => {
      if (cancelled) return;
      setPrices(Object.fromEntries(entries));
      setPricesLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [items, country, source]);

  const unitValue = useCallback(
    (item: PortfolioItem): number | null => {
      const p = prices[item.setId];
      if (!p) return null;
      const primary = item.condition === "new" ? p.avgNewEUR : p.avgUsedEUR;
      return primary ?? p.avgNewEUR ?? p.avgUsedEUR ?? null;
    },
    [prices]
  );

  const totals = useMemo(() => {
    let currentAll = 0;
    let investedKnown = 0;
    let currentOfKnown = 0;
    let units = 0;
    for (const item of items) {
      units += item.quantity;
      const uv = unitValue(item);
      if (uv !== null) currentAll += uv * item.quantity;
      if (item.purchasePriceEUR !== null) {
        investedKnown += item.purchasePriceEUR * item.quantity;
        if (uv !== null) currentOfKnown += uv * item.quantity;
      }
    }
    const gain = currentOfKnown - investedKnown;
    const gainPct = investedKnown > 0 ? Math.round((gain / investedKnown) * 100) : null;
    return { currentAll, investedKnown, gain, gainPct, units };
  }, [items, unitValue]);

  const allocation = useMemo(() => {
    return items
      .map((item) => {
        const uv = unitValue(item);
        return { name: item.name, value: uv !== null ? uv * item.quantity : 0 };
      })
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [items, unitValue]);

  if (!ready) return null;

  if (!loggedIn) {
    return (
      <div className="max-w-md mx-auto pt-14 text-center card p-10">
        <p className="text-4xl mb-3">📁</p>
        <p className="mb-5 text-[var(--muted)]">{t("pf.loginNeeded")}</p>
        <div className="flex gap-3 justify-center">
          <Link href="/login" className="btn">
            {t("auth.loginTitle")}
          </Link>
          <Link href="/registrieren" className="btn btn-primary">
            {t("auth.registerTitle")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pt-8">
      <div>
        <h1 className="text-3xl font-extrabold mb-1">📁 {t("pf.title")}</h1>
        <p className="text-[var(--muted)]">{t("pf.sub")}</p>
      </div>

      {items.length === 0 ? (
        <div className="card p-10 text-center text-[var(--muted)]">
          <p className="mb-5">{t("pf.empty")}</p>
          <Link href="/lexikon" className="btn btn-primary">
            {t("pf.emptyCta")}
          </Link>
        </div>
      ) : (
        <>
          {/* Upsell, wenn das Gratis-Limit erreicht ist */}
          {freePlan && items.length >= portfolioLimit("free") && (
            <div className="card !border-[var(--yellow)] p-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm">
                {lang === "de"
                  ? "Gratis-Limit erreicht (5 Sets) - upgrade auf Sammler für ein unbegrenztes Portfolio."
                  : "Free limit reached (5 sets) - upgrade to Collector for an unlimited portfolio."}
              </p>
              <Link href="/preise" className="btn btn-primary !py-1.5 !px-4 text-sm shrink-0">
                {lang === "de" ? "Jetzt upgraden" : "Upgrade now"} →
              </Link>
            </div>
          )}

          {/* Steuerung Land & Quelle */}
          <div className="card p-4 grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              {t("price.country")}
              <select
                className="input"
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  window.localStorage.setItem("bricktopia.country", e.target.value);
                }}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c[lang]} ({c.code})
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              {t("price.source")}
              <select
                className="input"
                value={source}
                onChange={(e) => {
                  const v = e.target.value === "ebay-sold" ? "ebay-sold" : "bricklink";
                  setSource(v);
                  window.localStorage.setItem("bricktopia.priceSource", v);
                }}
              >
                <option value="bricklink">{t("price.bricklink")}</option>
                <option value="ebay-sold">{t("price.ebay")}</option>
              </select>
            </label>
          </div>

          {/* Kennzahlen */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="card p-5">
              <p className="text-xs text-[var(--muted)] mb-1">{t("pf.currentValue")}</p>
              <p className="text-2xl font-extrabold text-[var(--yellow)]">
                {pricesLoading ? "…" : formatEUR(totals.currentAll, lang)}
              </p>
              <p className="text-xs text-[var(--muted)] mt-1">
                {items.length} {t("pf.items")} · {totals.units} {t("pf.units")}
              </p>
            </div>
            <div className="card p-5">
              <p className="text-xs text-[var(--muted)] mb-1">{t("pf.invested")}</p>
              <p className="text-2xl font-extrabold">
                {totals.investedKnown > 0 ? formatEUR(totals.investedKnown, lang) : "-"}
              </p>
              <p className="text-xs text-[var(--muted)] mt-1">{t("pf.investedHint")}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs text-[var(--muted)] mb-1">{t("pf.gain")}</p>
              {totals.gainPct !== null ? (
                <p
                  className={`text-2xl font-extrabold ${totals.gain >= 0 ? "text-[#4cd587]" : "text-[#ff6b6c]"}`}
                >
                  {totals.gain >= 0 ? "+" : ""}
                  {formatEUR(totals.gain, lang)}
                  <span className="text-base"> ({totals.gain >= 0 ? "+" : ""}{totals.gainPct}%)</span>
                </p>
              ) : (
                <p className="text-2xl font-extrabold">-</p>
              )}
            </div>
          </div>

          {/* Verteilung */}
          {allocation.length > 1 && (
            <div className="card p-5">
              <h2 className="font-bold text-lg mb-2">🍩 {t("pf.allocation")}</h2>
              <PortfolioAllocation data={allocation} />
            </div>
          )}

          {/* Positionen */}
          <div className="flex flex-col gap-3">
            {items.map((item) => {
              const uv = unitValue(item);
              const lineValue = uv !== null ? uv * item.quantity : null;
              const lineInvested =
                item.purchasePriceEUR !== null ? item.purchasePriceEUR * item.quantity : null;
              const lineGain =
                lineValue !== null && lineInvested !== null ? lineValue - lineInvested : null;
              return (
                <div key={item.lineId} className="card grid sm:grid-cols-[90px_1fr_auto] items-center">
                  <Link href={`/lexikon/${item.setId}`}>
                    <BrickImage
                      src={item.img}
                      alt={item.name}
                      label={item.setId}
                      className="h-20 w-full"
                      imgClassName="object-contain p-1"
                    />
                  </Link>
                  <div className="p-4 min-w-0">
                    <Link href={`/lexikon/${item.setId}`} className="font-semibold hover:text-[var(--yellow)]">
                      {item.name}
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="font-mono text-xs text-[var(--muted)]">{item.setId}</span>
                      <span className="badge badge-gray">
                        {item.condition === "new" ? t("price.new") : t("price.used")}
                      </span>
                      <span className="text-xs text-[var(--muted)]">
                        {item.quantity}× ·{" "}
                        {item.purchasePriceEUR !== null
                          ? `${formatEUR(item.purchasePriceEUR, lang)} ${t("pf.perUnit")}`
                          : `${t("pf.purchasePrice")}: -`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-[var(--muted)]">{t("pf.quantity")}:</span>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => {
                          void updateItem(item.lineId, {
                            quantity: Math.max(1, Number(e.target.value)),
                          }).then(setItems);
                        }}
                        className="input !w-20 !py-1 !px-2 text-sm"
                      />
                    </div>
                  </div>
                  <div className="px-4 pb-4 sm:pb-0 sm:pr-5 text-left sm:text-right">
                    <p className="font-bold text-[var(--yellow)]">
                      {lineValue !== null ? formatEUR(lineValue, lang) : "-"}
                    </p>
                    {lineGain !== null && (
                      <p className={`text-xs font-bold ${lineGain >= 0 ? "text-[#4cd587]" : "text-[#ff6b6c]"}`}>
                        {lineGain >= 0 ? "+" : ""}
                        {formatEUR(lineGain, lang)}
                      </p>
                    )}
                    <button
                      className="text-xs text-[var(--muted)] hover:text-[#ff6b6c] mt-1"
                      onClick={() => {
                        void removeItem(item.lineId).then(setItems);
                      }}
                    >
                      🗑 {t("pf.remove")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-[var(--muted)]">{t("price.demoNote")}</p>
        </>
      )}
    </div>
  );
}
