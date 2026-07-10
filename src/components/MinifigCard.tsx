"use client";

import Link from "next/link";
import type { Minifig } from "@/data/types";
import { pick, useLang, useT } from "@/lib/i18n";
import { formatEUR } from "@/lib/format";
import BrickImage from "./BrickImage";

export function RarityBadge({ rarity }: { rarity: Minifig["rarity"] }) {
  const t = useT();
  const cls =
    rarity === "ultra-rare"
      ? "badge-red"
      : rarity === "rare"
        ? "badge-yellow"
        : rarity === "uncommon"
          ? "badge-blue"
          : "badge-gray";
  return <span className={`badge ${cls}`}>{t(`rarity.${rarity}`)}</span>;
}

export default function MinifigCard({ fig }: { fig: Minifig }) {
  const { lang } = useLang();

  return (
    <Link href={`/minifiguren/${fig.id}`} className="card flex flex-col">
      <BrickImage
        src={fig.imageUrl}
        alt={pick(fig.name, lang)}
        label={fig.id}
        className="h-36 w-full"
        imgClassName="object-contain p-3"
      />
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-[var(--muted)]">
            {fig.id} · {fig.firstYear}
          </span>
          <RarityBadge rarity={fig.rarity} />
        </div>
        <p className="font-semibold leading-snug">{pick(fig.name, lang)}</p>
        <p className="text-xs text-[var(--muted)]">{fig.theme}</p>
        <div className="mt-auto pt-2 border-t border-[var(--border)]">
          <span className="font-bold text-[var(--yellow)]">
            {formatEUR(fig.valueNewEUR, lang)}
          </span>
        </div>
      </div>
    </Link>
  );
}
