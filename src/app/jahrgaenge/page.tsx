"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLang, useT } from "@/lib/i18n";
import { upcomingCountByYear } from "@/lib/upcoming-index";

interface YearEntry {
  year: number;
  count: number;
}

export default function YearsPage() {
  const { lang } = useLang();
  const t = useT();
  const locale = lang === "de" ? "de-DE" : "en-GB";

  const [years, setYears] = useState<YearEntry[] | null>(null);

  useEffect(() => {
    fetch("/api/catalog/search?meta=1")
      .then((r) => r.json())
      .then((m: { years?: YearEntry[] }) => setYears(m.years ?? []))
      .catch(() => setYears([]));
  }, []);

  // Anzahl angekündigter Sets je Jahr (nur als Hinweis auf den Jahres-Kacheln,
  // die eigentlichen Karten leben im Neuheiten-Radar).
  const upcomingCounts = useMemo(() => upcomingCountByYear(), []);

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
