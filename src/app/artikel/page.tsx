"use client";

import Link from "next/link";
import { useState } from "react";
import { ARTICLES } from "@/data/articles";
import type { ArticleCategory } from "@/data/types";
import { pick, useLang, useT } from "@/lib/i18n";
import { formatDate } from "@/lib/format";

const CATEGORIES: { id: ArticleCategory | "all"; de: string; en: string }[] = [
  { id: "all", de: "Alle", en: "All" },
  { id: "vintage", de: "Vintage", en: "Vintage" },
  { id: "retro", de: "Retro", en: "Retro" },
  { id: "neuheiten", de: "Neuheiten", en: "New releases" },
  { id: "investment", de: "Investment", en: "Investment" },
  { id: "city", de: "City", en: "City" },
  { id: "wissen", de: "Wissen", en: "Knowledge" },
];

export default function ArticlesPage() {
  const { lang } = useLang();
  const t = useT();
  const [category, setCategory] = useState<ArticleCategory | "all">("all");

  const articles = [...ARTICLES]
    .filter((a) => category === "all" || a.category === category)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="flex flex-col gap-6 pt-8">
      <div>
        <h1 className="text-3xl font-extrabold mb-1">📰 {t("nav.articles")}</h1>
        <p className="text-[var(--muted)]">
          {lang === "de"
            ? "Hintergründe, Guides und Geschichten aus der Klemmbaustein-Welt."
            : "Backgrounds, guides and stories from the brick world."}
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`chip ${category === cat.id ? "chip-active" : ""}`}
            onClick={() => setCategory(cat.id)}
          >
            {cat[lang]}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <Link key={article.slug} href={`/artikel/${article.slug}`} className="card flex flex-col">
            <div
              className="h-32 flex items-center justify-center text-5xl"
              style={{ background: article.hero.gradient }}
              aria-hidden
            >
              {article.hero.emoji}
            </div>
            <div className="p-4 flex flex-col gap-2 flex-1">
              <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                <span className="badge badge-blue">
                  {CATEGORIES.find((c) => c.id === article.category)?.[lang] ?? article.category}
                </span>
                <span>{formatDate(article.date, lang)}</span>
              </div>
              <p className="font-bold leading-snug">{pick(article.title, lang)}</p>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                {pick(article.teaser, lang)}
              </p>
              <span className="mt-auto pt-2 text-xs text-[var(--yellow)]">
                {article.readingMinutes} {t("common.minutes")} · {t("common.readMore")} →
              </span>
            </div>
          </Link>
        ))}
      </div>

      {articles.length === 0 && (
        <div className="card p-10 text-center text-[var(--muted)]">{t("common.noResults")}</div>
      )}
    </div>
  );
}
