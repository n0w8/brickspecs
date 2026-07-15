"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLang, useT } from "@/lib/i18n";
import { formatEUR } from "@/lib/format";
import BrickImage from "./BrickImage";

interface ResultItem {
  id: string;
  name: string;
  /** Deutscher Name, nur wenn er vom englischen abweicht */
  nameDe?: string;
  year: number;
  theme: string;
  parts: number;
  img: string;
  curatedId?: string;
  curatedValueEUR?: number | null;
}

interface SearchResponse {
  total: number;
  page: number;
  pageSize: number;
  results: ResultItem[];
}

interface Meta {
  total: number;
  fetchedAt: string;
  themes: string[];
}

type SortKey = "year-desc" | "year-asc" | "parts-desc" | "name";

const DECADES = [
  { id: "all", from: undefined, to: undefined },
  ...Array.from({ length: 8 }, (_, i) => {
    const from = 2020 - i * 10;
    return { id: `${from}s`, from, to: from + 9 };
  }),
];

export default function LexiconBrowser({
  initialQuery,
  initialYear = null,
}: {
  initialQuery: string;
  initialYear?: number | null;
}) {
  const { lang } = useLang();
  const t = useT();

  const [query, setQuery] = useState(initialQuery);
  const [theme, setTheme] = useState("all");
  const [decade, setDecade] = useState("all");
  const [year, setYear] = useState<number | null>(initialYear);
  const [sort, setSort] = useState<SortKey>("year-desc");
  const [page, setPage] = useState(1);

  const [meta, setMeta] = useState<Meta | null>(null);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/catalog/search?meta=1")
      .then((r) => r.json())
      .then(setMeta)
      .catch(() => setMeta(null));
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      const d = DECADES.find((x) => x.id === decade);
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (theme !== "all") params.set("theme", theme);
      if (year !== null) {
        params.set("yearFrom", String(year));
        params.set("yearTo", String(year));
      } else {
        if (d?.from) params.set("yearFrom", String(d.from));
        if (d?.to) params.set("yearTo", String(d.to));
      }
      params.set("sort", sort);
      params.set("page", String(page));
      fetch(`/api/catalog/search?${params.toString()}`)
        .then((r) => r.json())
        .then((json: SearchResponse) => setData(json))
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, theme, decade, sort, page, year]);

  // Bei Filterwechsel zurück auf Seite 1
  useEffect(() => {
    setPage(1);
  }, [query, theme, decade, sort, year]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="flex flex-col gap-6 pt-8">
      <div>
        <h1 className="text-3xl font-extrabold mb-1">{t("nav.lexicon")}</h1>
        <p className="text-[var(--muted)]">
          {meta
            ? `${meta.total.toLocaleString(lang === "de" ? "de-DE" : "en-GB")} ${t("lex.catalogCount")} · ${t("lex.updated")}: ${new Date(meta.fetchedAt).toLocaleDateString(lang === "de" ? "de-DE" : "en-GB")}`
            : lang === "de"
              ? "Der komplette LEGO-Katalog - suchen, filtern, Steckbriefe öffnen."
              : "The complete LEGO catalog - search, filter, open profiles."}
        </p>
      </div>

      <div className="card p-4 flex flex-col gap-3">
        <input
          className="input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("home.searchPlaceholder")}
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <select className="input" value={theme} onChange={(e) => setTheme(e.target.value)}>
            <option value="all">{t("common.theme")}: {t("common.all")}</option>
            {(meta?.themes ?? []).map((th) => (
              <option key={th} value={th}>
                {th}
              </option>
            ))}
          </select>
          {year !== null ? (
            <button
              type="button"
              className="chip chip-active justify-center"
              onClick={() => setYear(null)}
              title={t("common.all")}
            >
              📅 {year} ✕
            </button>
          ) : (
            <select className="input" value={decade} onChange={(e) => setDecade(e.target.value)}>
              <option value="all">{t("lex.decade")}: {t("common.all")}</option>
              {DECADES.slice(1).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.from}-{d.to}
                </option>
              ))}
            </select>
          )}
          <select className="input" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            <option value="year-desc">{t("lex.sortNewest")}</option>
            <option value="year-asc">{t("lex.sortOldest")}</option>
            <option value="parts-desc">{t("lex.sortParts")}</option>
            <option value="name">{t("lex.sortName")}</option>
          </select>
        </div>
      </div>

      <p className="text-sm text-[var(--muted)]">
        {loading
          ? t("lex.searching")
          : `${(data?.total ?? 0).toLocaleString(lang === "de" ? "de-DE" : "en-GB")} ${t("common.results")}`}
      </p>

      {!loading && data && data.results.length === 0 ? (
        <div className="card p-10 text-center text-[var(--muted)]">{t("common.noResults")}</div>
      ) : (
        <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${loading ? "opacity-50" : ""}`}>
          {(data?.results ?? []).map((item) => {
            const displayName = lang === "de" && item.nameDe ? item.nameDe : item.name;
            return (
            <Link key={item.id} href={`/lexikon/${item.id}`} className="card flex flex-col">
              <BrickImage
                src={item.img || undefined}
                alt={displayName}
                label={item.id}
                className="h-40 w-full"
                imgClassName="object-contain p-2"
              />
              <div className="p-4 flex flex-col gap-2 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-[var(--muted)]">
                    {item.id} · {item.year || "-"}
                  </span>
                  {item.curatedId && (
                    <span className="badge badge-yellow">★ {t("lex.curatedBadge")}</span>
                  )}
                </div>
                <p className="font-semibold leading-snug">{displayName}</p>
                <p className="text-xs text-[var(--muted)]">
                  {item.theme}
                  {item.parts > 0
                    ? ` · ${item.parts.toLocaleString(lang === "de" ? "de-DE" : "en-GB")} ${t("common.pieces")}`
                    : ""}
                </p>
                {item.curatedValueEUR != null && (
                  <div className="mt-auto pt-2 border-t border-[var(--border)]">
                    <span className="font-bold text-[var(--yellow)]">
                      {formatEUR(item.curatedValueEUR, lang)}
                    </span>
                  </div>
                )}
              </div>
            </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {data && data.total > data.pageSize && (
        <div className="flex items-center justify-center gap-4">
          <button
            className="btn"
            disabled={page <= 1}
            style={{ opacity: page <= 1 ? 0.4 : 1 }}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t("lex.prev")}
          </button>
          <span className="text-sm text-[var(--muted)]">
            {t("lex.pageOf")} {page} {t("lex.of")} {totalPages.toLocaleString(lang === "de" ? "de-DE" : "en-GB")}
          </span>
          <button
            className="btn"
            disabled={page >= totalPages}
            style={{ opacity: page >= totalPages ? 0.4 : 1 }}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            {t("lex.next")}
          </button>
        </div>
      )}

      <p className="text-xs text-[var(--muted)]">
        {lang === "de"
          ? "Katalogdaten: Rebrickable (täglich synchronisierbar). Sets mit ★ haben zusätzlich redaktionelle Daten (Preishistorie, EOL-Prognose, Beschreibung)."
          : "Catalog data: Rebrickable (daily sync available). Sets marked ★ carry additional editorial data (price history, EOL forecast, description)."}
      </p>
    </div>
  );
}
