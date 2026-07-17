"use client";

/**
 * Kleine oeffentliche Anzeige "X gerade online". Fragt /api/presence beim Laden
 * und danach minuetlich ab. Zeigt sich nur, wenn eine echte Zahl vorliegt
 * (kein "n/a"-Flackern, solange die Praesenz-Tabelle noch nicht deployt ist).
 */

import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";

export default function OnlineNow({ className = "" }: { className?: string }) {
  const { lang } = useLang();
  const [online, setOnline] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch("/api/presence")
        .then((r) => r.json())
        .then((j: { online: number | null }) => {
          if (!cancelled) setOnline(typeof j.online === "number" ? j.online : null);
        })
        .catch(() => {});
    };
    load();
    const timer = window.setInterval(load, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  if (online === null || online < 1) return null;

  return (
    <span className={`badge badge-green ${className}`}>
      <span className="inline-block h-2 w-2 rounded-full bg-[#23a45c] mr-1.5 align-middle animate-pulse" />
      {online.toLocaleString(lang === "de" ? "de-DE" : "en-GB")}{" "}
      {lang === "de" ? "gerade online" : "online now"}
    </span>
  );
}
