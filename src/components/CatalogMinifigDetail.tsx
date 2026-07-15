"use client";

import Link from "next/link";
import { useLang, useT } from "@/lib/i18n";
import BrickImage from "./BrickImage";
import MinifigPricePanel from "./MinifigPricePanel";
import SetThumbGrid, { type SetThumb } from "./SetThumbGrid";

export interface CatalogFigProps {
  id: string;
  name: string;
  parts: number;
  img: string;
  /** Sets mit Bild und Name, in denen die Figur vorkommt (serverseitig aufgelöst) */
  sets: SetThumb[];
  /** Gesamtzahl der Sets (falls mehr als angezeigt) */
  totalSets: number;
}

/** Steckbrief für Katalog-Minifiguren ohne redaktionelle Daten (alle ~17k Figuren). */
export default function CatalogMinifigDetail({ fig }: { fig: CatalogFigProps }) {
  const { lang } = useLang();
  const t = useT();

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

      <MinifigPricePanel figId={fig.id} />

      <section className="card p-5">
        <h2 className="font-bold text-lg mb-4">
          📦 {t("common.appearsIn")}
          {fig.totalSets > 0 ? ` (${fig.totalSets})` : ""}
        </h2>
        {fig.sets.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">-</p>
        ) : (
          <SetThumbGrid sets={fig.sets} total={fig.totalSets} />
        )}
      </section>
    </div>
  );
}
