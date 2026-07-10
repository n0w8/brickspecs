"use client";

import Link from "next/link";
import { SETS } from "@/data/sets";
import { pick, useLang, useT } from "@/lib/i18n";
import { formatEUR, growthPercent } from "@/lib/format";
import BrickImage from "@/components/BrickImage";

/** Handverlesene Ikonen der LEGO-Geschichte (IDs aus den kuratierten Sets). */
const LEGENDARY_IDS = [
  "375",   // Gelbe Burg
  "10179", // UCS Millennium Falcon
  "10182", // Café Corner
  "10188", // Todesstern
  "10123", // Cloud City
  "6285",  // Black Seas Barracuda
  "928",   // Galaxy Explorer
  "6399",  // Airport Shuttle Monorail
  "4558",  // Metroliner
  "10020", // Santa Fe
  "8880",  // Super Car
  "6989",  // Mega Core Magnetizer
  "10190", // Market Street
  "10030", // UCS Star Destroyer
  "10194", // Emerald Night
  "7740",  // 12V-Intercity
];

export default function LegendsPage() {
  const { lang } = useLang();
  const t = useT();

  const legends = LEGENDARY_IDS.map((id) => SETS.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <div className="flex flex-col gap-8 pt-8">
      {/* Hero */}
      <div
        className="card p-8 sm:p-10"
        style={{
          background:
            "linear-gradient(120deg, var(--surface) 40%, rgba(246,199,0,0.14) 100%)",
        }}
      >
        <p className="text-3xl mb-2">🏆</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">{t("legends.title")}</h1>
        <p className="text-[var(--muted)] max-w-2xl">{t("legends.sub")}</p>
      </div>

      <div className="flex flex-col gap-4">
        {legends.map((set, i) => {
          const growth = growthPercent(set);
          return (
            <Link
              key={set.id}
              href={`/lexikon/${set.id}`}
              className="card card-hover grid sm:grid-cols-[64px_150px_1fr_auto] items-center"
            >
              <div className="hidden sm:flex items-center justify-center h-full">
                <span className="text-2xl font-extrabold text-[var(--yellow)]">
                  {i + 1}
                </span>
              </div>
              <BrickImage
                src={set.imageUrl}
                alt={pick(set.name, lang)}
                label={set.id}
                className="h-28 w-full"
                imgClassName="object-contain p-2"
              />
              <div className="p-4 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-[var(--muted)]">
                    {set.id} · {set.year}
                  </span>
                  <span className="badge badge-blue">{set.theme}</span>
                </div>
                <p className="font-bold text-lg leading-snug">{pick(set.name, lang)}</p>
                <p className="text-sm text-[var(--muted)] leading-relaxed line-clamp-2">
                  {pick(set.description, lang)}
                </p>
              </div>
              <div className="px-4 pb-4 sm:pb-0 sm:pr-6 text-left sm:text-right">
                <p className="font-bold text-[var(--yellow)] whitespace-nowrap">
                  {formatEUR(set.currentValueNewEUR, lang)}
                </p>
                {growth !== null && (
                  <p
                    className={`text-sm font-bold ${growth >= 0 ? "text-[#4cd587]" : "text-[#ff6b6c]"}`}
                  >
                    {growth >= 0 ? "+" : ""}
                    {growth}%
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      <p className="text-xs text-[var(--muted)]">{t("common.estimates")}</p>
    </div>
  );
}
