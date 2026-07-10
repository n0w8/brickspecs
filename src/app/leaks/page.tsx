"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LEAKS } from "@/data/leaks";
import type { LeakPost } from "@/data/types";
import { pick, useLang, useT } from "@/lib/i18n";
import { formatEUR } from "@/lib/format";
import { dealSearchUrl, SOURCE_URLS, TELEGRAM_CHANNEL_URL, WHATSAPP_CHANNEL_URL } from "@/lib/config";

function timeAgo(iso: string, lang: "de" | "en"): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.round(diffMs / 60000));
  if (mins < 60) return lang === "de" ? `vor ${mins} Min.` : `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return lang === "de" ? `vor ${hours} Std.` : `${hours} h ago`;
  const days = Math.round(hours / 24);
  return lang === "de" ? `vor ${days} Tagen` : `${days} days ago`;
}

const TYPE_META: Record<LeakPost["type"], { emoji: string; de: string; en: string }> = {
  leak: { emoji: "🔍", de: "Leak", en: "Leak" },
  news: { emoji: "📰", de: "News", en: "News" },
  deal: { emoji: "💸", de: "Deal", en: "Deal" },
};

export default function LeaksPage() {
  const { lang } = useLang();
  const t = useT();
  const [filter, setFilter] = useState<LeakPost["type"] | "all">("all");

  const posts = useMemo(
    () =>
      [...LEAKS]
        .filter((p) => filter === "all" || p.type === filter)
        .sort((a, b) => b.postedAt.localeCompare(a.postedAt)),
    [filter]
  );

  return (
    <div className="flex flex-col gap-6 pt-8">
      <div>
        <h1 className="text-3xl font-extrabold mb-1">🔍 {t("nav.leaks")}</h1>
        <p className="text-[var(--muted)] max-w-2xl">
          {lang === "de"
            ? "Leaks, News und Schnäppchen - kuratiert und blitzschnell. In Phase 3 postet unser Bot alles automatisch in den WhatsApp-Kanal."
            : "Leaks, news and deals - curated and lightning-fast. In phase 3 our bot posts everything to the WhatsApp channel automatically."}
        </p>
      </div>

      {/* WhatsApp-Banner */}
      <div
        className="card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{
          background: "linear-gradient(120deg, var(--surface) 0%, rgba(35,164,92,0.18) 100%)",
        }}
      >
        <div>
          <p className="font-bold text-lg mb-1">💬 {t("leaks.whatsapp")}</p>
          <p className="text-sm text-[var(--muted)]">{t("leaks.whatsappSub")}</p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <a
            href={WHATSAPP_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-green"
          >
            💬 WhatsApp →
          </a>
          <a
            href={TELEGRAM_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
            style={{ background: "#2AABEE", borderColor: "#2AABEE", color: "#fff" }}
          >
            ✈️ Telegram →
          </a>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button className={`chip ${filter === "all" ? "chip-active" : ""}`} onClick={() => setFilter("all")}>
          {t("common.all")}
        </button>
        {(Object.keys(TYPE_META) as LeakPost["type"][]).map((type) => (
          <button
            key={type}
            className={`chip ${filter === type ? "chip-active" : ""}`}
            onClick={() => setFilter(type)}
          >
            {TYPE_META[type].emoji} {TYPE_META[type][lang]}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="flex flex-col gap-4">
        {posts.map((post) => {
          const meta = TYPE_META[post.type];
          const discount =
            post.dealPriceEUR && post.dealRrpEUR
              ? Math.round((1 - post.dealPriceEUR / post.dealRrpEUR) * 100)
              : null;
          return (
            <article key={post.id} className="card p-5">
              <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
                <span className="badge badge-yellow">
                  {meta.emoji} {meta[lang]}
                </span>
                {post.confidence && (
                  <span className={`badge ${post.confidence === "confirmed" ? "badge-green" : "badge-gray"}`}>
                    {post.confidence === "confirmed"
                      ? lang === "de" ? "Bestätigt" : "Confirmed"
                      : lang === "de" ? "Gerücht" : "Rumor"}
                  </span>
                )}
                {post.theme && <span className="badge badge-blue">{post.theme}</span>}
                <span className="text-[var(--muted)] ml-auto">
                  {post.source &&
                    (SOURCE_URLS[post.source] ? (
                      <a
                        href={post.url ?? SOURCE_URLS[post.source]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[var(--yellow)] underline decoration-dotted"
                        title={t("leaks.toSource")}
                      >
                        {post.source}
                      </a>
                    ) : (
                      post.source
                    ))}
                  {post.source ? " · " : ""}
                  {timeAgo(post.postedAt, lang)}
                </span>
              </div>
              <h2 className="font-bold text-lg leading-snug mb-1">{pick(post.title, lang)}</h2>
              <p className="text-[#c7cede] leading-relaxed text-sm">{pick(post.body, lang)}</p>
              {post.dealPriceEUR && (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="text-xl font-extrabold text-[#4cd587]">
                    {formatEUR(post.dealPriceEUR, lang)}
                  </span>
                  {post.dealRrpEUR && (
                    <span className="text-sm text-[var(--muted)] line-through">
                      {formatEUR(post.dealRrpEUR, lang)}
                    </span>
                  )}
                  {discount !== null && <span className="badge badge-green">-{discount}%</span>}
                  {post.dealShop && <span className="badge badge-gray">{post.dealShop}</span>}
                  {(() => {
                    const offerUrl = post.dealUrl ?? dealSearchUrl(post.dealShop, post.setId);
                    return offerUrl ? (
                      <a
                        href={offerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary !py-1.5 !px-3 text-sm ml-auto"
                      >
                        {t("leaks.toOffer")} ↗
                      </a>
                    ) : null;
                  })()}
                </div>
              )}
              {post.setId && (
                <Link
                  href={`/lexikon/${post.setId}`}
                  className="inline-block mt-3 text-sm text-[var(--yellow)] hover:underline"
                >
                  → {lang === "de" ? "Zum Set-Steckbrief" : "View set profile"} {post.setId}
                </Link>
              )}
            </article>
          );
        })}
      </div>

      <p className="text-xs text-[var(--muted)]">
        {lang === "de"
          ? "Hinweis: Leaks sind unbestätigte Informationen. Automatisierung (WhatsApp-Bot) ist als Phase 3 vorbereitet - siehe automation/leak-bot im Projekt."
          : "Note: leaks are unconfirmed information. Automation (WhatsApp bot) is prepared as phase 3 - see automation/leak-bot in the project."}
      </p>
    </div>
  );
}
