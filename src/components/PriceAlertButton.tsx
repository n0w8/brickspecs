"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang, useT } from "@/lib/i18n";
import { formatEUR } from "@/lib/format";
import { isAuthenticated } from "@/lib/auth";
import {
  addAlert,
  getAlerts,
  removeAlert,
  type AlertCondition,
  type AlertItem,
} from "@/lib/alerts";

export default function PriceAlertButton({
  setId,
  name,
  img,
}: {
  setId: string;
  name: string;
  img?: string;
}) {
  const { lang } = useLang();
  const t = useT();

  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [alert, setAlert] = useState<AlertItem | null>(null);
  const [open, setOpen] = useState(false);

  const [target, setTarget] = useState("");
  const [condition, setCondition] = useState<AlertCondition>("new");
  const [toast, setToast] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [li, alerts] = await Promise.all([isAuthenticated(), getAlerts()]);
      if (cancelled) return;
      setLoggedIn(li);
      setAlert(alerts.find((a) => a.setId === setId) ?? null);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [setId]);

  if (!ready) return null;

  if (!loggedIn) {
    return (
      <section className="card p-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--muted)]">
          {lang === "de"
            ? "Melde dich an, um einen Preisalarm für dieses Set zu setzen."
            : "Log in to set a price alert for this set."}
        </p>
        <div className="flex gap-2">
          <Link href="/login" className="btn">
            {t("auth.loginTitle")}
          </Link>
          <Link href="/registrieren" className="btn btn-primary">
            {t("auth.registerTitle")}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-bold text-lg">
          🔔 {lang === "de" ? "Preisalarm" : "Price alert"}
        </h2>
        {alert ? (
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/preisalarm" className="badge badge-green">
              🔔{" "}
              {lang === "de"
                ? `Alarm aktiv bei ${formatEUR(alert.targetEUR, lang)}`
                : `Alert active at ${formatEUR(alert.targetEUR, lang)}`}
            </Link>
            <button
              className="text-xs text-[var(--muted)] hover:text-[#ff6b6c]"
              onClick={() => {
                void removeAlert(alert.alertId);
                setAlert(null);
              }}
            >
              🗑 {lang === "de" ? "Entfernen" : "Remove"}
            </button>
          </div>
        ) : (
          <button className="btn btn-primary" onClick={() => setOpen((o) => !o)}>
            🔔 {lang === "de" ? "Preisalarm setzen" : "Set price alert"}
          </button>
        )}
      </div>

      {open && !alert && (
        <form
          className="grid gap-3 sm:grid-cols-3 mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            const value = Number(target.replace(",", "."));
            if (!Number.isFinite(value) || value <= 0) return;
            void addAlert({ setId, name, img, targetEUR: value, condition }).then(
              (next) => {
                setAlert(next.find((a) => a.setId === setId) ?? null);
                setOpen(false);
                setToast(true);
                setTimeout(() => setToast(false), 2500);
              }
            );
          }}
        >
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            {lang === "de" ? "Wunschpreis (€)" : "Target price (€)"}
            <input
              className="input"
              type="text"
              inputMode="decimal"
              required
              placeholder={lang === "de" ? "z. B. 149,99" : "e.g. 149.99"}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            {lang === "de" ? "Zustand" : "Condition"}
            <select
              className="input"
              value={condition}
              onChange={(e) => setCondition(e.target.value as AlertCondition)}
            >
              <option value="new">{t("price.new")}</option>
              <option value="used">{t("price.used")}</option>
            </select>
          </label>
          <div className="flex items-end">
            <button type="submit" className="btn btn-primary w-full">
              {lang === "de" ? "Alarm speichern" : "Save alert"}
            </button>
          </div>
        </form>
      )}

      {toast && (
        <p className="text-sm text-[#4cd587] mt-3">
          ✓{" "}
          {lang === "de"
            ? "Preisalarm gespeichert - Übersicht unter „Preisalarm“."
            : "Price alert saved - see the price alert overview."}
        </p>
      )}
    </section>
  );
}
