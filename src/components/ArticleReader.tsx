"use client";

import Link from "next/link";
import { ARTICLES } from "@/data/articles";
import { SETS } from "@/data/sets";
import { pick, useLang, useT } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import SetCard from "./SetCard";

export default function ArticleReader({ slug }: { slug: string }) {
  const { lang } = useLang();
  const t = useT();

  const article = ARTICLES.find((a) => a.slug === slug);
  if (!article) return null;

  const paragraphs = article.body[lang];
  const relatedSets = SETS.filter((s) => article.relatedSetIds?.includes(s.id));

  return (
    <div className="flex flex-col gap-8 pt-8 max-w-3xl mx-auto">
      <Link href="/artikel" className="text-sm text-[var(--muted)] hover:text-[var(--yellow)]">
        ← {t("common.back")}
      </Link>

      <header>
        <div
          className="h-40 rounded-2xl flex items-center justify-center text-6xl mb-6"
          style={{ background: article.hero.gradient }}
          aria-hidden
        >
          {article.hero.emoji}
        </div>
        <p className="text-sm text-[var(--muted)] mb-2">
          {formatDate(article.date, lang)} · {article.readingMinutes} {t("common.minutes")}
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-3">
          {pick(article.title, lang)}
        </h1>
        <p className="text-lg text-[var(--muted)]">{pick(article.teaser, lang)}</p>
      </header>

      <div className="prose-brick">
        {paragraphs.map((p, i) =>
          p.startsWith("## ") ? (
            <h2 key={i}>{p.slice(3)}</h2>
          ) : (
            <p key={i}>{p}</p>
          )
        )}
      </div>

      {relatedSets.length > 0 && (
        <section>
          <h2 className="font-bold text-lg mb-4">
            🧱 {lang === "de" ? "Passende Sets" : "Related sets"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {relatedSets.map((set) => (
              <SetCard key={set.id} set={set} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
