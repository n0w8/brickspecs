"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang, useT } from "@/lib/i18n";
import { formatEUR } from "@/lib/format";
import { buyLinks, COUNTRY_KEY } from "@/lib/buy-links";

/** Kompakte Minifiguren-Chips im Preis-Panel (zwischen Preisen und Kauf-Links). */
export interface PanelMinifig {
  id: string;
  name: string;
  img: string;
}

// Muss mit src/lib/prices.ts übereinstimmen (Client darf das Server-Modul nicht importieren).
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

interface PriceData {
  avgNewEUR: number | null;
  avgUsedEUR: number | null;
  samplesNew: number;
  samplesUsed: number;
  partOutNewEUR?: number | null;
  partOutUsedEUR?: number | null;
  mode: "live" | "demo";
  note?: string;
}

const SOURCE_KEY = "bricktopia.priceSource";

export default function PricePanel({
  setId,
  figs,
  figsTotal,
}: {
  setId: string;
  figs?: PanelMinifig[];
  figsTotal?: number;
}) {
  const { lang } = useLang();
  const t = useT();

  const [country, setCountry] = useState("DE");
  const [source, setSource] = useState<"bricklink" | "ebay-sold">("bricklink");
  const [data, setData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const c = window.localStorage.getItem(COUNTRY_KEY);
    if (c && COUNTRIES.some((x) => x.code === c)) setCountry(c);
    const s = window.localStorage.getItem(SOURCE_KEY);
    if (s === "ebay-sold") setSource(s);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/prices/${encodeURIComponent(setId)}?source=${source}&country=${country}`)
      .then((r) => r.json())
      .then((json: PriceData) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [setId, source, country]);

  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-bold text-lg">💶 {t("price.title")}</h2>
        {data && (
          <span className={`badge ${data.mode === "live" ? "badge-green" : "badge-gray"}`}>
            {data.mode === "live" ? t("price.liveBadge") : t("price.demoBadge")}
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 mb-5">
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          {t("price.country")}
          <select
            className="input"
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              window.localStorage.setItem(COUNTRY_KEY, e.target.value);
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
              window.localStorage.setItem(SOURCE_KEY, v);
            }}
          >
            <option value="bricklink">{t("price.bricklink")}</option>
            <option value="ebay-sold">{t("price.ebay")}</option>
          </select>
        </label>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--muted)]">{t("price.loading")}</p>
      ) : !data ||
        (data.avgNewEUR === null &&
          data.avgUsedEUR === null &&
          data.partOutNewEUR == null &&
          data.partOutUsedEUR == null) ? (
        <p className="text-sm text-[var(--muted)]">{t("price.none")}</p>
      ) : data.mode === "demo" ? (
        // Ehrlicher Platzhalter statt irrefuehrender Zufallszahlen: solange
        // die BrickLink-Anbindung nicht aktiv ist, zeigen wir bewusst KEINE
        // konkreten Preise (jeder Sammler wuerde falsche Werte sofort erkennen).
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { label: t("price.new"), yellow: true },
            { label: t("price.used"), yellow: false },
          ].map((slot) => (
            <div key={slot.label} className="card !bg-[var(--surface-2)] p-4">
              <p className="text-xs text-[var(--muted)] mb-1">{slot.label}</p>
              <p className={`text-2xl font-extrabold ${slot.yellow ? "text-[var(--yellow)]" : ""}`}>
                --
              </p>
              <p className="text-xs text-[var(--muted)] mt-1">
                {lang === "de" ? "echte Marktdaten folgen" : "real market data coming"}
              </p>
            </div>
          ))}
          <p className="sm:col-span-2 text-xs text-[var(--muted)] leading-relaxed">
            {lang === "de"
              ? "Neu/versiegelte und gebrauchte Durchschnittspreise (6-Monats-Schnitt) werden direkt aus BrickLink geladen, sobald die Anbindung aktiv ist. Bis dahin zeigen wir hier bewusst keine Schaetzwerte."
              : "Average prices for new/sealed and used (6-month average) load directly from BrickLink once the connection is active. Until then we deliberately show no estimated values here."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="card !bg-[var(--surface-2)] p-4">
              <p className="text-xs text-[var(--muted)] mb-1">{t("price.new")}</p>
              <p className="text-2xl font-extrabold text-[var(--yellow)]">
                {formatEUR(data.avgNewEUR, lang)}
              </p>
              <p className="text-xs text-[var(--muted)] mt-1">
                {data.samplesNew} {t("price.samples")}
              </p>
            </div>
            <div className="card !bg-[var(--surface-2)] p-4">
              <p className="text-xs text-[var(--muted)] mb-1">{t("price.used")}</p>
              <p className="text-2xl font-extrabold">{formatEUR(data.avgUsedEUR, lang)}</p>
              <p className="text-xs text-[var(--muted)] mt-1">
                {data.samplesUsed} {t("price.samples")}
              </p>
            </div>
          </div>

          {/* Teilewert (Part-Out): dezent unter den Neu/Gebraucht-Karten,
              nur wenn der Sync ihn berechnet hat. */}
          {(data.partOutNewEUR != null || data.partOutUsedEUR != null) && (
            <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
              <p className="text-xs font-semibold mb-1.5">
                🧩 {lang === "de" ? "Teilewert (Part-Out)" : "Part value (part-out)"}
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                {data.partOutNewEUR != null && (
                  <span>
                    <span className="text-[var(--muted)]">{t("price.new")}: </span>
                    <span className="font-bold">{formatEUR(data.partOutNewEUR, lang)}</span>
                  </span>
                )}
                {data.partOutUsedEUR != null && (
                  <span>
                    <span className="text-[var(--muted)]">{t("price.used")}: </span>
                    <span className="font-bold">{formatEUR(data.partOutUsedEUR, lang)}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">
                {lang === "de"
                  ? "Summe der Einzelteil-Preise (aktuelle BrickLink-Angebote)"
                  : "Sum of individual part prices (current BrickLink listings)"}
              </p>
            </div>
          )}
        </>
      )}

      {/* Minifiguren im Set */}
      {figs && figs.length > 0 && (
        <div className="mt-5 pt-4 border-t border-[var(--border)]">
          <p className="text-sm font-semibold mb-2">
            👤{" "}
            {lang === "de"
              ? `Minifiguren im Set (${figsTotal ?? figs.length})`
              : `Minifigs in this set (${figsTotal ?? figs.length})`}
          </p>
          <div className="flex flex-wrap gap-2">
            {figs.map((f) => (
              <Link
                key={f.id}
                href={`/minifiguren/${encodeURIComponent(f.id)}`}
                className="chip flex items-center gap-1.5 !py-1 hover:!border-[var(--yellow)]"
                title={f.name}
              >
                {f.img ? (
                  // eslint-disable-next-line @next/next/no-img-element -- kleine CDN-Thumbnails
                  <img
                    src={f.img}
                    alt={f.name}
                    className="h-14 w-14 rounded-lg object-contain bg-white/90"
                    loading="lazy"
                  />
                ) : null}
                <span className="font-mono text-xs">{f.id}</span>
              </Link>
            ))}
            {(figsTotal ?? 0) > figs.length && (
              <span className="badge badge-gray">+{(figsTotal ?? 0) - figs.length}</span>
            )}
          </div>
        </div>
      )}

      {/* Kaufen bei … */}
      <div className="mt-5 pt-4 border-t border-[var(--border)]">
        <p className="text-sm font-semibold mb-2">🛒 {t("buy.title")}</p>
        <div className="flex flex-wrap gap-2">
          {buyLinks(setId, country).map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel={link.affiliate ? "noopener noreferrer sponsored" : "noopener noreferrer"}
              className="chip hover:!border-[var(--yellow)]"
            >
              {link.label}
              {link.affiliate ? "*" : ""} ↗
            </a>
          ))}
        </div>
        <p className="text-xs text-[var(--muted)] mt-2">
          {t("buy.hint")}{" "}
          {lang === "de" ? "*Affiliate-Link" : "*Affiliate link"}
        </p>
      </div>

      <p className="text-xs text-[var(--muted)] mt-4">
        {data?.note ?? (data?.mode === "demo" ? t("price.demoNote") : null)}
      </p>
    </section>
  );
}
