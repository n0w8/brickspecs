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
import { getAlerts } from "@/lib/alerts";
import { openBillingPortal } from "@/lib/paywall";
import { PLAN_META, formatFounderNumber, getPlanRecord, type Plan, type PlanRecord } from "@/lib/plan";
import { formatEUR } from "@/lib/format";

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
        const [pf, alerts, prof] = await Promise.all([
          getPortfolio(),
          getAlerts(),
          u.source === "supabase" ? getProfile() : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setPfStats({
          items: pf.length,
          units: pf.reduce((s, i) => s + i.quantity, 0),
          invested: pf.reduce((s, i) => s + (i.purchasePriceEUR ?? 0) * i.quantity, 0),
        });
        setAlertCount(alerts.length);
        if (u.source === "supabase") {
          setProfile(prof);
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
        {isCloud && profile?.referralCode && (
          <div className="mt-4">
            <p className="text-xs text-[var(--muted)] mb-1">
              {lang === "de"
                ? "Dein Referral-Code (Freunde werben folgt bald)"
                : "Your referral code (refer a friend coming soon)"}
            </p>
            <span className="badge badge-blue font-mono uppercase">
              {profile.referralCode}
            </span>
          </div>
        )}
      </div>

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
