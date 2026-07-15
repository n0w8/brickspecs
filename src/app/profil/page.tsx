"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLang, useT } from "@/lib/i18n";
import {
  getAuthUser,
  getProfile,
  setBricklinkStore,
  signOutUser,
  type AuthUser,
  type Profile,
} from "@/lib/auth";
import { getPortfolio } from "@/lib/portfolio";
import { getWishlist } from "@/lib/wishlist";
import { getAlerts } from "@/lib/alerts";
import { openBillingPortal } from "@/lib/paywall";
import { PLAN_META, formatFounderNumber, getPlanRecord, type Plan, type PlanRecord } from "@/lib/plan";
import { formatEUR } from "@/lib/format";

/** Antwort von GET /api/referral/me (siehe Route fuer Details). */
interface ReferralStats {
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

/** Quelle einer Gutschrift lesbar machen. */
function referralSourceLabel(source: string, de: boolean): string {
  if (source === "founder_purchase") return de ? "Founder-Kauf" : "Founder purchase";
  if (source === "subscription_payment") return de ? "Abo-Zahlung" : "Subscription payment";
  return source;
}

export default function ProfilePage() {
  const { lang } = useLang();
  const t = useT();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checked, setChecked] = useState(false);
  const [store, setStore] = useState("");
  const [saved, setSaved] = useState(false);
  const [pfStats, setPfStats] = useState<{ items: number; units: number; invested: number }>({
    items: 0,
    units: 0,
    invested: 0,
  });
  const [alertCount, setAlertCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [planRec, setPlanRec] = useState<PlanRecord | null>(null);
  // Nach der Rückkehr vom Stripe-Checkout (?checkout=success) Banner zeigen.
  // Lazy-Initializer: bis "checked" true ist, rendert die Seite ohnehin null,
  // daher kein Hydration-Konflikt mit dem Server-HTML.
  const [checkoutSuccess] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("checkout") === "success"
  );
  const [portalBusy, setPortalBusy] = useState(false);
  const [portalError, setPortalError] = useState(false);
  const [referral, setReferral] = useState<ReferralStats | null>(null);
  const [refCopied, setRefCopied] = useState(false);

