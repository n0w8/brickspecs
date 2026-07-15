"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";

interface Stats {
  views: number | null;
  holders: number | null;
}

/**
 * Dezente oeffentliche Statistik-Badges unter der Kaufleiste: Seitenaufrufe und
 * Anzahl der Sammler, die das Set im Portfolio haben. Beim Mount wird der Aufruf
 * einmal hochgezaehlt (POST /api/sets/[id]/view) und der neue Stand angezeigt.
 *
 * Der useRef-Guard verhindert das doppelte Zaehlen durch React-StrictMode
 * (Doppel-Mount im Dev). Liefert die API null-Werte (Schema noch nicht deployt
 * oder Supabase nicht konfiguriert), wird der jeweilige Badge ausgeblendet;
 * sind beide null, rendert die Komponente nichts.
 */
export default function SetStats({ setId }: { setId: string }) {
  const { lang } = useLang();
  const [stats, setStats] = useState<Stats | null>(null);
  const firedFor = useRef<string | null>(null);

  useEffect(() => {
    if (firedFor.current === setId) return;
    firedFor.current = setId;

    let cancelled = false;
    fetch(`/api/sets/${encodeURIComponent(setId)}/view`, { method: "POST" })
      .then((r) => r.json())
      .then((json: Stats) => {
        if (!cancelled) setStats(json);
      })
      .catch(() => {
        if (!cancelled) setStats(null);
      });
    return () => {
      cancelled = true;
    };
  }, [setId]);

  if (!stats || (stats.views === null && stats.holders === null)) return null;

  const nf = lang === "de" ? "de-DE" : "en-GB";

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
      {stats.views !== null && (
        <span className="badge badge-gray">
          👁 {stats.views.toLocaleString(nf)} {lang === "de" ? "Aufrufe" : "views"}
        </span>
      )}
      {stats.holders !== null && stats.holders > 0 && (
        <span className="badge badge-gray">
          📁 {stats.holders.toLocaleString(nf)}{" "}
          {lang === "de" ? "Sammler haben dieses Set" : "collectors own this set"}
        </span>
      )}
    </div>
  );
}
