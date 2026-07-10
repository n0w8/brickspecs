"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n";

export default function Footer() {
  const { lang } = useLang();

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)] mt-10">
      <div className="stud-row" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid gap-8 sm:grid-cols-3 text-sm">
        <div>
          <p className="font-bold text-base mb-2">
            Brick<span className="text-[var(--yellow)]">Specs</span>
          </p>
          <p className="text-[var(--muted)] leading-relaxed">
            {lang === "de"
              ? "Das Portal für LEGO-Sammler: Lexikon, Preise, EOL-Radar, Leaks und City-Inspiration."
              : "The portal for LEGO collectors: encyclopedia, prices, EOL radar, leaks and city inspiration."}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-semibold mb-1">
            {lang === "de" ? "Entdecken" : "Explore"}
          </p>
          <Link href="/lexikon" className="text-[var(--muted)] hover:text-[var(--yellow)]">
            {lang === "de" ? "Set-Lexikon" : "Set encyclopedia"}
          </Link>
          <Link href="/minifiguren" className="text-[var(--muted)] hover:text-[var(--yellow)]">
            {lang === "de" ? "Minifiguren" : "Minifigures"}
          </Link>
          <Link href="/legenden" className="text-[var(--muted)] hover:text-[var(--yellow)]">
            {lang === "de" ? "Legendäre Sets" : "Legendary sets"}
          </Link>
          <Link href="/jahrgaenge" className="text-[var(--muted)] hover:text-[var(--yellow)]">
            {lang === "de" ? "Jahrgänge" : "Years"}
          </Link>
          <Link href="/eol-radar" className="text-[var(--muted)] hover:text-[var(--yellow)]">
            EOL-Radar
          </Link>
          <Link href="/preisalarm" className="text-[var(--muted)] hover:text-[var(--yellow)]">
            {lang === "de" ? "Preisalarm" : "Price alerts"}
          </Link>
          <Link href="/admin" className="text-[var(--muted)] hover:text-[var(--yellow)]">
            Admin
          </Link>
        </div>
        <div className="text-[var(--muted)] leading-relaxed">
          <p className="mb-2">
            {lang === "de"
              ? "Alle Preise sind recherchierte Schätzwerte (Demo-Daten, Stand Juli 2026) - keine Anlageberatung."
              : "All prices are researched estimates (demo data as of July 2026) - not financial advice."}
          </p>
          <p>
            {lang === "de"
              ? "LEGO® ist eine Marke der LEGO Gruppe. Diese Seite ist ein unabhängiges Fan-Projekt und steht in keiner Verbindung zur LEGO Gruppe."
              : "LEGO® is a trademark of the LEGO Group. This site is an independent fan project not affiliated with the LEGO Group."}
          </p>
        </div>
      </div>
    </footer>
  );
}
