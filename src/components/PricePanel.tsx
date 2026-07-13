"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang, useT } from "@/lib/i18n";
import { formatEUR } from "@/lib/format";
import { withAmazonTag } from "@/lib/config";

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
  mode: "live" | "demo";
  note?: string;
}

const COUNTRY_KEY = "bricktopia.country";
const SOURCE_KEY = "bricktopia.priceSource";

/* Länderabhängige Shop-Links (Suche/Katalogseite beim Händler) */
const LEGO_LOCALE: Record<string, string> = {
  DE: "de-de", AT: "de-at", CH: "de-ch", US: "en-us", GB: "en-gb",
  FR: "fr-fr", NL: "nl-nl", IT: "it-it", ES: "es-es", PL: "pl-pl",
};
const AMAZON_TLD: Record<string, string> = {
  DE: "de", AT: "de", CH: "de", US: "com", GB: "co.uk",
  FR: "fr", NL: "nl", IT: "it", ES: "es", PL: "pl",
};
const EBAY_TLD: Record<string, string> = {
  DE: "de", AT: "at", CH: "ch", US: "com", GB: "co.uk",
  FR: "fr", NL: "nl", IT: "it", ES: "es", PL: "pl",
};

function buyLinks(setId: string, country: string): { label: string; href: string }[] {
  const base = setId.replace(/-\d+$/, "");
  const q = encodeURIComponent(`LEGO ${base}`);
  const blId = setId.includes("-") ? setId : `${setId}-1`;
  const links = [
    {
      label: "LEGO.com",
      href: `https://www.lego.com/${LEGO_LOCALE[country] ?? "de-de"}/search?q=${base}`,
    },
    {
      label: "Amazon",
      href: withAmazonTag(`https://www.amazon.${AMAZON_TLD[country] ?? "de"}/s?k=${q}`),
    },
    {
      label: "eBay",
      href: `https://www.ebay.${EBAY_TLD[country] ?? "de"}/sch/i.html?_nkw=${q}`,
    },
    {
      label: "BrickLink",
      href: `https://www.bricklink.com/v2/catalog/catalogitem.page?S=${encodeURIComponent(blId)}`,
    },
  ];
  if (country === "DE" || country === "AT") {
    links.push({
      label: "idealo",
      href: `https://www.idealo.${country === "AT" ? "at" : "de"}/preisvergleich/MainSearchProductCategory.html?q=${q}`,
    });
  }
  return links;
}

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
      ) : !data || (data.avgNewEUR === null && data.avgUsedEUR === null) ? (
        <p className="text-sm text-[var(--muted)]">{t("price.none")}</p>
      ) : (
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
              rel="noopener noreferrer"
              className="chip hover:!border-[var(--yellow)]"
            >
              {link.label} ↗
            </a>
          ))}
        </div>
        <p className="text-xs text-[var(--muted)] mt-2">{t("buy.hint")}</p>
      </div>

      <p className="text-xs text-[var(--muted)] mt-4">
        {data?.note ?? (data?.mode === "demo" ? t("price.demoNote") : null)}
      </p>
    </section>
  );
}
