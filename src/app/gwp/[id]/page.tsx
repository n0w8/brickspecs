import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GWPS } from "@/data/gwp";
import GwpDetailClient from "./GwpDetailClient";

export function generateStaticParams() {
  return GWPS.map((gwp) => ({ id: gwp.id }));
}

/** Kuerzt einen Text auf ~155 Zeichen (Wortgrenze) fuer Meta-Descriptions. */
function truncateDescription(text: string, max = 155): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 80 ? lastSpace : max).trimEnd()} …`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const gwp = GWPS.find((g) => g.id === id);

  // Unbekannte ID -> neutrale Fallback-Metadata (die Page rendert notFound)
  if (!gwp) {
    return {
      title: "LEGO Gratis-Beigaben | BrickSpecs",
      description:
        "Aktuelle LEGO Gratis-Beigaben (GWP) mit Bedingungen, Zeitraeumen und Warenwert im Ueberblick auf BrickSpecs.",
    };
  }

  const title = `${gwp.name.de} - LEGO Gratis-Beigabe | BrickSpecs`;
  const description = truncateDescription(gwp.condition.de);
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(gwp.imageUrl ? { images: [gwp.imageUrl] } : {}),
    },
  };
}

export default async function GwpDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const gwp = GWPS.find((g) => g.id === id);
  if (!gwp) notFound();
  return <GwpDetailClient gwp={gwp} />;
}
