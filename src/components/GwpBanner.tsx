"use client";

import Link from "next/link";
import { GWPS, type GwpPromo } from "@/data/gwp";
import { pick, useLang } from "@/lib/i18n";
import { formatDate, formatEUR } from "@/lib/format";
import BrickImage from "./BrickImage";
import NewsletterSignup from "./NewsletterSignup";

function daysLeft(endDate: string): number {
  return Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000));
}

function GwpCard({ gwp, upcoming }: { gwp: GwpPromo; upcoming: boolean }) {
  const { lang } = useLang();

  return (
    <Link
      href={`/gwp/${gwp.id}`}
      className="card card-hover grid sm:grid-cols-[150px_1fr] overflow-hidden"
    >
      <BrickImage
        src={gwp.imageUrl}
        alt={pick(gwp.name, lang)}
        label={gwp.setNumber ?? "GWP"}
        className="h-32 sm:h-full w-full"
        imgClassName="object-contain p-2"
      />
      <div className="p-4 flex flex-col gap-1.5 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge badge-yellow">🎁 GWP</span>
          {gwp.status === "rumor" && (
            <span className="badge badge-gray">
              {lang === "de" ? "Geruecht" : "Rumor"}
            </span>
          )}
          {upcoming ? (
            <span className="badge badge-blue">
              {lang === "de" ? "Ab" : "From"} {formatDate(gwp.startDate, lang)}
            </span>
          ) : gwp.endDate ? (
            <span className={`badge ${daysLeft(gwp.endDate) <= 3 ? "badge-red" : "badge-green"}`}>
              {lang === "de"
                ? `Noch ${daysLeft(gwp.endDate)} ${daysLeft(gwp.endDate) === 1 ? "Tag" : "Tage"}`
                : `${daysLeft(gwp.endDate)} ${daysLeft(gwp.endDate) === 1 ? "day" : "days"} left`}
            </span>
          ) : (
            <span className="badge badge-green">
              {lang === "de" ? "Solange Vorrat reicht" : "While supplies last"}
            </span>
          )}
        </div>
        <p className="font-bold leading-snug">
          {pick(gwp.name, lang)}
          {gwp.setNumber && (
            <span className="font-mono text-xs text-[var(--muted)] ml-2">{gwp.setNumber}</span>
          )}
        </p>
        <p className="text-sm text-[#c7cede] leading-relaxed">{pick(gwp.condition, lang)}</p>
        <p className="text-xs text-[var(--muted)] mt-auto pt-1">
          {gwp.shop}
          {gwp.valueEUR
            ? ` · ${lang === "de" ? "Warenwert" : "Value"} ~${formatEUR(gwp.valueEUR, lang)}`
            : ""}
          {" · "}
          {lang === "de" ? "Quelle" : "Source"}: {gwp.source}
        </p>
      </div>
    </Link>
  );
}

/** Startseiten-Sektion: aktuell laufende und kommende Gratis-Beigaben. */
export default function GwpBanner() {
  const { lang } = useLang();
  const now = Date.now();

  const active = GWPS.filter(
    (g) =>
      new Date(g.startDate).getTime() <= now &&
      (g.endDate === null || new Date(g.endDate).getTime() >= now - 86400000)
  ).sort((a, b) => (a.endDate ?? "9999").localeCompare(b.endDate ?? "9999"));

  const upcoming = GWPS.filter((g) => new Date(g.startDate).getTime() > now).sort((a, b) =>
    a.startDate.localeCompare(b.startDate)
  );

  if (active.length === 0 && upcoming.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">
          🎁 {lang === "de" ? "Aktuelle Gratis-Beigaben" : "Current gifts with purchase"}
        </h2>
        <a href="/leaks" className="text-sm text-[var(--yellow)] hover:underline">
          {lang === "de" ? "Alle Aktionen im Feed" : "All promos in the feed"} →
        </a>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {active.map((g) => (
          <GwpCard key={g.id} gwp={g} upcoming={false} />
        ))}
        {upcoming.slice(0, Math.max(0, 4 - active.length)).map((g) => (
          <GwpCard key={g.id} gwp={g} upcoming={true} />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-start gap-x-3 gap-y-1.5">
        <p className="text-sm font-semibold pt-2.5 whitespace-nowrap">
          🔔 {lang === "de" ? "Keine Beigabe mehr verpassen:" : "Never miss a gift:"}
        </p>
        <div className="flex-1 min-w-[260px]">
          <NewsletterSignup variant="inline" />
        </div>
      </div>
    </section>
  );
}
