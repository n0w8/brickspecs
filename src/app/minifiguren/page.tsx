"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MINIFIGS } from "@/data/minifigs";
import { useLang, useT } from "@/lib/i18n";
import MinifigCard from "@/components/MinifigCard";
import BrickImage from "@/components/BrickImage";

interface FigResultItem {
  id: string;
  name: string;
  parts: number;
  img: string;
  setCount: number;
}

interface FigSearchResponse {
  total: number;
  page: number;
  pageSize: number;
  results: FigResultItem[];
}

interface FigMeta {
  total: number;
  fetchedAt: string;
}

export default function MinifigsPage() {
  const { lang } = useLang();
  const t = useT();
  const locale = lang === "de" ? "de-DE" : "en-GB";

  const [curatedOpen, setCuratedOpen] = useState(true);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<FigMeta | null>(null);
  const [data, setData] = useState<FigSearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/catalog/minifigs?meta=1")
      .then((r) => r.json())
      .then(setMeta)
      .catch(() => setMeta(null));
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      params.set("page", String(page));
      fetch(`/api/catalog/minifigs?${params.toString()}`)
        .then((r) => r.json())
        .then((json: FigSearchResponse) => setData(json))
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, page]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="flex flex-col gap-6 pt-8">
      <div>
        <h1 className="text-3xl font-extrabold mb-1">{t("nav.minifigs")}</h1>
        <p className="text-[var(--muted)]">
          {meta
            ? `${meta.total.toLocaleString(locale)} ${t("figs.catalogCount")} · ${t("lex.updated")}: ${new Date(meta.fetchedAt).toLocaleDateString(locale)}`
            : lang === "de"
              ? "Der komplette Minifiguren-Katalog - suchen und Steckbriefe öffnen."
              : "The complete minifigure catalog - search and open profiles."}
        </p>
      </div>

      {/* ── Kuratierte Highlights ─────────────────────────────────────── */}
      <section>
        <button
          type="button"
          className="flex items-center gap-2 font-bold text-lg mb-4"
          onClick={() => setCuratedOpen((o) => !o)}
          aria-expanded={curatedOpen}
        >
          <span className="text-[var(--yellow)]">★</span> {t("figs.curatedTitle")}
          <span className="text-sm text-[var(--muted)] font-normal">
            ({MINIFIGS.length}) {curatedOpen ? "▾" : "▸"}
          </span>
        </button>
        {curatedOpen && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MINIFIGS.map((fig) => (
              <MinifigCard key={fig.id} fig={fig} />
            ))}
          </div>
        )}
      </section>

      {/* ── Voll-Katalog ─────────────────────────────────────────────── */}
      <div className="card p-4">
        <input
          className="input w-full"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1); // Bei neuer Suche zurück auf Seite 1
          }}
          placeholder={t("figs.searchPlaceholder")}
        />
      </div>

      <p className="text-sm text-[var(--muted)]">
        {loading
          ? t("lex.searching")
          : `${(data?.total ?? 0).toLocaleString(locale)} ${t("common.results")}`}
      </p>

      {!loading && data && data.results.length === 0 ? (
        <div className="card p-10 text-center text-[var(--muted)]">{t("common.noResults")}</div>
      ) : (
        <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${loading ? "opacity-50" : ""}`}>
          {(data?.results ?? []).map((item) => (
            <Link key={item.id} href={`/minifiguren/${item.id}`} className="card flex flex-col">
              <BrickImage
                src={item.img || undefined}
                alt={item.name}
                label={item.id}
                className="h-36 w-full"
                imgClassName="object-contain p-3"
              />
              <div className="p-4 flex flex-col gap-2 flex-1">
                <span className="font-mono text-xs text-[var(--muted)]">{item.id}</span>
                <p className="font-semibold leading-snug">{item.name}</p>
                <p className="text-xs text-[var(--muted)] mt-auto pt-2 border-t border-[var(--border)]">
                  {item.parts > 0
                    ? `${item.parts.toLocaleString(locale)} ${t("common.pieces")} · `
                    : ""}
                  {lang === "de" ? `in ${item.setCount} Sets` : `in ${item.setCount} sets`}
                </p>
              </div>
            </Link>
          ))}
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
            {t("lex.pageOf")} {page} {t("lex.of")} {totalPages.toLocaleString(locale)}
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
          ? "Katalogdaten: Rebrickable (täglich synchronisierbar). Figuren mit ★ haben zusätzlich redaktionelle Daten (Seltenheit, Preishistorie, Beschreibung)."
          : "Catalog data: Rebrickable (daily sync available). Figures marked ★ carry additional editorial data (rarity, price history, description)."}
      </p>
    </div>
  );
}
