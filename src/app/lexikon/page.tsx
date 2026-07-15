import type { Metadata } from "next";
import LexiconBrowser from "@/components/LexiconBrowser";

export const metadata: Metadata = {
  title: "Set-Lexikon - 19.000+ LEGO-Bau-Sets | BrickSpecs",
  description:
    "Das komplette LEGO-Set-Lexikon: über 19.000 Bau-Sets mit Bild, Teilezahl, Theme und Jahrgang - durchsuchbar, filterbar und täglich aktualisiert.",
};

export default async function LexiconPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; year?: string }>;
}) {
  const { q, year } = await searchParams;
  const initialYear = year && /^\d{4}$/.test(year) ? Number(year) : null;
  return <LexiconBrowser initialQuery={q ?? ""} initialYear={initialYear} />;
}
