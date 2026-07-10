"use client";

import Link from "next/link";
import { MINIFIGS } from "@/data/minifigs";
import { SETS } from "@/data/sets";
import { pick, useLang, useT } from "@/lib/i18n";
import { formatEUR } from "@/lib/format";
import BrickImage from "./BrickImage";
import PriceChart from "./PriceChart";
import SetCard from "./SetCard";
import { RarityBadge } from "./MinifigCard";

export default function MinifigDetail({ figId }: { figId: string }) {
  const { lang } = useLang();
  const t = useT();

  const fig = MINIFIGS.find((f) => f.id === figId);
  if (!fig) return null;

  const knownSets = SETS.filter((s) => fig.appearsInSetIds.includes(s.id));
  const unknownSetIds = fig.appearsInSetIds.filter(
    (id) => !SETS.some((s) => s.id === id)
  );

  return (
    <div className="flex flex-col gap-8 pt-8">
      <Link href="/minifiguren" className="text-sm text-[var(--muted)] hover:text-[var(--yellow)]">
        ← {t("common.back")}
      </Link>

      <div className="card grid md:grid-cols-[260px_1fr]">
        <BrickImage
          src={fig.imageUrl}
          alt={pick(fig.name, lang)}
          label={fig.id}
          className="h-64 md:h-full w-full"
          imgClassName="object-contain p-6"
        />
        <div className="p-6 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-[var(--muted)]">{fig.id}</span>
            <RarityBadge rarity={fig.rarity} />
            <span className="badge badge-blue">{fig.theme}</span>
          </div>
          <h1 className="text-3xl font-extrabold leading-tight">{pick(fig.name, lang)}</h1>
          <p className="leading-relaxed text-[#c7cede]">{pick(fig.description, lang)}</p>

          <div className="grid grid-cols-3 gap-3 mt-auto pt-3">
            <div className="card !bg-[var(--surface-2)] p-3">
              <p className="text-xs text-[var(--muted)] mb-1">{t("common.firstYear")}</p>
              <p className="font-bold">{fig.firstYear}</p>
            </div>
            <div className="card !bg-[var(--surface-2)] p-3">
              <p className="text-xs text-[var(--muted)] mb-1">{t("common.valueNew")}</p>
              <p className="font-bold text-[var(--yellow)]">{formatEUR(fig.valueNewEUR, lang)}</p>
            </div>
            <div className="card !bg-[var(--surface-2)] p-3">
              <p className="text-xs text-[var(--muted)] mb-1">{t("common.valueUsed")}</p>
              <p className="font-bold">{formatEUR(fig.valueUsedEUR, lang)}</p>
            </div>
          </div>
        </div>
      </div>

      <section className="card p-5">
        <h2 className="font-bold text-lg mb-4">📈 {t("common.priceChart")}</h2>
        <PriceChart data={fig.priceHistory} />
        <p className="text-xs text-[var(--muted)] mt-3">{t("common.estimates")}</p>
      </section>

      <section>
        <h2 className="font-bold text-lg mb-4">
          📦 {t("common.appearsIn")}
        </h2>
        {knownSets.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
            {knownSets.map((set) => (
              <SetCard key={set.id} set={set} />
            ))}
          </div>
        )}
        {unknownSetIds.length > 0 && (
          <p className="text-sm text-[var(--muted)]">
            {lang === "de" ? "Außerdem in den Sets: " : "Also appears in sets: "}
            {unknownSetIds.map((id) => (
              <span key={id} className="badge badge-gray mr-1 font-mono">
                {id}
              </span>
            ))}
          </p>
        )}
        {knownSets.length === 0 && unknownSetIds.length === 0 && (
          <p className="text-sm text-[var(--muted)]">-</p>
        )}
      </section>
    </div>
  );
}
