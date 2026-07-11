"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n";
import BrickImage from "./BrickImage";

export interface SetMinifigItem {
  id: string;
  name: string;
  parts: number;
  img: string;
}

/**
 * Karten-Reihe mit den Minifiguren eines Sets (Daten aus dem
 * Rebrickable-Katalog, serverseitig via figsInSet ermittelt).
 */
export default function SetMinifigsRow({
  figs,
  total,
}: {
  figs: SetMinifigItem[];
  total: number;
}) {
  const { lang } = useLang();

  if (!figs || figs.length === 0) return null;

  return (
    <section>
      <h2 className="font-bold text-lg mb-4">
        👤{" "}
        {lang === "de"
          ? `Alle Minifiguren in diesem Set (${total})`
          : `All minifigs in this set (${total})`}
      </h2>
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {figs.map((f) => (
          <Link key={f.id} href={`/minifiguren/${encodeURIComponent(f.id)}`} className="card flex flex-col">
            <BrickImage
              src={f.img || undefined}
              alt={f.name}
              label={f.id}
              className="h-28 w-full"
              imgClassName="object-contain p-2"
            />
            <div className="p-3 flex flex-col gap-1 flex-1">
              <p className="text-sm font-semibold leading-snug">{f.name}</p>
              <p className="font-mono text-xs text-[var(--muted)] mt-auto pt-1">{f.id}</p>
              {f.parts > 0 && (
                <p className="text-xs text-[var(--muted)]">
                  {f.parts} {lang === "de" ? "Teile" : "parts"}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
      {total > figs.length && (
        <p className="mt-2 text-xs text-[var(--muted)]">
          {lang === "de"
            ? `+ ${total - figs.length} weitere in der Minifiguren-Datenbank`
            : `+ ${total - figs.length} more in the minifig database`}
        </p>
      )}
    </section>
  );
}
