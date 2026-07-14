"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang, useT } from "@/lib/i18n";
import { isAuthenticated } from "@/lib/auth";
import { addItem, isInPortfolio, isLimitReached, type Condition } from "@/lib/portfolio";

export default function AddToPortfolio({
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
  const [already, setAlready] = useState(false);
  const [open, setOpen] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState<Condition>("new");
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [toast, setToast] = useState(false);
  const [limitHit, setLimitHit] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [li, inPf] = await Promise.all([isAuthenticated(), isInPortfolio(setId)]);
      if (cancelled) return;
      setLoggedIn(li);
      setAlready(inPf);
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
            ? "Melde dich an, um dieses Set in dein Portfolio aufzunehmen."
            : "Log in to add this set to your portfolio."}
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
        <h2 className="font-bold text-lg">📁 {t("nav.portfolio")}</h2>
        {already ? (
          <Link href="/portfolio" className="badge badge-green">
            ✓ {t("pf.inPortfolio")}
          </Link>
        ) : (
          <button className="btn btn-primary" onClick={() => setOpen((o) => !o)}>
            + {t("pf.add")}
          </button>
        )}
      </div>

      {open && !already && (
        <form
          className="grid gap-3 sm:grid-cols-4 mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            void addItem({
              setId,
              name,
              img,
              quantity,
              condition,
              purchasePriceEUR: price.trim() ? Number(price.replace(",", ".")) : null,
              note: note.trim() || undefined,
            }).then((result) => {
              if (isLimitReached(result)) {
                setLimitHit(true);
                setOpen(false);
                return;
              }
              setAlready(true);
              setOpen(false);
              setToast(true);
              setTimeout(() => setToast(false), 2500);
            });
          }}
        >
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            {t("pf.quantity")}
            <input
              className="input"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            {t("pf.condition")}
            <select
              className="input"
              value={condition}
              onChange={(e) => setCondition(e.target.value as Condition)}
            >
              <option value="new">{t("price.new")}</option>
              <option value="used">{t("price.used")}</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            {t("pf.purchasePrice")}
            <input
              className="input"
              type="text"
              inputMode="decimal"
              placeholder={`€ (${t("pf.optional")})`}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </label>
          <div className="flex items-end">
            <button type="submit" className="btn btn-primary w-full">
              {t("pf.save")}
            </button>
          </div>
        </form>
      )}

      {toast && (
        <p className="text-sm text-[#4cd587] mt-3">✓ {t("pf.addedToast")}</p>
      )}

      {limitHit && (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-[var(--yellow)] rounded-lg p-3 mt-3">
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
    </section>
  );
}