  // Der Plan wird per Stripe-Webhook gesetzt - solange er nach dem Checkout
  // noch auf "free" steht, das Profil alle 5 Sekunden neu laden (max. 1 Minute).
  useEffect(() => {
    if (!checkoutSuccess || !user || user.source !== "supabase") return;
    if (profile && profile.plan !== "free") return;
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (attempts > 12) {
        window.clearInterval(timer);
        return;
      }
      void getProfile().then((p) => {
        if (p && p.plan !== "free") {
          setProfile(p);
          window.clearInterval(timer);
        }
      });
    }, 5000);
    return () => window.clearInterval(timer);
  }, [checkoutSuccess, user, profile]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const u = await getAuthUser();
      if (cancelled) return;
      setUser(u);
      setStore(u?.bricklinkStore ?? "");
      if (u) {
        const [pf, alerts, wl, prof] = await Promise.all([
          getPortfolio(),
          getAlerts(),
          u.source === "supabase" ? getWishlist() : Promise.resolve([]),
          u.source === "supabase" ? getProfile() : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setPfStats({
          items: pf.length,
          units: pf.reduce((s, i) => s + i.quantity, 0),
          invested: pf.reduce((s, i) => s + (i.purchasePriceEUR ?? 0) * i.quantity, 0),
        });
        setAlertCount(alerts.length);
        setWishlistCount(wl.length);
        if (u.source === "supabase") {
          setProfile(prof);
          // Referral-Kennzahlen laden - Fehler still ignorieren (Sektion
          // zeigt dann nur den Link, keine Zahlen).
          void fetch("/api/referral/me")
            .then((r) => (r.ok ? (r.json() as Promise<ReferralStats>) : null))
            .then((stats) => {
              if (!cancelled && stats) setReferral(stats);
            })
            .catch(() => {});
        } else {
          setPlanRec(getPlanRecord());
        }
      }
      setChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!checked) return null;

  if (!user) {
    return (
      <div className="max-w-md mx-auto pt-14 text-center card p-10">
        <p className="text-4xl mb-3">🔒</p>
        <p className="mb-5 text-[var(--muted)]">
          {lang === "de"
            ? "Du bist nicht angemeldet."
            : "You are not logged in."}
        </p>
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

  const isCloud = user.source === "supabase";
  const plan: Plan = isCloud ? (profile?.plan ?? "free") : (planRec?.plan ?? "free");
  const founderNumber = isCloud
    ? (profile?.founderNumber ?? undefined)
    : planRec?.plan === "founder"
      ? planRec.founderNumber
      : undefined;

  return (
    <div className="max-w-2xl mx-auto pt-14 flex flex-col gap-6">
      {/* Erfolgs-Banner nach dem Stripe-Checkout */}
      {checkoutSuccess && (
        <div className="card !border-[#4cd587] p-5">
          {plan !== "free" ? (
            <p className="text-sm">
              <span className="font-bold text-[#4cd587]">
                🎉 {lang === "de"
                  ? `Willkommen im ${PLAN_META[plan].name.de}-Plan!`
                  : `Welcome to the ${PLAN_META[plan].name.en} plan!`}
              </span>{" "}
              {lang === "de"
                ? "Deine Zahlung ist eingegangen - viel Spaß mit allen Features."
                : "Your payment was received - enjoy all the features."}
            </p>
          ) : (
            <p className="text-sm">
              <span className="font-bold text-[#4cd587]">
                ✓ {lang === "de" ? "Zahlung erfolgreich!" : "Payment successful!"}
              </span>{" "}
              {lang === "de"
                ? "Dein Plan wird gerade freigeschaltet - das kann bis zu einer Minute dauern. Die Seite aktualisiert sich automatisch."
                : "Your plan is being activated - this can take up to a minute. The page refreshes automatically."}
            </p>
          )}
        </div>
      )}

      <div className="card p-8">
        <div className="flex items-center gap-4 mb-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--yellow)] text-2xl">
            👤
          </span>
          <div>
            <h1 className="text-2xl font-extrabold">{user.username}</h1>
            <p className="text-sm text-[var(--muted)]">{user.email}</p>
          </div>
          <button
            className="btn ml-auto"
            onClick={() => {
              void signOutUser().then(() => router.push("/"));
            }}
          >
            {t("profile.logout")}
          </button>
        </div>
        <p className="text-xs text-[var(--muted)]">
          {isCloud ? t("auth.cloudNote") : t("auth.demoNote")}
        </p>
      </div>

      {/* Portfolio-Übersicht */}
      <div className="card p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="font-bold text-lg">📁 {t("pf.title")}</h2>
          <Link href="/portfolio" className="btn btn-primary !py-1.5 !px-4 text-sm">
            {t("pf.title")} →
          </Link>
        </div>
        {pfStats.items === 0 ? (
          <p className="text-sm text-[var(--muted)]">{t("pf.empty")}</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <div className="card !bg-[var(--surface-2)] p-3">
              <p className="text-xs text-[var(--muted)] mb-1">{t("pf.items")}</p>
              <p className="font-bold">{pfStats.items}</p>
            </div>
            <div className="card !bg-[var(--surface-2)] p-3">
              <p className="text-xs text-[var(--muted)] mb-1">{t("pf.units")}</p>
              <p className="font-bold">{pfStats.units}</p>
            </div>
            <div className="card !bg-[var(--surface-2)] p-3">
              <p className="text-xs text-[var(--muted)] mb-1">{t("pf.invested")}</p>
              <p className="font-bold text-[var(--yellow)]">
                {pfStats.invested > 0 ? formatEUR(pfStats.invested, lang) : "-"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Wunschliste (nur echte Konten - konto-gebunden) */}
      {isCloud && (
        <div className="card p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="font-bold text-lg">
              ❤️ {lang === "de" ? "Wunschliste" : "Wishlist"}
            </h2>
            <Link href="/wishlist" className="btn btn-primary !py-1.5 !px-4 text-sm">
              {lang === "de" ? "Wunschliste" : "Wishlist"} →
            </Link>
          </div>
          <p className="text-sm text-[var(--muted)]">
            {wishlistCount === 0
              ? lang === "de"
                ? "Noch keine Sets gemerkt - tippe bei einem Set auf das Herz."
                : "No sets saved yet - tap the heart on any set."
              : lang === "de"
                ? `${wishlistCount} ${wishlistCount === 1 ? "Set gemerkt" : "Sets gemerkt"}`
                : `${wishlistCount} ${wishlistCount === 1 ? "set saved" : "sets saved"}`}
          </p>
        </div>
      )}

      {/* Preisalarme */}
      <div className="card p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="font-bold text-lg">
            🔔 {lang === "de" ? "Preisalarme" : "Price alerts"}
          </h2>
          <Link href="/preisalarm" className="btn btn-primary !py-1.5 !px-4 text-sm">
            {lang === "de" ? "Preisalarme" : "Price alerts"} →
          </Link>
        </div>
        <p className="text-sm text-[var(--muted)]">
          {alertCount === 0
            ? lang === "de"
              ? "Noch keine Preisalarme gesetzt."
              : "No price alerts set yet."
            : lang === "de"
              ? `${alertCount} ${alertCount === 1 ? "aktiver Alarm" : "aktive Alarme"}`
              : `${alertCount} active ${alertCount === 1 ? "alert" : "alerts"}`}
        </p>
      </div>

      {/* Mitgliedschaft */}
      <div className="card p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="font-bold text-lg">
            💎 {lang === "de" ? "Mitgliedschaft" : "Membership"}
          </h2>
          <Link href="/preise" className="btn btn-primary !py-1.5 !px-4 text-sm">
            {lang === "de" ? "Pläne ansehen" : "View plans"} →
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(() => {
            const meta = PLAN_META[plan];
            return (
              <span
                className="badge"
                style={{
                  color: meta.color,
                  borderColor: meta.color,
                  background: "rgba(255, 255, 255, 0.04)",
                }}
              >
                {meta.icon} {meta.name[lang]}
              </span>
            );
          })()}
          {plan === "founder" && founderNumber !== undefined && founderNumber !== null && (
            <span className="badge badge-yellow">
              Founder {formatFounderNumber(founderNumber)}
            </span>
          )}
        </div>
        {/* Abo verwalten (Stripe-Billing-Portal) - nur für laufende Abos */}
        {isCloud && (plan === "sammler" || plan === "investor") && (
          <div className="mt-4">
            <button
              type="button"
              className="btn"
              disabled={portalBusy}
              onClick={() => {
                setPortalError(false);
                setPortalBusy(true);
                void openBillingPortal().then((err) => {
                  if (err) {
                    setPortalBusy(false);
                    setPortalError(true);
                  }
                });
              }}
            >
              {portalBusy
                ? lang === "de"
                  ? "Einen Moment ..."
                  : "One moment ..."
                : lang === "de"
                  ? "Abo verwalten"
                  : "Manage subscription"}
            </button>
            {portalError && (
              <p className="text-xs text-[#ff6b6c] mt-2">
                {lang === "de"
                  ? "Das Abo-Portal ist gerade nicht erreichbar - bitte versuch es später noch einmal."
                  : "The billing portal is not available right now - please try again later."}
              </p>
            )}
          </div>
        )}
        <p className="text-xs text-[var(--muted)] mt-3">
          {plan === "free"
            ? lang === "de"
              ? "Free-Plan: 5 Portfolio-Sets und 3 Preisalarme inklusive."
              : "Free plan: 5 portfolio sets and 3 price alerts included."
            : isCloud
              ? lang === "de"
                ? "Dein Plan ist mit deinem Konto verknüpft."
                : "Your plan is linked to your account."
              : lang === "de"
                ? "Demo-Modus: Dein Plan ist lokal vorgemerkt, die echte Zahlung folgt in Phase 2."
                : "Demo mode: your plan is noted locally, real payment arrives in phase 2."}
        </p>
      </div>

      {/* Freunde werben - 25% verdienen */}
      {isCloud && profile?.referralCode && (
        <div className="card p-8">
          <h2 className="font-bold text-lg mb-1">
            🤝 {lang === "de" ? "Freunde werben - 25% verdienen" : "Refer friends - earn 25%"}
          </h2>
          <p className="text-sm text-[var(--muted)] mb-4">
            {lang === "de"
              ? "Teile deinen Link: Du bekommst 25% Provision auf jede Zahlung deiner geworbenen Nutzer - dauerhaft."
              : "Share your link: you earn 25% commission on every payment from users you refer - permanently."}
          </p>

          {/* Ref-Link mit Kopier-Button */}
          <div className="flex flex-wrap gap-3 mb-5">
            <input
              className="input flex-1 min-w-[220px] font-mono text-sm"
              readOnly
              value={`https://brickspecs.com/?ref=${profile.referralCode}`}
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              type="button"
              className="btn btn-primary shrink-0"
              onClick={() => {
                void navigator.clipboard
                  .writeText(`https://brickspecs.com/?ref=${profile.referralCode}`)
                  .then(() => {
                    setRefCopied(true);
                    setTimeout(() => setRefCopied(false), 2500);
                  })
                  .catch(() => {});
              }}
            >
              {refCopied
                ? `✓ ${lang === "de" ? "Kopiert" : "Copied"}`
                : lang === "de"
                  ? "Link kopieren"
                  : "Copy link"}
            </button>
          </div>

          {/* Kennzahlen */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="card !bg-[var(--surface-2)] p-3">
              <p className="text-xs text-[var(--muted)] mb-1">
                {lang === "de" ? "Geworben" : "Referred"}
              </p>
              <p className="font-bold">{referral ? referral.referredTotal : "-"}</p>
            </div>
            <div className="card !bg-[var(--surface-2)] p-3">
              <p className="text-xs text-[var(--muted)] mb-1">
                {lang === "de" ? "Zahlend" : "Paying"}
              </p>
              <p className="font-bold">{referral ? referral.referredPaying : "-"}</p>
            </div>
            <div className="card !bg-[var(--surface-2)] p-3">
              <p className="text-xs text-[var(--muted)] mb-1">
                {lang === "de" ? "Offenes Guthaben" : "Pending balance"}
              </p>
              <p className="font-bold text-[var(--yellow)]">
                {referral ? formatEUR(referral.pendingEur, lang) : "-"}
              </p>
            </div>
            <div className="card !bg-[var(--surface-2)] p-3">
              <p className="text-xs text-[var(--muted)] mb-1">
                {lang === "de" ? "Ausgezahlt" : "Paid out"}
              </p>
              <p className="font-bold text-[#4cd587]">
                {referral ? formatEUR(referral.paidEur, lang) : "-"}
              </p>
            </div>
          </div>

          {/* Gutschriften-Liste */}
          {referral && referral.recent.length > 0 ? (
            <div className="mb-4">
              <p className="text-xs text-[var(--muted)] mb-2">
                {lang === "de" ? "Letzte Gutschriften" : "Recent credits"}
              </p>
              <div className="flex flex-col gap-2">
                {referral.recent.map((entry, i) => (
                  <div
                    key={entry.createdAt + i}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm border-b border-[var(--border)] last:border-0 pb-2 last:pb-0"
                  >
                    <span className="text-[var(--muted)] text-xs w-24 shrink-0">
                      {new Date(entry.createdAt).toLocaleDateString(
                        lang === "de" ? "de-DE" : "en-GB"
                      )}
                    </span>
                    <span className="font-bold">{formatEUR(entry.amountEur, lang)}</span>
                    <span className="text-[var(--muted)]">
                      {referralSourceLabel(entry.source, lang === "de")}
                    </span>
                    <span
                      className={`badge ml-auto ${entry.status === "paid" ? "badge-green" : "badge-yellow"}`}
                    >
                      {entry.status === "paid"
                        ? lang === "de"
                          ? "Ausgezahlt"
                          : "Paid"
                        : lang === "de"
                          ? "Offen"
                          : "Pending"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--muted)] mb-4">
              {lang === "de"
                ? "Noch keine Gutschriften - teile deinen Link und verdiene mit."
                : "No credits yet - share your link and start earning."}
            </p>
          )}

          <p className="text-xs text-[var(--muted)]">
            {lang === "de" ? (
              <>
                Auszahlung ab 25 Euro per PayPal - schreib uns über{" "}
                <Link href="/feedback" className="text-[var(--yellow)] hover:underline">
                  /feedback
                </Link>
                . Guthaben-Verrechnung mit dem eigenen Abo kommt in Kürze.
              </>
            ) : (
              <>
                Payout from 25 euros via PayPal - contact us via{" "}
                <Link href="/feedback" className="text-[var(--yellow)] hover:underline">
                  /feedback
                </Link>
                . Balance credit towards your own subscription is coming soon.
              </>
            )}
          </p>
        </div>
      )}

      <div className="card p-8">
        <h2 className="font-bold text-lg mb-1">🧩 {t("profile.bricklink")}</h2>
        <p className="text-sm text-[var(--muted)] mb-4">{t("profile.bricklinkSub")}</p>
        <form
          className="flex gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const next = setBricklinkStore(user, store);
            setUser(next);
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
          }}
        >
          <input
            className="input"
            value={store}
            onChange={(e) => setStore(e.target.value)}
            placeholder={lang === "de" ? "Dein BrickLink-Store-Name" : "Your BrickLink store name"}
          />
          <button type="submit" className="btn btn-primary shrink-0">
            {lang === "de" ? "Speichern" : "Save"}
          </button>
        </form>
        {saved && (
          <p className="text-sm text-[#4cd587] mt-3">
            ✓ {lang === "de" ? "Gespeichert" : "Saved"}
          </p>
        )}
        {user.bricklinkStore && !saved && (
          <p className="text-sm text-[var(--muted)] mt-3">
            {lang === "de" ? "Verknüpft mit: " : "Linked to: "}
            <span className="badge badge-blue">{user.bricklinkStore}</span>
          </p>
        )}
      </div>
    </div>
  );
}
