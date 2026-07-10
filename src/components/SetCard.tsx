"use client";

import Link from "next/link";
import type { Availability, LegoSet } from "@/data/types";
import { pick, useLang, useT } from "@/lib/i18n";
import { formatEUR, growthPercent } from "@/lib/format";
import BrickImage from "./BrickImage";

export function AvailabilityBadge({ availability }: { availability: Availability }) {
  const t = useT();
  const cls =
    availability === "available"
      ? "badge-green"
      : availability === "retiring-soon"
        ? "badge-yellow"
        : "badge-red";
  return <span className={`badge ${cls}`}>{t(`avail.${availability}`)}</span>;
}

export default function SetCard({ set }: { set: LegoSet }) {
  const { lang } = useLang();
  const growth = growthPercent(set);

  return (
    <Link href={`/lexikon/${set.id}`} className="card flex flex-col">
      <BrickImage
        src={set.imageUrl}
        alt={pick(set.name, lang)}
        label={set.id}
        className="h-40 w-full"
        imgClassName="object-contain p-2"
      />
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-[var(--muted)]">
            {set.id} · {set.year}
          </span>
          <AvailabilityBadge availability={set.availability} />
        </div>
        <p className="font-semibold leading-snug">{pick(set.name, lang)}</p>
        <p className="text-xs text-[var(--muted)]">{set.theme}</p>
        <div className="mt-auto pt-2 flex items-center justify-between border-t border-[var(--border)]">
          <span className="font-bold text-[var(--yellow)]">
            {formatEUR(set.currentValueNewEUR, lang)}
          </span>
          {growth !== null && (
            <span
              className={`text-xs font-bold ${growth >= 0 ? "text-[#4cd587]" : "text-[#ff6b6c]"}`}
            >
              {growth >= 0 ? "+" : ""}
              {growth}%
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
