"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SETS } from "@/data/sets";
import { MINIFIGS } from "@/data/minifigs";
import { LEAKS } from "@/data/leaks";
import { ARTICLES } from "@/data/articles";
import { pick, useLang, useT } from "@/lib/i18n";
import { formatDate, formatEUR } from "@/lib/format";
import SetCard from "@/components/SetCard";
import HeroPortfolioChart from "@/components/HeroPortfolioChart";
import GwpBanner from "@/components/GwpBanner";

export default function Home() {
  const { lang } = useLang();
  const t = useT();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [catalogTotal, setCatalogTotal] = useState<number | null>(null);
  const [figsTotal, setFigsTotal] = useState<number | null>(null);
  const [newsletterConfirmed, setNewsletterConfirmed] = useState(false);

  // Rueckkehr vom Double-Opt-in-Link (?newsletter=confirmed): Danke-Banner
  // zeigen und den Parameter aus der URL entfernen.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("newsletter") === "confirmed") {
      setNewsletterConfirmed(true);
      params.delete("newsletter");
      const rest = params.toString();
      window.history.replaceState(null, "", rest ? `/?${rest}` : "/");
    }
  }, []);

  useEffect(() => {
    fetch("/api/catalog/search?meta=1")
      .then((r) => r.json())
      .then((m: { total: number }) => setCatalogTotal(m.total))
      .catch(() => setCatalogTotal(null));
    fetch("/api/catalog/minifigs?meta=1")
      .then((r) => r.json())
      .then((m: { total: number }) => setFigsTotal(m.total))
      .catch(() => setFigsTotal(null));
  }, []);

  const featured = [...SETS]
    .filter((s) => s.availability === "retired")
    .sort((a, b) => (b.currentValueNewEUR ?? 0) - (a.currentValueNewEUR ?? 0))
    .slice(0, 4);

  const eolSoon = SETS.filter((s) => s.eolPrediction)
    .sort((a, b) =>
      (a.eolPrediction?.earliest ?? "9999").localeCompare(b.eolPrediction?.earliest ?? "9999")
    )
    .slice(0, 3);

  const latestLeaks = [...LEAKS]
    .sort((a, b) => b.postedAt.localeCompare(a.postedAt))
    .slice(0, 3);

  const latestArticles = [...ARTICLES]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-14 pt-10">
      {/* Danke-Banner nach Newsletter-Bestätigung */}
      {newsletterConfirmed && (
        <div className="card flex items-center justify-between gap-3 border-2 !border-[#23a45c] p-4">
          <p className="text-sm font-semibold">
            🎉{" "}
            {lang === "de"
              ? "Anmeldung bestätigt! Ab jetzt bekommst du die besten LEGO-Deals, Gratis-Beigaben und Leaks per E-Mail."
              : "Subscription confirmed! You will now receive the best LEGO deals, gifts with purchase and leaks by e-mail."}
          </p>
          <button
            type="button"
            className="chip shrink-0"
            onClick={() => setNewsletterConfirmed(false)}
            aria-label={lang === "de" ? "Schließen" : "Close"}
          >
            ✕
          </button>
        </div>
      )}

      {/* Hero: links Pitch + Suche, rechts Portfolio-Chart */}
      <section className="grid gap-8 lg:grid-cols-2 items-center">
        <div className="flex flex-col gap-5">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            {t("home.heroTitle")}
          </h1>
          <p className="text-[var(--muted)] text-lg">{t("home.heroSub")}</p>
          <form
            className="flex w-full max-w-xl gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`/lexikon${query ? `?q=${encodeURIComponent(query)}` : ""}`);
            }}
          >
            <input
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("home.searchPlaceholder")}
              aria-label={t("common.search")}
            />
            <button type="submit" className="btn btn-primary shrink-0">
              🔍
            </button>
          </form>
          <div className="flex flex-wrap gap-2">
            <Link href="/portfolio" className="btn btn-primary">
              📁 {lang === "de" ? "Portfolio starten" : "Start portfolio"}
            </Link>
            <Link href="/scanner" className="btn">
              📸 {lang === "de" ? "Set scannen" : "Scan a set"}
            </Link>
            <Link href="/preise" className="btn">
              💎 {lang === "de" ? "Pläne ansehen" : "View plans"}
            </Link>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-[var(--muted)]">
            <span className="badge badge-yellow">
              🧱 {(catalogTotal ?? SETS.length).toLocaleString(lang === "de" ? "de-DE" : "en-GB")}{" "}
              {lang === "de" ? "Sets im Katalog" : "sets in catalog"}
            </span>
            <span className="badge badge-red">★ {SETS.length} {lang === "de" ? "Steckbriefe+" : "profiles+"}</span>
            <span className="badge badge-blue">
              👤 {(figsTotal ?? MINIFIGS.length).toLocaleString(lang === "de" ? "de-DE" : "en-GB")}{" "}
              {t("common.minifigs")}
            </span>
            <span className="badge badge-green">📰 {ARTICLES.length} {t("nav.articles")}</span>
          </div>
        </div>

        <HeroPortfolioChart />
      </section>

      {/* Schnellzugriff auf Rubriken */}
      <section className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { href: "/legenden", emoji: "🏆", de: "Legendäre Sets", en: "Legendary sets" },
          { href: "/jahrgaenge", emoji: "📅", de: "Jahrgänge", en: "Years" },
          { href: "/portfolio", emoji: "📁", de: "Mein Portfolio", en: "My portfolio" },
          { href: "/eol-radar", emoji: "⏳", de: "EOL-Radar", en: "EOL radar" },
          { href: "/scanner", emoji: "📸", de: "Set-Scanner", en: "Set scanner" },
          { href: "/preise", emoji: "💎", de: "Preise & Pläne", en: "Pricing" },
        ].map((tile) => (
          <Link key={tile.href} href={tile.href} className="card card-hover p-4 text-center">
            <span className="text-2xl block mb-1" aria-hidden>
              {tile.emoji}
            </span>
            <span className="font-semibold text-sm">{lang === "de" ? tile.de : tile.en}</span>
          </Link>
        ))}
      </section>

      {/* Aktuelle Gratis-Beigaben */}
      <GwpBanner />

      {/* Legendäre Sets */}
      <section>
        <SectionHead title={t("home.featured")} href="/legenden" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((set) => (
            <SetCard key={set.id} set={set} />
          ))}
        </div>
      </section>

      {/* EOL-Teaser */}
      {eolSoon.length > 0 && (
        <section>
          <SectionHead title={t("home.eolTeaser")} href="/eol-radar" />
          <div className="grid gap-4 sm:grid-cols-3">
            {eolSoon.map((set) => (
              <Link key={set.id} href={`/lexikon/${set.id}`} className="card p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-[var(--muted)]">{set.id}</span>
                  <span className="badge badge-yellow">
                    ⏳ {set.eolPrediction ? pick(set.eolPrediction.window, lang) : ""}
                  </span>
                </div>
                <p className="font-semibold">{pick(set.name, lang)}</p>
                <p className="text-sm text-[var(--muted)]">
                  {t("common.rrp")}: {formatEUR(set.retailPriceEUR, lang)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Leaks + Artikel */}
      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <SectionHead title={t("home.latestLeaks")} href="/leaks" />
          <div className="flex flex-col gap-3">
            {latestLeaks.map((leak) => (
              <Link key={leak.id} href="/leaks" className="card p-4 flex gap-3 items-start">
                <span className="text-xl" aria-hidden>
                  {leak.type === "deal" ? "💸" : leak.type === "news" ? "📰" : "🔍"}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold leading-snug">{pick(leak.title, lang)}</p>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    {leak.source ?? "-"} · {formatDate(leak.postedAt, lang)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
        <section>
          <SectionHead title={t("home.latestArticles")} href="/artikel" />
          <div className="flex flex-col gap-3">
            {latestArticles.map((article) => (
              <Link
                key={article.slug}
                href={`/artikel/${article.slug}`}
                className="card p-4 flex gap-3 items-start"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl"
                  style={{ background: article.hero.gradient }}
                  aria-hidden
                >
                  {article.hero.emoji}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold leading-snug">{pick(article.title, lang)}</p>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    {formatDate(article.date, lang)} · {article.readingMinutes} {t("common.minutes")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionHead({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-bold">{title}</h2>
      <Link href={href} className="text-sm text-[var(--yellow)] hover:underline">
        →
      </Link>
    </div>
  );
}
