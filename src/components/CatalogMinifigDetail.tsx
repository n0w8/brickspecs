"use client";

import Link from "next/link";
import { useLang, useT } from "@/lib/i18n";
import BrickImage from "./BrickImage";

export interface CatalogFigProps {
  id: string;
  name: string;
  parts: number;
  img: string;
  /** Setnummern (inkl. Variante, z. B. "10188-1") */
  sets: string[];
}

const MAX_SET_CHIPS = 30;

/** Steckbrief für Katalog-Minifiguren ohne redaktionelle Daten (alle ~17k Figuren). */
export default function CatalogMinifigDetail({ fig }: { fig: CatalogFigProps }) {
  const { lang } = useLang();
  const t = useT();

  const shownSets = fig.sets.slice(0, MAX_SET_CHIPS);
  const hiddenCount = fig.sets.length - shownSets.length;

  return (
    <div className="flex flex-col gap-8 pt-8">
      <Link href="/minifiguren" className="text-sm text-[var(--muted)] hover:text-[var(--yellow)]">
        ← {t("common.back")}
      </Link>

      <div className="card grid md:grid-cols-[260px_1fr]">
        <BrickImage
          src={fig.img || undefined}
          alt={fig.name}
          label={fig.id}
          className="h-64 md:h-full w-full"
          imgClassName="object-contain p-6"
        />
        <div className="p-6 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-[var(--muted)]">{fig.id}</span>
            {fig.parts > 0 && (
              <span className="badge badge-gray">
                {fig.parts.toLocaleString(lang === "de" ? "de-DE" : "en-GB")} {t("common.pieces")}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-extrabold leading-tight">{fig.name}</h1>
          <p className="text-sm text-[var(--muted)] leading-relaxed">{t("figs.noEditorial")}</p>
        </div>
      </div>

      <section className="card p-5">
        <h2 className="font-bold text-lg mb-4">📦 {t("common.appearsIn")}</h2>
        {fig.sets.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">-</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {shownSets.map((setNum) => (
              <Link
                key={setNum}
                href={`/lexikon/${setNum}`}
                className="badge badge-blue font-mono hover:opacity-80"
              >
                {setNum}
              </Link>
            ))}
            {hiddenCount > 0 && (
              <span className="badge badge-gray">
                {lang === "de" ? `+${hiddenCount} weitere` : `+${hiddenCount} more`}
              </span>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
