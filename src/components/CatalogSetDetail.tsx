"use client";

import Link from "next/link";
import { useLang, useT } from "@/lib/i18n";
import BrickImage from "./BrickImage";
import PricePanel, { type PanelMinifig } from "./PricePanel";
import AddToPortfolio from "./AddToPortfolio";
import PriceAlertButton from "./PriceAlertButton";
import SimilarSetsRow, { type SimilarSetItem } from "./SimilarSetsRow";

export interface CatalogEntryProps {
  id: string;
  name: string;
  year: number;
  themeName: string;
  parts: number;
  img: string;
}

/** Externe Referenz-Links (Brickset, Rebrickable, BrickLink) als Chips. */
export function ExternalLinkChips({ catalogId }: { catalogId: string }) {
  const { lang } = useLang();
  const links = [
    { label: "Brickset", href: `https://brickset.com/sets/${catalogId}` },
    { label: "Rebrickable", href: `https://rebrickable.com/sets/${catalogId}/` },
    {
      label: "BrickLink",
      href: `https://www.bricklink.com/v2/catalog/catalogitem.page?S=${catalogId}`,
    },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-[var(--muted)]">
        {lang === "de" ? "Extern nachschlagen:" : "Look up externally:"}
      </span>
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className="badge badge-gray hover:text-[var(--yellow)] hover:border-[var(--yellow)] transition-colors"
        >
          {l.label} ↗
        </a>
      ))}
    </div>
  );
}

/** Steckbrief für Katalog-Sets ohne redaktionelle Daten (alle ~19,6k Bau-Sets). */
export default function CatalogSetDetail({
  entry,
  similar = [],
  figs,
  figsTotal,
}: {
  entry: CatalogEntryProps;
  similar?: SimilarSetItem[];
  figs?: PanelMinifig[];
  figsTotal?: number;
}) {
  const { lang } = useLang();
  const t = useT();

  // themeName kommt als "Root · Sub" (oder nur "Root") aus themeNameOf()
  const themeParts = entry.themeName.split(" · ").filter(Boolean);

  return (
    <div className="flex flex-col gap-8 pt-8">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--muted)]">
        <Link href="/lexikon" className="hover:text-[var(--yellow)]">
          ← {t("common.back")}
        </Link>
        <span aria-hidden>·</span>
        <nav
          aria-label={lang === "de" ? "Themen-Pfad" : "Theme path"}
          className="flex flex-wrap items-center gap-x-2 gap-y-1"
        >
          {themeParts.map((part, i) => (
            <span key={`${part}-${i}`} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden>›</span>}
              <span className={i === themeParts.length - 1 ? "text-[var(--text)]" : ""}>
                {part}
              </span>
            </span>
          ))}
          {entry.year > 0 && (
            <>
              <span aria-hidden>›</span>
              <Link
                href={`/lexikon?year=${entry.year}`}
                className="hover:text-[var(--yellow)] underline decoration-dotted underline-offset-4"
              >
                {entry.year}
              </Link>
            </>
          )}
        </nav>
      </div>

      <div className="card grid md:grid-cols-[320px_1fr]">
        <BrickImage
          src={entry.img || undefined}
          alt={entry.name}
          label={entry.id}
          className="h-64 md:h-full w-full"
          imgClassName="object-contain p-4"
        />
        <div className="p-6 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-[var(--muted)]">{entry.id}</span>
            <span className="badge badge-blue">{entry.themeName}</span>
            {entry.year > 0 && <span className="badge badge-gray">{entry.year}</span>}
          </div>
          <h1 className="text-3xl font-extrabold leading-tight">{entry.name}</h1>
          <p className="text-sm text-[var(--muted)] leading-relaxed">{t("catalog.noEditorial")}</p>
          <div className="mt-auto pt-3">
            <ExternalLinkChips catalogId={entry.id} />
          </div>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <div className="card p-4">
          <p className="text-xs text-[var(--muted)] mb-1">
            {lang === "de" ? "Setnummer" : "Set number"}
          </p>
          <p className="font-bold font-mono">{entry.id}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-[var(--muted)] mb-1">
            {lang === "de" ? "Jahrgang" : "Year"}
          </p>
          {entry.year > 0 ? (
            <Link
              href={`/lexikon?year=${entry.year}`}
              className="font-bold text-[var(--yellow)] hover:underline"
            >
              {entry.year} →
            </Link>
          ) : (
            <p className="font-bold">-</p>
          )}
        </div>
        <div className="card p-4">
          <p className="text-xs text-[var(--muted)] mb-1">{t("common.theme")}</p>
          <span className="badge badge-blue">{entry.themeName}</span>
        </div>
        <div className="card p-4">
          <p className="text-xs text-[var(--muted)] mb-1">{t("common.pieces")}</p>
          <p className="font-bold">
            {entry.parts > 0
              ? entry.parts.toLocaleString(lang === "de" ? "de-DE" : "en-GB")
              : "-"}
          </p>
        </div>
      </div>

      <PricePanel setId={entry.id} figs={figs} figsTotal={figsTotal} />

      <AddToPortfolio setId={entry.id} name={entry.name} img={entry.img} />

      <PriceAlertButton setId={entry.id} name={entry.name} img={entry.img} />

      {similar.length > 0 && <SimilarSetsRow sets={similar} />}
    </div>
  );
}
