"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLang, useT } from "@/lib/i18n";
import { formatEUR } from "@/lib/format";
import { isLoggedIn } from "@/lib/auth";
import { getAlerts, removeAlert, updateAlert, type AlertItem } from "@/lib/alerts";
import BrickImage from "@/components/BrickImage";

const TXT = {
  title: { de: "Preisalarme", en: "Price alerts" },
  sub: {
    de: "Wir vergleichen deinen Wunschpreis mit dem aktuellen Durchschnittspreis.",
    en: "We compare your target price with the current average price.",
  },
  loginNeeded: {
    de: "Melde dich an, um deine Preisalarme zu sehen.",
    en: "Log in to see your price alerts.",
  },
  empty: {
    de: "Du hast noch keine Preisalarme. Öffne ein Set im Lexikon und setze deinen Wunschpreis.",
    en: "You have no price alerts yet. Open a set in the encyclopedia and set your target price.",
  },
  emptyCta: { de: "Zum Set-Lexikon", en: "Browse the encyclopedia" },
  triggered: { de: "Zielpreis erreicht", en: "Target price reached" },
  triggeredSection: { de: "Ausgelöste Alarme", en: "Triggered alerts" },
  waitingSection: { de: "Noch nicht erreicht", en: "Not reached yet" },
  current: { de: "Aktuell", en: "Current" },
  target: { de: "Wunschpreis (€)", en: "Target price (€)" },
  above: { de: "über Ziel", en: "above target" },
  noPrice: { de: "Kein aktueller Preis verfügbar", en: "No current price available" },
  remove: { de: "Entfernen", en: "Remove" },
  loading: { de: "Preise werden geladen …", en: "Loading prices …" },
  note: {
    de: "Hinweis: Die Preise stammen aktuell aus dem Demo-Modell (wie im Preis-Panel). Push- und E-Mail-Benachrichtigungen folgen in Phase 2/3.",
    en: "Note: Prices currently come from the demo model (same as the price panel). Push and e-mail notifications will follow in phase 2/3.",
  },
} as const;

interface PriceInfo {
  avgNewEUR: number | null;
  avgUsedEUR: number | null;
}

