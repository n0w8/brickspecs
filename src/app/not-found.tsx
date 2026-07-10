"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n";

export default function NotFound() {
  const { lang } = useLang();

  return (
    <div className="flex flex-col items-center justify-center gap-4 pt-28 text-center">
      <p className="text-6xl" aria-hidden>
        🧱💥
      </p>
      <h1 className="text-3xl font-extrabold">404</h1>
      <p className="text-[var(--muted)] max-w-md">
        {lang === "de"
          ? "Diese Seite wurde wohl beim letzten Umbau der Stadt abgerissen. Der Eintrag existiert nicht (mehr)."
          : "This page seems to have been demolished during the last city rebuild. The entry does not exist (anymore)."}
      </p>
      <Link href="/" className="btn btn-primary mt-2">
        {lang === "de" ? "Zurück zur Startseite" : "Back to home"}
      </Link>
    </div>
  );
}
