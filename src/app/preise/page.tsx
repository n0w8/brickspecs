"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import type { Lang } from "@/data/types";
import { getProfile, isAuthenticated } from "@/lib/auth";
import { startCheckout, stripePaywallEnabled, stripeTestMode } from "@/lib/paywall";
import {
  FOUNDER_COMING_SOON,
  FOUNDER_REMAINING,
  FOUNDER_TOTAL,
  PLAN_META,
  formatFounderNumber,
  getPlan,
  setPlan,
  type Billing,
  type Plan,
} from "@/lib/plan";

/* ---------- Preislogik ---------- */

type Currency = "EUR" | "USD" | "GBP";

const RATES: Record<Currency, number> = { EUR: 1, USD: 1.08, GBP: 0.86 };

/** Statische Demo-Umrechnung: EUR-Basis, USD/GBP auf .99 gerundet. */
function convert(eur: number, cur: Currency): number {
  if (eur === 0) return 0;
  if (cur === "EUR") return eur;
  return Math.max(0.99, Math.round(eur * RATES[cur]) - 0.01);
}

function fmt(value: number, cur: Currency, lang: Lang): string {
  return new Intl.NumberFormat(lang === "de" ? "de-DE" : "en-GB", {
    style: "currency",
    currency: cur,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/* ---------- Karten-Definitionen ---------- */

interface CardDef {
  id: Plan;
  monthlyEUR: number;
  yearlyEUR: number;
  /** Einmalpreis (nur Founder) */
  onceEUR?: number;
  tagline: { de: string; en: string };
  features: { de: string; en: string }[];
  cta: { de: string; en: string };
}

const CARDS: CardDef[] = [
  {
    id: "free",
    monthlyEUR: 0,
    yearlyEUR: 0,
    tagline: {
      de: "Alles zum Stöbern - für immer kostenlos.",
      en: "Everything for browsing - free forever.",
    },
    features: [
      { de: "Kompletter Katalog: 19.000+ Bau-Sets & 17.000+ Figuren", en: "Full catalog: 19,000+ building sets & 17,000+ figures" },
      { de: "Aktuelle Preise nach Land & Quelle", en: "Current prices by country & source" },
      { de: "5 Portfolio-Sets", en: "5 portfolio sets" },
      { de: "3 Preisalarme", en: "3 price alerts" },
      { de: "30-Tage-Preishistorie", en: "30-day price history" },
    ],
    cta: { de: "Kostenlos starten", en: "Start for free" },
  },
  {
    id: "sammler",
    monthlyEUR: 2.99,
    yearlyEUR: 29.99,
    tagline: {
      de: "Für alle, die ihre Sammlung ernsthaft tracken.",
      en: "For everyone who tracks their collection seriously.",
    },
    features: [
      { de: "Unbegrenztes Portfolio", en: "Unlimited portfolio" },
      { de: "Unbegrenzte Preisalarme", en: "Unlimited price alerts" },
      { de: "Tägliche Deal-Zusammenfassung", en: "Daily deal digest" },
      { de: "Volle Preishistorie", en: "Full price history" },
      { de: "EOL-Watchlist", en: "EOL watchlist" },
    ],
    cta: { de: "Sammeln starten", en: "Start collecting" },
  },
  {
    id: "investor",
    monthlyEUR: 6.99,
    yearlyEUR: 69.99,
    tagline: {
      de: "Maximale Daten für Kauf- und Verkaufsentscheidungen.",
      en: "Maximum data for buying and selling decisions.",
    },
    features: [
      { de: "Alles aus Sammler", en: "Everything in Collector" },
      { de: "Deal-Alerts im Stundentakt", en: "Hourly deal alerts" },
      { de: "Part-Out-Analysen", en: "Part-out analyses" },
      { de: "Investment-Rankings", en: "Investment rankings" },
      { de: "CSV-Export", en: "CSV export" },
      { de: "Priority-Support", en: "Priority support" },
    ],
    cta: { de: "Smarter investieren", en: "Invest smarter" },
  },
  {
    id: "founder",
    monthlyEUR: 0,
    yearlyEUR: 0,
    onceEUR: 49,
    tagline: {
      de: "Einmal zahlen, für immer dabei - limitiert auf 500 Stück.",
      en: "Pay once, stay forever - limited to 500 bricks.",
    },
    features: [
      { de: "Alle Investor-Features - lebenslang", en: "All Investor features - for life" },
      {
        de: "Exklusives Founder-Emblem mit deiner Nummer (z. B. #042 von 500) - wird technisch nie wieder vergeben",
        en: "Exclusive founder emblem with your number (e.g. #042 of 500) - technically never issued again",
      },
      {
        de: "Dein Name auf der Supporter-Wall (kommt mit Phase 3)",
        en: "Your name on the supporter wall (coming with phase 3)",
      },
      {
        de: "Zugang zu allen zukünftigen Premium-Features ohne Aufpreis",
        en: "Access to all future premium features at no extra cost",
      },
    ],
    cta: { de: "Founder werden", en: "Become a founder" },
  },
];

/* ---------- FAQ ---------- */

const FAQ: {
  q: { de: string; en: string };
  a: { de: string; en: string };
  /** Alternative Antwort, sobald die echte Stripe-Zahlung aktiv ist. */
  aLive?: { de: string; en: string };
}[] = [
  {
    q: { de: "Kann ich jederzeit kündigen?", en: "Can I cancel anytime?" },
    a: {
      de: "Ja. Monats-Abos enden zum Ende des laufenden Monats, Jahres-Abos zum Ende des Abrechnungsjahres. Der Founder Brick ist ein Einmalkauf und läuft nie ab.",
      en: "Yes. Monthly plans end at the end of the current month, yearly plans at the end of the billing year. The Founder Brick is a one-time purchase and never expires.",
    },
  },
  {
    q: {
      de: "Was passiert mit meinen Daten im Free-Plan?",
      en: "What happens to my data on the free plan?",
    },
    a: {
      de: "Nichts geht verloren. Hast du mehr als 5 Portfolio-Sets oder 3 Preisalarme und wechselst auf Baumeister, bleiben alle Einträge gespeichert - du kannst nur keine neuen anlegen, bis du wieder unter dem Limit bist oder upgradest.",
      en: "Nothing is lost. If you have more than 5 portfolio sets or 3 price alerts and switch to Builder, all entries stay saved - you just cannot add new ones until you are below the limit again or upgrade.",
    },
  },
  {
    q: { de: "Was genau ist der Founder Brick?", en: "What exactly is the Founder Brick?" },
    a: {
      de: "Eine einmalige Lifetime-Mitgliedschaft, limitiert auf 500 Stück: alle Investor-Features für immer, ein exklusives Founder-Emblem mit deiner Nummer (z. B. #042 von 500), das technisch nie wieder vergeben wird, dein Name auf der Supporter-Wall (kommt mit Phase 3) und Zugang zu allen zukünftigen Premium-Features ohne Aufpreis. Ist die Auflage weg, ist sie weg.",
      en: "A one-time lifetime membership, limited to 500 bricks: all Investor features forever, an exclusive founder emblem with your number (e.g. #042 of 500) that is technically never issued again, your name on the supporter wall (coming with phase 3) and access to all future premium features at no extra cost. Once the run is gone, it is gone.",
    },
  },
  {
    q: { de: "Habe ich ein Widerrufsrecht?", en: "Do I have a right of withdrawal?" },
    a: {
      de: "Ja. Als Verbraucher kannst du binnen 14 Tagen ab Vertragsabschluss ohne Angabe von Gründen widerrufen - formlos genügt, z. B. per E-Mail an office@fuchsmedia.at. Mit dem Kauf stimmst du ausdrücklich zu, dass wir sofort mit der Bereitstellung der digitalen Leistung beginnen; du nimmst zur Kenntnis, dass dein Widerrufsrecht mit vollständiger Bereitstellung erlischt. Bei laufenden Abos erstatten wir im Widerrufsfall anteilig für den nicht genutzten Zeitraum. Unabhängig davon kannst du dein Abo jederzeit über 'Abo verwalten' im Profil kündigen.",
      en: "Yes. As a consumer you can withdraw within 14 days of conclusion of the contract without giving reasons - informally, e.g. by e-mail to office@fuchsmedia.at. By purchasing you expressly agree that we start providing the digital service immediately; you acknowledge that your right of withdrawal expires once the service has been fully provided. For running subscriptions we refund proportionately for the unused period in case of withdrawal. Independently of this, you can cancel your subscription at any time via 'Manage subscription' in your profile.",
    },
  },
  {
    q: { de: "Wie funktioniert die Zahlung?", en: "How does payment work?" },
    a: {
      de: "Noch gar nicht - das hier ist eine ehrliche Demo. Die echte Zahlung (Stripe) wird in Phase 2 angeschlossen. Bis dahin wird dein gewählter Plan lokal in deinem Browser vorgemerkt, es wird nichts abgebucht.",
      en: "It does not yet - this is an honest demo. Real payment (Stripe) will be connected in phase 2. Until then your chosen plan is noted locally in your browser and nothing is charged.",
    },
    aLive: {
      de: "Sicher über Stripe: Du wirst zum Stripe-Checkout weitergeleitet und zahlst per Karte. Kündigen und Zahlungsdaten ändern kannst du jederzeit über \"Abo verwalten\" in deinem Profil.",
      en: "Securely via Stripe: you are redirected to Stripe Checkout and pay by card. You can cancel or change payment details anytime via \"Manage subscription\" in your profile.",
    },
  },
];

/* ---------- Seite ---------- */

export default function PricingPage() {
  const { lang } = useLang();
  const router = useRouter();

  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [currency, setCurrency] = useState<Currency>("EUR");
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [checkout, setCheckout] = useState<Plan | null>(null);
  const [activated, setActivated] = useState(false);
  const [founderNo, setFounderNo] = useState<number | null>(null);

  // Echte Stripe-Paywall aktiv? (Supabase + Publishable Key konfiguriert)
  // Build-time-Konstanten - koennen direkt im Render berechnet werden.
  const stripeMode = stripePaywallEnabled();
  const testMode = stripeMode && stripeTestMode();
  const [founderLeft, setFounderLeft] = useState<number>(FOUNDER_REMAINING);
  const [busyPlan, setBusyPlan] = useState<Plan | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void isAuthenticated().then(async (li) => {
      if (cancelled) return;
      setLoggedIn(li);
      if (li) {
        if (stripePaywallEnabled()) {
          const profile = await getProfile();
          if (!cancelled) setCurrentPlan(profile?.plan ?? "free");
        } else {
          setCurrentPlan(getPlan());
        }
      }
    });
    // Echte Founder-Restanzahl (60s serverseitig gecacht), Fallback: Demo-Wert.
    void fetch("/api/founder-remaining")
      .then((r) => r.json())
      .then((j: { remaining?: number }) => {
        if (!cancelled && typeof j.remaining === "number") setFounderLeft(j.remaining);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  function priceLine(card: CardDef): { main: string; period: string; sub?: string } {
    if (card.id === "founder") {
      return {
        main: fmt(convert(card.onceEUR ?? 0, currency), currency, lang),
        period: lang === "de" ? "einmalig" : "one-time",
        sub: lang === "de" ? "lebenslang gültig" : "valid for life",
      };
    }
    if (card.monthlyEUR === 0) {
      return {
        main: fmt(0, currency, lang),
        period: lang === "de" ? "für immer" : "forever",
      };
    }
    if (billing === "monthly") {
      return {
        main: fmt(convert(card.monthlyEUR, currency), currency, lang),
        period: lang === "de" ? "/ Monat" : "/ month",
      };
    }
    const yearly = convert(card.yearlyEUR, currency);
    const perMonth = Math.round((yearly / 12) * 100) / 100;
    return {
      main: fmt(yearly, currency, lang),
      period: lang === "de" ? "/ Jahr" : "/ year",
      sub:
        lang === "de"
          ? `entspricht ${fmt(perMonth, currency, lang)} / Monat`
          : `equals ${fmt(perMonth, currency, lang)} / month`,
    };
  }

  function onBuy(plan: Plan) {
    if (!loggedIn) {
      router.push("/registrieren");
      return;
    }
    if (stripeMode) {
      // Echter Stripe-Checkout. Der Free-Plan hat keinen Checkout - wer
      // downgraden will, macht das über "Abo verwalten" im Profil.
      if (plan === "free") {
        router.push("/profil");
        return;
      }
      setCheckoutError(null);
      setBusyPlan(plan);
      void startCheckout(plan, billing).then((err) => {
        if (!err) return; // Redirect zu Stripe läuft
        setBusyPlan(null);
        if (err.status === 409) {
          // 409 = Founder ausverkauft ODER bereits aktives Abo - die
          // Server-Meldung ist spezifischer als ein generischer Text.
          if (plan === "founder") setFounderLeft(0);
          setCheckoutError(
            err.message ||
              (lang === "de"
                ? "Der Founder Brick ist ausverkauft - alle 500 Stück sind vergeben."
                : "The Founder Brick is sold out - all 500 bricks are taken.")
          );
        } else if (err.status === 401) {
          router.push("/registrieren");
        } else {
          setCheckoutError(
            lang === "de"
              ? "Der Checkout konnte nicht gestartet werden - bitte versuch es gleich noch einmal."
              : "Checkout could not be started - please try again in a moment."
          );
        }
      });
      return;
    }
    setActivated(false);
    setCheckout(plan);
  }

  function onActivate() {
    if (!checkout) return;
    const rec = setPlan(checkout, billing as Billing);
    setCurrentPlan(checkout);
    setFounderNo(rec?.founderNumber ?? null);
    setActivated(true);
  }

  const checkoutCard = checkout ? CARDS.find((c) => c.id === checkout) : null;

  return (
    <div className="max-w-6xl mx-auto pt-14 pb-20 px-1">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-3">
          {lang === "de" ? "Werde Teil der BrickSpecs-Crew" : "Join the BrickSpecs crew"}
        </h1>
        <p className="text-[var(--muted)]">
          {lang === "de"
            ? "Keine Kreditkarte nötig. 5 Sets für immer kostenlos tracken."
            : "No credit card required. Track 5 sets for free, forever."}
        </p>
      </div>

      {/* Toggles */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
        <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-2)] p-1">
          <button
            type="button"
            className={`chip !border-0 ${billing === "monthly" ? "chip-active" : "!bg-transparent"}`}
            onClick={() => setBilling("monthly")}
          >
            {lang === "de" ? "Monatlich" : "Monthly"}
          </button>
          <button
            type="button"
            className={`chip !border-0 ${billing === "yearly" ? "chip-active" : "!bg-transparent"}`}
            onClick={() => setBilling("yearly")}
          >
            {lang === "de" ? "Jährlich (-17%)" : "Yearly (-17%)"}
          </button>
        </div>
        <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-2)] p-1">
          {(
            [
              ["USD", "$ USD"],
              ["EUR", "€ EUR"],
              ["GBP", "£ GBP"],
            ] as [Currency, string][]
          ).map(([cur, label]) => (
            <button
              key={cur}
              type="button"
              className={`chip !border-0 ${currency === cur ? "chip-active" : "!bg-transparent"}`}
              onClick={() => setCurrency(cur)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Checkout-Fehler */}
      {checkoutError && (
        <div className="card !border-[#ff6b6c] p-4 mb-6 text-sm text-center">
          {checkoutError}
        </div>
      )}

      {/* Karten */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4 items-stretch">
        {CARDS.map((card) => {
          const meta = PLAN_META[card.id];
          const price = priceLine(card);
          const isCurrent = loggedIn && currentPlan === card.id;
          const highlight = card.id === "sammler";
          const founder = card.id === "founder";

          const inner = (
            <div
              className={`card h-full flex flex-col p-6 ${
                card.id === "free" ? "!border-dashed" : ""
              } ${highlight ? "!border-[var(--yellow)]" : ""} ${founder ? "!border-0" : ""}`}
              style={
                highlight
                  ? { background: "linear-gradient(180deg, rgba(246,199,0,0.09), var(--surface) 45%)" }
                  : undefined
              }
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{meta.icon}</span>
                <h2 className="font-extrabold text-lg" style={{ color: meta.color }}>
                  {meta.name[lang]}
                </h2>
              </div>
              <p className="text-xs text-[var(--muted)] mb-4 min-h-[32px]">{card.tagline[lang]}</p>

              <div className="mb-4 min-h-[64px]">
                <p>
                  <span className="text-3xl font-extrabold">{price.main}</span>{" "}
                  <span className="text-sm text-[var(--muted)]">{price.period}</span>
                </p>
                {price.sub && <p className="text-xs text-[var(--muted)] mt-1">{price.sub}</p>}
              </div>

              {founder && (
                <p className="mb-3">
                  <span className="badge badge-yellow">
                    {FOUNDER_COMING_SOON
                      ? lang === "de"
                        ? `🔜 Limitiert auf ${FOUNDER_TOTAL} Stück`
                        : `🔜 Limited to ${FOUNDER_TOTAL} bricks`
                      : founderLeft <= 0
                        ? lang === "de"
                          ? "Ausverkauft"
                          : "Sold out"
                        : lang === "de"
                          ? `Noch ${founderLeft} von ${FOUNDER_TOTAL}`
                          : `${founderLeft} of ${FOUNDER_TOTAL} left`}
                  </span>
                </p>
              )}

              <ul className="flex flex-col gap-2 text-sm mb-6">
                {card.features.map((f, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-[var(--yellow)] shrink-0">✓</span>
                    <span>{f[lang]}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                {isCurrent ? (
                  <button type="button" className="btn w-full opacity-60 cursor-default" disabled>
                    ✓ {lang === "de" ? "Aktueller Plan" : "Current plan"}
                  </button>
                ) : founder && FOUNDER_COMING_SOON ? (
                  <button type="button" className="btn w-full opacity-70 cursor-default" disabled>
                    🔜{" "}
                    {lang === "de"
                      ? "Kommt mit einem der nächsten Updates"
                      : "Coming in one of the next updates"}
                  </button>
                ) : founder && stripeMode && founderLeft <= 0 ? (
                  <button type="button" className="btn w-full opacity-60 cursor-default" disabled>
                    {lang === "de" ? "Ausverkauft" : "Sold out"}
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`w-full ${highlight || founder ? "btn btn-primary" : "btn"}`}
                    disabled={busyPlan !== null}
                    onClick={() => onBuy(card.id)}
                  >
                    {busyPlan === card.id
                      ? lang === "de"
                        ? "Einen Moment ..."
                        : "One moment ..."
                      : card.cta[lang]}
                  </button>
                )}
              </div>
            </div>
          );

          if (founder) {
            return (
              <div
                key={card.id}
                className="rounded-[15px] p-[1.5px] bg-gradient-to-br from-[#f6c700] via-[#7a5f00] to-[#f6c700]"
              >
                {inner}
              </div>
            );
          }
          if (highlight) {
            return (
              <div key={card.id} className="relative">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 badge !bg-[var(--yellow)] !text-[#16130a] !border-[var(--yellow)] shadow-md">
                  ★ {lang === "de" ? "Beliebteste Wahl" : "Most popular"}
                </span>
                {inner}
              </div>
            );
          }
          return <div key={card.id}>{inner}</div>;
        })}
      </div>

      {/* Mini-FAQ */}
      <div className="max-w-2xl mx-auto mt-16">
        <h2 className="text-xl font-extrabold text-center mb-6">
          {lang === "de" ? "Häufige Fragen" : "Frequently asked questions"}
        </h2>
        <div className="flex flex-col gap-3">
          {FAQ.map((item, i) => (
            <details key={i} className="card group">
              <summary className="cursor-pointer list-none p-4 flex items-center justify-between gap-3 font-semibold text-sm">
                {item.q[lang]}
                <span className="text-[var(--muted)] transition-transform group-open:rotate-90">
                  ›
                </span>
              </summary>
              <p className="px-4 pb-4 text-sm text-[var(--muted)]">
                {stripeMode && item.aLive ? item.aLive[lang] : item.a[lang]}
              </p>
            </details>
          ))}
        </div>
      </div>

      {/* Fußnote */}
      <p className="text-center text-xs text-[var(--muted)] mt-10">
        {stripeMode
          ? lang === "de"
            ? `Alle Preise inkl. MwSt. Sichere Zahlung über Stripe. Mit dem Kauf stimmst du dem sofortigen Leistungsbeginn zu - Details zum Widerrufsrecht in den häufigen Fragen.${testMode ? " Test-Modus: Es wird keine echte Karte belastet." : ""}`
            : `All prices incl. VAT. Secure payment via Stripe. By purchasing you agree to immediate provision of the service - see the FAQ for withdrawal details.${testMode ? " Test mode: no real card is charged." : ""}`
          : lang === "de"
            ? "Alle Preise inkl. MwSt. Demo-Modus: Es findet keine echte Zahlung statt - Pläne werden lokal in deinem Browser vorgemerkt."
            : "All prices incl. VAT. Demo mode: no real payment takes place - plans are noted locally in your browser."}
      </p>

      {/* Demo-Checkout-Modal (nur im unkonfigurierten Fallback-Modus) */}
      {!stripeMode && checkout && checkoutCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setCheckout(null)}
        >
          <div
            className="card w-full max-w-md p-6 !bg-[var(--surface)]"
            onClick={(e) => e.stopPropagation()}
          >
            {!activated ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-extrabold text-lg">
                    {lang === "de" ? "Bestellung prüfen" : "Review order"}
                  </h3>
                  <button
                    type="button"
                    className="text-[var(--muted)] hover:text-[var(--text)]"
                    onClick={() => setCheckout(null)}
                    aria-label={lang === "de" ? "Schließen" : "Close"}
                  >
                    ✕
                  </button>
                </div>

                <div className="card !bg-[var(--surface-2)] p-4 mb-4">
                  <p className="flex items-center gap-2 font-bold mb-1">
                    <span>{PLAN_META[checkout].icon}</span>
                    <span style={{ color: PLAN_META[checkout].color }}>
                      {PLAN_META[checkout].name[lang]}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="font-bold">{priceLine(checkoutCard).main}</span>{" "}
                    <span className="text-[var(--muted)]">{priceLine(checkoutCard).period}</span>
                  </p>
                  {priceLine(checkoutCard).sub && (
                    <p className="text-xs text-[var(--muted)] mt-1">{priceLine(checkoutCard).sub}</p>
                  )}
                </div>

                <p className="text-xs text-[var(--muted)] border border-[var(--border)] rounded-lg p-3 mb-5">
                  {lang === "de"
                    ? "Demo-Modus: Die echte Zahlung (Stripe) wird in Phase 2 angeschlossen - dein Plan wird lokal vorgemerkt."
                    : "Demo mode: real payment (Stripe) will be connected in phase 2 - your plan is noted locally."}
                </p>

                <div className="flex gap-3">
                  <button type="button" className="btn flex-1" onClick={() => setCheckout(null)}>
                    {lang === "de" ? "Abbrechen" : "Cancel"}
                  </button>
                  <button type="button" className="btn btn-primary flex-1" onClick={onActivate}>
                    {lang === "de" ? "Plan aktivieren" : "Activate plan"}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-2">
                <p className="text-4xl mb-3">🎉</p>
                <h3 className="font-extrabold text-lg mb-1">
                  {lang === "de" ? "Plan aktiviert!" : "Plan activated!"}
                </h3>
                <p className="text-sm text-[var(--muted)] mb-2">
                  {lang === "de"
                    ? `Du bist jetzt ${PLAN_META[checkout].name.de} (Demo).`
                    : `You are now ${PLAN_META[checkout].name.en} (demo).`}
                </p>
                {checkout === "founder" && founderNo !== null && (
                  <p className="mb-2">
                    <span className="badge badge-yellow">
                      🧱 Founder {formatFounderNumber(founderNo)}
                    </span>
                  </p>
                )}
                <div className="flex gap-3 justify-center mt-4">
                  <button type="button" className="btn" onClick={() => setCheckout(null)}>
                    {lang === "de" ? "Schließen" : "Close"}
                  </button>
                  <Link href="/profil" className="btn btn-primary">
                    {lang === "de" ? "Zum Profil" : "Go to profile"} →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
