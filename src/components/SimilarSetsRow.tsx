"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n";
import BrickImage from "./BrickImage";

export interface SimilarSetItem {
  id: string;
  name: string;
  /** Deutscher Name, nur wenn er vom englischen abweicht */
  nameDe?: string;
  year: number;
  theme: string;
  parts: number;
  img: string;
}

/** Kompakte Karten-Reihe mit bis zu 6 ähnlichen Sets (gleiches Root-Theme). */
export default function SimilarSetsRow({ sets }: { sets: SimilarSetItem[] }) {
  const { lang } = useLang();

  if (!sets || sets.length === 0) return null;

  return (
    <section>
      <h2 className="font-bold text-lg mb-4">
        🧩 {lang === "de" ? "Ähnliche Sets" : "Similar sets"}
      </h2>
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {sets.slice(0, 6).map((s) => {
          const displayName = lang === "de" && s.nameDe ? s.nameDe : s.name;
          return (
          <Link key={s.id} href={`/lexikon/${s.id}`} className="card flex flex-col">
            <BrickImage
              src={s.img || undefined}
              alt={displayName}
              label={s.id}
              className="h-28 w-full"
              imgClassName="object-contain p-2"
            />
            <div className="p-3 flex flex-col gap-1 flex-1">
              <p className="text-sm font-semibold leading-snug">{displayName}</p>
              <p className="font-mono text-xs text-[var(--muted)] mt-auto pt-1">
                {s.id}
                {s.year > 0 ? ` · ${s.year}` : ""}
              </p>
              {s.parts > 0 && (
                <p className="text-xs text-[var(--muted)]">
                  {s.parts.toLocaleString(lang === "de" ? "de-DE" : "en-GB")}{" "}
                  {lang === "de" ? "Teile" : "parts"}
                </p>
              )}
            </div>
          </Link>
          );
        })}
      </div>
    </section>
  );
}
