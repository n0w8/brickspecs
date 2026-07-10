"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { pick, useLang, useT } from "@/lib/i18n";
import { formatEUR } from "@/lib/format";
import { upcomingByYear, upcomingCountByYear } from "@/lib/upcoming-index";
import type { UpcomingSet } from "@/data/upcoming";

interface YearEntry {
  year: number;
  count: number;
}

/** Ab diesem Jahr blenden wir den hervorgehobenen "Angekündigt"-Abschnitt mit Karten ein. */
const HIGHLIGHT_FROM_YEAR = new Date().getFullYear();

export default function YearsPage() {
  const { lang } = useLang();
  const t = useT();
  const locale = lang === "de" ? "de-DE" : "en-GB";

  const [catalogYears, setCatalogYears] = useState<YearEntry[] | null>(null);

  useEffect(() => {
    fetch("/api/catalog/search?meta=1")
      .then((r) => r.json())
      .then((m: { years?: YearEntry[] }) => setCatalogYears(m.years ?? []))
      .catch(() => setCatalogYears([]));
  }, []);

  // Angekündigte Sets nach Jahr (aus UPCOMING, unabhängig vom Katalog).
  const upcomingByYearMap = useMemo(() => upcomingByYear(), []);
  const upcomingCounts = useMemo(() => upcomingCountByYear(), []);

  // Jahresliste aus Katalog-Jahren UND UPCOMING-Jahren zusammenführen.
  const years = useMemo<YearEntry[] | null>(() => {
    if (!catalogYears) return null;
    const catalogCounts = new Map<number, number>();
    for (const y of catalogYears) catalogCounts.set(y.year, y.count);

    const allYears = new Set<number>(catalogCounts.keys());
    for (const y of Object.keys(upcomingCounts)) allYears.add(Number(y));

    return Array.from(allYears).map((year) => ({
      year,
      count: catalogCounts.get(year) ?? 0,
    }));
  }, [catalogYears, upcomingCounts]);

  const decades = useMemo(() => {
    if (!years) return [];
    const map = new Map<number, YearEntry[]>();
    for (const y of years) {
      const decade = Math.floor(y.year / 10) * 10;
      const list = map.get(decade);
      if (list) list.push(y);
      else map.set(decade, [y]);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([decade, entries]) => ({
        decade,
        total: entries.reduce((sum, e) => sum + e.count, 0),
        entries: entries.sort((a, b) => b.year - a.year),
      }));
  }, [years]);

  const maxCount = useMemo(
    () => (years ? Math.max(1, ...years.map((y) => y.count)) : 1),
    [years]
  );

  return (
    <div className="flex flex-col gap-8 pt-8">
      <div>
        <h1 className="text-3xl font-extrabold mb-1">📅 {t("years.title")}</h1>
        <p className="text-[var(--muted)] max-w-2xl">{t("years.sub")}</p>
      </div>

      {/* Hinweis: Zukunftsjahre zeigen nur offiziell katalogisierte Sets */}
      <Link
        href="/neuheiten"
        className="card card-hover p-5 flex flex-wrap items-center gap-3 border-l-4 !border-l-[var(--yellow)]"
      >
        <span className="text-2xl" aria-hidden>
          🚀
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold">
            {lang === "de"
              ? "2026/2027 wirkt leer? Der Katalog zeigt nur offiziell erfasste Sets."
              : "2026/2027 looks empty? The catalog only shows officially registered sets."}
          </p>
          <p className="text-sm text-[var(--muted)]">
            {lang === "de"
              ? "Alle angekündigten und geleakten Neuheiten findest du im Neuheiten-Radar."
              : "Find all announced and leaked upcoming sets in the New Releases radar."}
          </p>
        </div>
        <span className="btn btn-primary shrink-0">
          {lang === "de" ? "Zum Neuheiten-Radar" : "Open radar"} →
        </span>
      </Link>

      {years === null ? (
        <p className="text-sm text-[var(--muted)]">{t("lex.searching")}</p>
      ) : (
        decades.map(({ decade, total, entries }) => (
          <section key={decade}>
            <div className="flex items-baseline gap-3 mb-3">
              <h2 className="text-xl font-bold">
                {decade}er
              </h2>
              <span className="text-sm text-[var(--muted)]">
                {total.toLocaleString(locale)} {t("years.setsIn")}
              </span>
            </div>

            {/* Hervorgehobene Abschnitte für aktuelles Jahr + Zukunft mit angekündigten Sets */}
            {entries
              .filter(
                (e) => e.year >= HIGHLIGHT_FROM_YEAR && (upcomingByYearMap[e.year]?.length ?? 0) > 0
              )
              .map(({ year }) => (
                <AnnouncedSection
                  key={`announced-${year}`}
                  year={year}
                  sets={upcomingByYearMap[year] ?? []}
                  lang={lang}
                  locale={locale}
                />
              ))}

            <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
              {entries.map(({ year, count }) => {
                const upcomingCount = upcomingCounts[year] ?? 0;
                return (
                  <Link
                    key={year}
                    href={`/lexikon?year=${year}`}
                    className="card card-hover p-3 flex flex-col gap-1.5"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-bold text-lg">{year}</span>
                      <span className="text-xs text-[var(--muted)] text-right">
                        {upcomingCount > 0 ? (
                          <>
                            {count.toLocaleString(locale)}{" "}
                            <span className="text-[var(--yellow)]">
                              + {upcomingCount}{" "}
                              {lang === "de" ? "angekündigt" : "announced"}
                            </span>
                          </>
                        ) : (
                          count.toLocaleString(locale)
                        )}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--yellow)]"
                        style={{ width: `${Math.max(3, Math.round((count / maxCount) * 100))}%` }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

/** Hervorgehobener Abschnitt mit kompakten Karten der angekündigten Sets eines Jahres. */
function AnnouncedSection({
  year,
  sets,
  lang,
  locale,
}: {
  year: number;
  sets: UpcomingSet[];
  lang: "de" | "en";
  locale: string;
}) {
  return (
    <div className="card p-4 mb-3 border-l-4 !border-l-[var(--yellow)]">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <h3 className="font-bold">
          🚀 {lang === "de" ? `Angekündigt für ${year}` : `Announced for ${year}`}
        </h3>
        <span className="text-sm text-[var(--muted)]">
          {sets.length.toLocaleString(locale)} {lang === "de" ? "Sets" : "sets"}
        </span>
        <Link href="/neuheiten" className="btn !py-1 !px-3 text-sm ml-auto">
          {lang === "de" ? "Zum Neuheiten-Radar" : "Open radar"} →
        </Link>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {sets.map((set) => (
          <Link
            key={set.id}
            href="/neuheiten"
            className="card card-hover p-3 flex flex-col gap-1.5"
          >
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span
                className={`badge ${set.status === "confirmed" ? "badge-green" : "badge-gray"}`}
              >
                {set.status === "confirmed"
                  ? lang === "de" ? "Bestätigt" : "Confirmed"
                  : lang === "de" ? "Gerücht" : "Rumor"}
              </span>
              <span className="badge badge-blue">{set.theme}</span>
            </div>
            <p className="font-semibold text-sm leading-snug">{pick(set.name, lang)}</p>
            <div className="mt-auto flex flex-wrap items-baseline justify-between gap-x-2 text-xs text-[var(--muted)]">
              {set.expectedPriceEUR !== null && (
                <span>
                  {lang === "de" ? "Erw." : "Exp."} {formatEUR(set.expectedPriceEUR, lang)}
                </span>
              )}
              <span className="ml-auto">
                {lang === "de" ? "Quelle" : "Source"}: {set.source}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
