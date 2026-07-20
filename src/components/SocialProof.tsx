"use client";

/**
 * Startseiten-Sektion: Staerke-Argumente + Founder-Brick-Teaser.
 *
 * BEWUSST OHNE Nutzer-/Registrierungszahlen: solange die Community klein ist,
 * zeigen wir nach aussen nur Katalog-/Feature-Staerken (grosse, ehrliche
 * Zahlen). Echte Nutzerzahlen sieht nur der Admin (/admin). Sobald die
 * Community 4-stellig ist, liefert /api/stats die Zahlen wieder aus und diese
 * Sektion kann auf Live-Werte umgestellt werden.
 *
 * Der Founder Brick ist noch nicht kaufbar (FOUNDER_COMING_SOON in
 * src/lib/plan.ts) - hier laeuft der Countdown-Teaser dafuer.
 */

import Link from "next/link";
import { useLang } from "@/lib/i18n";
import { FOUNDER_TOTAL } from "@/lib/plan";

export default function SocialProof() {
  const { lang } = useLang();
  const de = lang === "de";

  const tiles = [
    {
      value: "27.000+",
      label: de ? "Sets & Minifiguren im Katalog" : "sets & minifigs in the catalog",
    },
    {
      value: de ? "Täglich" : "Daily",
      label: de
        ? "echte BrickLink-Marktpreise, vollautomatisch aktualisiert"
        : "real BrickLink market prices, updated automatically",
    },
  ];

  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_1.4fr] items-stretch">
      {/* Staerke-Kacheln (keine Nutzerzahlen) */}
      <div className="grid grid-cols-2 gap-4">
        {tiles.map((t) => (
          <div key={t.label} className="card p-5 flex flex-col justify-center">
            <p className="text-2xl sm:text-3xl font-extrabold text-[var(--yellow)]">{t.value}</p>
            <p className="text-xs text-[var(--muted)] mt-1 leading-snug">{t.label}</p>
          </div>
        ))}
      </div>

      {/* Founder-Brick-Teaser (kommt mit einem der naechsten Updates) */}
      <Link href="/preise" className="card card-hover p-5 flex flex-col justify-center">
        <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
          <span className="font-bold">👑 Founder Brick</span>
          <span className="badge badge-yellow">
            🔜 {de ? "kommt mit einem der nächsten Updates" : "coming in one of the next updates"}
          </span>
        </div>
        <p className="text-sm text-[var(--muted)]">
          {de
            ? `Streng limitiert auf ${FOUNDER_TOTAL} Stück: einmal zahlen, alle Premium-Features lebenslang, eigene Founder-Nummer + exklusives Emblem. Wer beim Launch dabei ist, sichert sich eine der niedrigen Nummern.`
            : `Strictly limited to ${FOUNDER_TOTAL} bricks: pay once, keep every premium feature for life, your own founder number + exclusive emblem. Be there at launch to grab one of the low numbers.`}
        </p>
      </Link>
    </section>
  );
}
