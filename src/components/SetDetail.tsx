"use client";

import Link from "next/link";
import { SETS } from "@/data/sets";
import { MINIFIGS } from "@/data/minifigs";
import { pick, useLang, useT } from "@/lib/i18n";
import { formatEUR, growthPercent, investmentScore } from "@/lib/format";
import BrickImage from "./BrickImage";
import PriceChart from "./PriceChart";
import PricePanel, { type PanelMinifig } from "./PricePanel";
import AddToPortfolio from "./AddToPortfolio";
import PriceAlertButton from "./PriceAlertButton";
import MinifigCard from "./MinifigCard";
import { AvailabilityBadge } from "./SetCard";
import SimilarSetsRow, { type SimilarSetItem } from "./SimilarSetsRow";
import { ExternalLinkChips } from "./CatalogSetDetail";

export default function SetDetail({
  setId,
  similar = [],
  catalogFigs,
  catalogFigsTotal,
}: {
  setId: string;
  similar?: SimilarSetItem[];
  /** Vollständige Minifiguren-Liste aus dem Katalog (für das Preis-Panel) */
  catalogFigs?: PanelMinifig[];
  catalogFigsTotal?: number;
}) {
  const { lang } = useLang();
  const t = useT();

  const set = SETS.find((s) => s.id === setId);
  if (!set) return null;

  const growth = growthPercent(set);
  const score = investmentScore(set);
  const figs = MINIFIGS.filter((f) => set.minifigIds.includes(f.id));

  const facts: { label: string; value: string; highlight?: boolean }[] = [
    { label: t("common.release"), value: String(set.year) },
    {
      label: t("common.eol"),
      value: set.eolYear
        ? String(set.eolYear)
        : set.eolPrediction
          ? pick(set.eolPrediction.window, lang)
          : "-",
    },
    { label: t("common.pieces"), value: set.pieces.toLocaleString(lang === "de" ? "de-DE" : "en-GB") },
    { label: t("common.minifigs"), value: String(set.minifigCount) },
    { label: t("common.rrp"), value: formatEUR(set.retailPriceEUR, lang) },
    { label: t("common.valueNew"), value: formatEUR(set.currentValueNewEUR, lang), highlight: true },
    { label: t("common.valueUsed"), value: formatEUR(set.currentValueUsedEUR, lang) },
    { label: t("common.partOut"), value: formatEUR(set.partOutValueEUR, lang) },
  ];

  return (
    <div className="flex flex-col gap-8 pt-8">
      <Link href="/lexikon" className="text-sm text-[var(--muted)] hover:text-[var(--yellow)]">
        ← {t("common.back")}
      </Link>

      {/* Kopf */}
      <div className="card grid md:grid-cols-[320px_1fr]">
        <BrickImage
          src={set.imageUrl}
          alt={pick(set.name, lang)}
          label={set.id}
          className="h-64 md:h-full w-full"
          imgClassName="object-contain p-4"
        />
        <div className="p-6 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-[var(--muted)]">{set.id}</span>
            <AvailabilityBadge availability={set.availability} />
            <span className="badge badge-blue">{t(`cat.${set.category}`)}</span>
            {growth !== null && (
              <span className={`badge ${growth >= 0 ? "badge-green" : "badge-red"}`}>
                {growth >= 0 ? "▲" : "▼"} {Math.abs(growth)}%
              </span>
            )}
          </div>
          <h1 className="text-3xl font-extrabold leading-tight">{pick(set.name, lang)}</h1>
          <p className="text-[var(--muted)]">
            {set.theme}
            {set.subtheme ? ` · ${set.subtheme}` : ""}
          </p>
          <p className="leading-relaxed text-[#c7cede]">{pick(set.description, lang)}</p>

          {/* Externe Referenzen (Katalog-ID mit "-1"-Suffix) */}
          <ExternalLinkChips catalogId={`${set.id}-1`} />

          {/* Investment-Score */}
          <div className="mt-auto pt-3">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-[var(--muted)]">{t("common.investmentScore")}</span>
              <span className="font-bold text-[var(--yellow)]">{score}/100</span>
            </div>
            <div className="h-2.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${score}%`,
                  background: "linear-gradient(90deg,#d01012,#f6c700,#23a45c)",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Steckbrief */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {facts.map((f) => (
          <div key={f.label} className="card p-4">
            <p className="text-xs text-[var(--muted)] mb-1">{f.label}</p>
            <p className={`font-bold ${f.highlight ? "text-[var(--yellow)] text-lg" : ""}`}>
              {f.value}
            </p>
          </div>
        ))}
      </div>

      {/* EOL-Prognose */}
      {set.eolPrediction && (
        <div className="card p-5 border-l-4 !border-l-[var(--yellow)]">
          <p className="font-bold mb-1">
            ⏳ {t("eol.window")}: {pick(set.eolPrediction.window, lang)}
          </p>
          <p className="text-sm text-[var(--muted)]">
            {set.eolPrediction.earliest} → {set.eolPrediction.latest} · {t("eol.confidence")}:{" "}
            {t(`conf.${set.eolPrediction.confidence}`)}
          </p>
          {set.eolPrediction.note && (
            <p className="text-sm mt-2 text-[#c7cede]">{pick(set.eolPrediction.note, lang)}</p>
          )}
        </div>
      )}

      {/* Preis-Chart */}
      <section className="card p-5">
        <h2 className="font-bold text-lg mb-4">📈 {t("common.priceChart")}</h2>
        <PriceChart data={set.priceHistory} />
        <p className="text-xs text-[var(--muted)] mt-3">{t("common.estimates")}</p>
      </section>

      {/* Durchschnittspreise nach Land & Quelle */}
      <PricePanel setId={set.id} figs={catalogFigs} figsTotal={catalogFigsTotal} />

      {/* Portfolio */}
      <AddToPortfolio
        setId={set.id}
        name={pick(set.name, lang)}
        img={set.imageUrl}
      />

      {/* Preisalarm */}
      <PriceAlertButton
        setId={set.id}
        name={pick(set.name, lang)}
        img={set.imageUrl}
      />

      {/* Minifiguren im Set */}
      {figs.length > 0 && (
        <section>
          <h2 className="font-bold text-lg mb-4">👤 {t("common.relatedSets")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {figs.map((fig) => (
              <MinifigCard key={fig.id} fig={fig} />
            ))}
          </div>
        </section>
      )}

      {/* Ähnliche Sets (serverseitig aus dem Katalog ermittelt) */}
      {similar.length > 0 && <SimilarSetsRow sets={similar} />}
    </div>
  );
}
