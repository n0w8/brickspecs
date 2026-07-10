"use client";

import Link from "next/link";
import { SETS } from "@/data/sets";
import { pick, useLang, useT } from "@/lib/i18n";
import { formatEUR } from "@/lib/format";
import BrickImage from "@/components/BrickImage";
import { AvailabilityBadge } from "@/components/SetCard";

export default function EolRadarPage() {
  const { lang } = useLang();
  const t = useT();

  const tracked = SETS.filter(
    (s) =>
      (s.availability === "available" || s.availability === "retiring-soon") &&
      s.eolPrediction
  ).sort((a, b) =>
    (a.eolPrediction?.earliest ?? "9999").localeCompare(b.eolPrediction?.earliest ?? "9999")
  );

  return (
    <div className="flex flex-col gap-6 pt-8">
      <div>
        <h1 className="text-3xl font-extrabold mb-1">⏳ {t("eol.title")}</h1>
        <p className="text-[var(--muted)] max-w-2xl">{t("eol.sub")}</p>
      </div>

      <div className="flex flex-col gap-4">
        {tracked.map((set) => {
          const pred = set.eolPrediction!;
          return (
            <Link
              key={set.id}
              href={`/lexikon/${set.id}`}
              className="card card-hover grid sm:grid-cols-[140px_1fr_auto] items-center"
            >
              <BrickImage
                src={set.imageUrl}
                alt={pick(set.name, lang)}
                label={set.id}
                className="h-28 w-full"
                imgClassName="object-contain p-2"
              />
              <div className="p-4 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-[var(--muted)]">{set.id}</span>
                  <AvailabilityBadge availability={set.availability} />
                  <span
                    className={`badge ${
                      pred.confidence === "high"
                        ? "badge-red"
                        : pred.confidence === "medium"
                          ? "badge-yellow"
                          : "badge-gray"
                    }`}
                  >
                    {t("eol.confidence")}: {t(`conf.${pred.confidence}`)}
                  </span>
                </div>
                <p className="font-semibold">{pick(set.name, lang)}</p>
                <p className="text-sm text-[var(--muted)]">
                  {set.theme} · {t("common.rrp")}: {formatEUR(set.retailPriceEUR, lang)}
                </p>
                {pred.note && (
                  <p className="text-xs text-[var(--muted)] mt-1">{pick(pred.note, lang)}</p>
                )}
              </div>
              <div className="px-4 pb-4 sm:pb-0 sm:pr-6 text-left sm:text-right">
                <p className="text-xs text-[var(--muted)] mb-1">{t("eol.window")}</p>
                <p className="font-bold text-[var(--yellow)] whitespace-nowrap">
                  {pick(pred.window, lang)}
                </p>
                <p className="text-xs text-[var(--muted)] font-mono">
                  {pred.earliest} → {pred.latest}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {tracked.length === 0 && (
        <div className="card p-10 text-center text-[var(--muted)]">
          {lang === "de"
            ? "Noch keine Sets im Radar - der Daten-Agent liefert gleich Nachschub."
            : "No sets on the radar yet - the data agent is delivering shortly."}
        </div>
      )}

      <p className="text-xs text-[var(--muted)]">{t("common.estimates")}</p>
    </div>
  );
}
