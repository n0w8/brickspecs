"use client";

import Link from "next/link";
import type { GwpPromo } from "@/data/gwp";
import { pick, useLang } from "@/lib/i18n";
import { formatDate, formatEUR } from "@/lib/format";
import BrickImage from "@/components/BrickImage";
import NewsletterSignup from "@/components/NewsletterSignup";

function daysLeft(endDate: string): number {
  return Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000));
}

/** Detailansicht einer Gratis-Beigabe: Bild, Status, Bedingung, Fakten, Links. */
export default function GwpDetailClient({ gwp }: { gwp: GwpPromo }) {
  const { lang } = useLang();
  const upcoming = new Date(gwp.startDate).getTime() > Date.now();

  const period = `${formatDate(gwp.startDate, lang)} - ${
    gwp.endDate
      ? formatDate(gwp.endDate, lang)
      : lang === "de"
        ? "solange Vorrat reicht"
        : "while supplies last"
  }`;

  const facts: { label: string; value: string }[] = [
    { label: lang === "de" ? "Zeitraum" : "Period", value: period },
    ...(gwp.valueEUR
      ? [
          {
            label: lang === "de" ? "Warenwert" : "Value",
            value: `~${formatEUR(gwp.valueEUR, lang)}`,
          },
        ]
      : []),
    { label: "Shop", value: gwp.shop },
    { label: lang === "de" ? "Quelle" : "Source", value: gwp.source },
  ];

  return (
    <div className="py-8 flex flex-col gap-6">
      <Link href="/" className="text-sm text-[var(--muted)] hover:text-[var(--text)] w-fit">
        ← {lang === "de" ? "Zurueck zur Startseite" : "Back to home"}
      </Link>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr] items-start">
        <div className="card">
          <BrickImage
            src={gwp.imageUrl}
            alt={pick(gwp.name, lang)}
            label={gwp.setNumber ?? "GWP"}
            className="h-72 w-full"
            imgClassName="object-contain p-4"
          />
        </div>

        <div className="flex flex-col gap-4 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge badge-yellow">🎁 GWP</span>
            {gwp.status === "confirmed" ? (
              <span className="badge badge-green">
                {lang === "de" ? "Bestaetigt" : "Confirmed"}
              </span>
            ) : (
              <span className="badge badge-gray">{lang === "de" ? "Geruecht" : "Rumor"}</span>
            )}
            {upcoming ? (
              <span className="badge badge-blue">
                {lang === "de" ? "Ab" : "From"} {formatDate(gwp.startDate, lang)}
              </span>
            ) : gwp.endDate ? (
              <span
                className={`badge ${daysLeft(gwp.endDate) <= 3 ? "badge-red" : "badge-green"}`}
              >
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

          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">
            {pick(gwp.name, lang)}
            {gwp.setNumber && (
              <span className="font-mono text-base font-normal text-[var(--muted)] ml-3">
                {gwp.setNumber}
              </span>
            )}
          </h1>

          <div className="card p-5 border-l-4 border-l-[var(--yellow)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-1.5">
              {lang === "de" ? "So bekommst du die Beigabe" : "How to get the gift"}
            </p>
            <p className="text-lg font-semibold leading-snug">{pick(gwp.condition, lang)}</p>
          </div>

          <div className="card p-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {facts.map((fact) => (
              <div key={fact.label} className="min-w-0">
                <p className="text-xs text-[var(--muted)]">{fact.label}</p>
                <p className="text-sm font-semibold leading-snug">{fact.value}</p>
              </div>
            ))}
          </div>

          {gwp.note && (
            <p className="text-sm text-[#c7cede] leading-relaxed">{pick(gwp.note, lang)}</p>
          )}

          <div className="flex flex-wrap gap-2">
            {gwp.shop === "LEGO Shop" && (
              <a
                href="https://www.lego.com/de-de"
                target="_blank"
                rel="noopener noreferrer"
                className="chip"
              >
                🛒 {lang === "de" ? "Zum LEGO Shop" : "To the LEGO Shop"}
              </a>
            )}
            {gwp.setNumber && (
              <Link href={`/lexikon?q=${gwp.setNumber}`} className="chip">
                📖 {lang === "de" ? "Beigabe im Lexikon" : "Gift in the encyclopedia"}
              </Link>
            )}
          </div>
        </div>
      </div>

      <NewsletterSignup variant="box" />
    </div>
  );
}