export default function PriceAlertsPage() {
  const { lang } = useLang();
  const t = useT();

  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [prices, setPrices] = useState<Record<string, PriceInfo>>({});
  const [pricesLoading, setPricesLoading] = useState(false);
  /** Eingabe-Puffer für editierbare Wunschpreise (alertId → Rohtext) */
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    const li = isLoggedIn();
    setLoggedIn(li);
    if (li) setAlerts(getAlerts());
    setReady(true);
  }, []);

  // Aktuelle Preise laden - Quelle & Land wie im PricePanel aus dem localStorage
  useEffect(() => {
    if (alerts.length === 0) {
      setPrices({});
      return;
    }
    let cancelled = false;
    setPricesLoading(true);
    const source =
      window.localStorage.getItem("bricktopia.priceSource") === "ebay-sold"
        ? "ebay-sold"
        : "bricklink";
    const country = window.localStorage.getItem("bricktopia.country") || "DE";
    const uniqueIds = Array.from(new Set(alerts.map((a) => a.setId)));
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
  }, [alerts]);

  const currentPrice = (a: AlertItem): number | null => {
    const p = prices[a.setId];
    if (!p) return null;
    return a.condition === "new" ? p.avgNewEUR : p.avgUsedEUR;
  };

  const { triggered, waiting } = useMemo(() => {
    const triggered: AlertItem[] = [];
    const waiting: AlertItem[] = [];
    for (const a of alerts) {
      const cur = currentPrice(a);
      if (cur !== null && cur <= a.targetEUR) triggered.push(a);
      else waiting.push(a);
    }
    return { triggered, waiting };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alerts, prices]);

  const commitTarget = (a: AlertItem) => {
    const raw = drafts[a.alertId];
    if (raw === undefined) return;
    const value = Number(raw.replace(",", "."));
    if (Number.isFinite(value) && value > 0 && value !== a.targetEUR) {
      setAlerts(updateAlert(a.alertId, { targetEUR: value }));
    }
    setDrafts((d) => {
      const next = { ...d };
      delete next[a.alertId];
      return next;
    });
  };

  const renderAlert = (a: AlertItem, isTriggered: boolean) => {
    const cur = currentPrice(a);
    const diff = cur !== null ? cur - a.targetEUR : null;
    return (
      <div
        key={a.alertId}
        className={`card grid sm:grid-cols-[90px_1fr_auto] items-center ${
          isTriggered ? "!border-[#4cd587] border-l-4 !border-l-[#4cd587]" : ""
        }`}
      >
        <Link href={`/lexikon/${a.setId}`}>
          <BrickImage
            src={a.img}
            alt={a.name}
            label={a.setId}
            className="h-20 w-full"
            imgClassName="object-contain p-1"
          />
        </Link>
        <div className="p-4 min-w-0">
          <Link href={`/lexikon/${a.setId}`} className="font-semibold hover:text-[var(--yellow)]">
            {a.name}
          </Link>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="font-mono text-xs text-[var(--muted)]">{a.setId}</span>
            <span className="badge badge-gray">
              {a.condition === "new" ? t("price.new") : t("price.used")}
            </span>
            {isTriggered && (
              <span className="badge badge-green">✅ {TXT.triggered[lang]}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-[var(--muted)]">{TXT.target[lang]}:</span>
            <input
              type="text"
              inputMode="decimal"
              value={drafts[a.alertId] ?? String(a.targetEUR).replace(".", lang === "de" ? "," : ".")}
              onChange={(e) => setDrafts((d) => ({ ...d, [a.alertId]: e.target.value }))}
              onBlur={() => commitTarget(a)}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
              className="input !w-24 !py-1 !px-2 text-sm"
            />
          </div>
        </div>
        <div className="px-4 pb-4 sm:pb-0 sm:pr-5 text-left sm:text-right">
          {pricesLoading ? (
            <p className="text-sm text-[var(--muted)]">…</p>
          ) : cur !== null ? (
            <>
              <p className={`font-bold ${isTriggered ? "text-[#4cd587]" : "text-[var(--yellow)]"}`}>
                {TXT.current[lang]}: {formatEUR(cur, lang)}
              </p>
              {!isTriggered && diff !== null && (
                <p className="text-xs font-bold text-[#ff6b6c]">
                  +{formatEUR(diff, lang)} {TXT.above[lang]}
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-[var(--muted)]">{TXT.noPrice[lang]}</p>
          )}
          <button
            className="text-xs text-[var(--muted)] hover:text-[#ff6b6c] mt-1"
            onClick={() => setAlerts(removeAlert(a.alertId))}
          >
            🗑 {TXT.remove[lang]}
          </button>
        </div>
      </div>
    );
  };

  if (!ready) return null;

  if (!loggedIn) {
    return (
      <div className="max-w-md mx-auto pt-14 text-center card p-10">
        <p className="text-4xl mb-3">🔔</p>
        <p className="mb-5 text-[var(--muted)]">{TXT.loginNeeded[lang]}</p>
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
        <h1 className="text-3xl font-extrabold mb-1">🔔 {TXT.title[lang]}</h1>
        <p className="text-[var(--muted)]">{TXT.sub[lang]}</p>
      </div>

      {alerts.length === 0 ? (
        <div className="card p-10 text-center text-[var(--muted)]">
          <p className="mb-5">{TXT.empty[lang]}</p>
          <Link href="/lexikon" className="btn btn-primary">
            {TXT.emptyCta[lang]}
          </Link>
        </div>
      ) : (
        <>
          {pricesLoading && (
            <p className="text-sm text-[var(--muted)]">{TXT.loading[lang]}</p>
          )}

          {triggered.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="font-bold text-lg text-[#4cd587]">
                ✅ {TXT.triggeredSection[lang]} ({triggered.length})
              </h2>
              {triggered.map((a) => renderAlert(a, true))}
            </section>
          )}

          {waiting.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="font-bold text-lg">
                ⏳ {TXT.waitingSection[lang]} ({waiting.length})
              </h2>
              {waiting.map((a) => renderAlert(a, false))}
            </section>
          )}
        </>
      )}

      <p className="text-xs text-[var(--muted)]">{TXT.note[lang]}</p>
    </div>
  );
}
