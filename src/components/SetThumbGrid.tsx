"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n";
import BrickImage from "./BrickImage";

export interface SetThumb {
  id: string;
  name: string;
  /** Deutscher Katalogname, nur wenn er vom englischen abweicht */
  nameDe?: string;
  img: string;
  year: number;
}

/**
 * Kachel-Reihe von Sets mit Bild, Name, Nummer und Jahr - z. B. fuer
 * "Kommt vor in" auf Minifiguren-Seiten. Verlinkt auf den Set-Steckbrief.
 */
export default function SetThumbGrid({
  sets,
  total,
}: {
  sets: SetThumb[];
  total?: number;
}) {
  const { lang } = useLang();
  if (sets.length === 0) return null;
  const hidden = Math.max(0, (total ?? sets.length) - sets.length);

  return (
    <>
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {sets.map((s) => (
          <Link key={s.id} href={`/lexikon/${s.id}`} className="card card-hover flex flex-col">
            <BrickImage
              src={s.img || undefined}
              alt={lang === "de" && s.nameDe ? s.nameDe : s.name}
              label={s.id}
              className="h-28 w-full"
              imgClassName="object-contain p-2"
            />
            <div className="p-3 flex flex-col gap-1 flex-1">
              <p className="text-sm font-semibold leading-snug">
                {lang === "de" && s.nameDe ? s.nameDe : s.name}
              </p>
              <p className="font-mono text-xs text-[var(--muted)] mt-auto pt-1">
                {s.id}
                {s.year > 0 ? ` · ${s.year}` : ""}
              </p>
            </div>
          </Link>
        ))}
      </div>
      {hidden > 0 && (
        <p className="mt-3 text-sm text-[var(--muted)]">
          {lang === "de" ? `+ ${hidden} weitere Sets` : `+ ${hidden} more sets`}
        </p>
      )}
    </>
  );
}
