"use client";

import { useState } from "react";
import { GEAR, type GearKind } from "@/data/gear";
import { pick, useLang, useT } from "@/lib/i18n";

const KIND_META: Record<
  GearKind,
  { de: string; en: string; cls: string; tile: string }
> = {
  buch: { de: "Buch", en: "Book", cls: "badge-blue", tile: "rgba(42, 111, 214, 0.15)" },
  spiel: { de: "Spiel", en: "Game", cls: "badge-green", tile: "rgba(35, 164, 92, 0.15)" },
  aufbewahrung: {
    de: "Aufbewahrung",
    en: "Storage",
    cls: "badge-yellow",
    tile: "rgba(246, 199, 0, 0.12)",
  },
  merch: { de: "Merch", en: "Merch", cls: "badge-red", tile: "rgba(208, 16, 18, 0.15)" },
};

const KINDS: GearKind[] = ["buch", "spiel", "aufbewahrung", "merch"];

function amazonSearchUrl(query: string): string {
  return `https://www.amazon.de/s?k=${encodeURIComponent(query)}`;
}

export default function GearPage() {
  const { lang } = useLang();
  const t = useT();
  const [kind, setKind] = useState<"all" | GearKind>("all");
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const items = GEAR.filter((item) => {
    if (kind !== "all" && item.kind !== kind) return false;
    if (!q) return true;
    return (
      item.name.de.toLowerCase().includes(q) ||
      item.name.en.toLowerCase().includes(q) ||
      (item.isbn ?? "").replace(/-/g, "").includes(q.replace(/-/g, ""))
    );
  });

  return (
    <div className="flex flex-col gap-8 pt-8">
      <div>
        <h1 className="text-3xl font-extrabold mb-1">
          📚 {lang === "de" ? "Bücher & Merch" : "Books & Merch"}
        </h1>
        <p className="text-[var(--muted)] max-w-2xl">
          {lang === "de"
            ? "LEGO abseits der Sets: kuratierte Standardwerke, Spiele, Aufbewahrungs-Klassiker und Merch mit Sammlerwert - von der DK-Enzyklopädie bis zum Steinetrenner."
            : "LEGO beyond the sets: curated reference books, games, storage classics and merch with collector value - from the DK encyclopedia to the brick separator."}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex gap-2 flex-wrap">
          <button
            className={`chip ${kind === "all" ? "chip-active" : ""}`}
            onClick={() => setKind("all")}
          >
            {t("common.all")}
          </button>
          {KINDS.map((k) => (
            <button
              key={k}
              className={`chip ${kind === k ? "chip-active" : ""}`}
              onClick={() => setKind(k)}
            >
              {KIND_META[k][lang]}
            </button>
          ))}
        </div>
        <input
          type="search"
          className="input w-full max-w-md"
          placeholder={
            lang === "de"
              ? "Suchen, z. B. Ideen Buch oder ISBN …"
              : "Search, e.g. Ideas Book or ISBN …"
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <p className="text-xs text-[var(--muted)]">
          {items.length} {t("common.results")}
        </p>
      </div>

      {items.length === 0 ? (
        <p className="text-[var(--muted)]">{t("common.noResults")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const meta = KIND_META[item.kind];
            const buyQuery = item.isbn ?? `LEGO ${pick(item.name, lang)}`;
            return (
              <article key={item.id} className="card card-hover p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <span
                    aria-hidden
                    className="grid h-14 w-14 shrink-0 place-items-center rounded-xl text-3xl"
                    style={{ background: meta.tile }}
                  >
                    {item.emoji}
                  </span>
                  <span className={`badge ${meta.cls}`}>{meta[lang]}</span>
                </div>
                <h2 className="font-bold text-lg leading-snug">{pick(item.name, lang)}</h2>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--muted)]">
                  <span>
                    {t("common.year")}: {item.year ?? "-"}
                  </span>
                  <span>
                    {lang === "de" ? "Richtpreis" : "Guide price"}:{" "}
                    {item.priceEUR !== null ? `~${item.priceEUR} EUR` : "-"}
                  </span>
                </div>
                <p className="text-sm text-[#c7cede] leading-relaxed">
                  {pick(item.description, lang)}
                </p>
                {item.isbn && (
                  <p className="text-xs text-[var(--muted)]">ISBN {item.isbn}</p>
                )}
                <div className="mt-auto pt-2">
                  <a
                    href={amazonSearchUrl(buyQuery)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary !py-1.5 !px-3 text-sm"
                  >
                    🛒 {lang === "de" ? "Kaufen" : "Buy"}
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="text-xs text-[var(--muted)] border-t border-[var(--border)] pt-4">
        {lang === "de"
          ? "Alle Preise sind grobe Richtwerte (Stand Juli 2026), bei EOL-Artikeln übliche Zweitmarktpreise. Kaufen-Links öffnen eine Amazon.de-Suche - keine Affiliate-Links (noch)."
          : "All prices are rough guide values (as of July 2026); for retired items, typical secondary market prices. Buy links open an Amazon.de search - no affiliate links (yet)."}
      </p>
    </div>
  );
}
