import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MINIFIGS } from "@/data/minifigs";
import { getCatalogFig } from "@/lib/minifig-catalog";
import MinifigDetail from "@/components/MinifigDetail";
import CatalogMinifigDetail from "@/components/CatalogMinifigDetail";

export function generateStaticParams() {
  return MINIFIGS.map((fig) => ({ figId: fig.id }));
}

/** Kürzt einen Text auf ~155 Zeichen (Wortgrenze) für Meta-Descriptions. */
function truncateDescription(text: string, max = 155): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 80 ? lastSpace : max).trimEnd()} …`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ figId: string }>;
}): Promise<Metadata> {
  const { figId } = await params;

  // 1) Kuratierte Figur (redaktionelle Daten)
  const curated = MINIFIGS.find((f) => f.id === figId);
  if (curated) {
    const title = `${curated.name.de} (${curated.id}) - Steckbrief, Preise & Wertentwicklung | BrickSpecs`;
    const description = truncateDescription(curated.description.de);
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        ...(curated.imageUrl ? { images: [curated.imageUrl] } : {}),
      },
    };
  }

  // 2) Katalog-Figur (Rebrickable)
  const entry = getCatalogFig(figId);
  if (entry) {
    const title = `${entry.t} (${entry.n}) - Steckbrief, Preise & Wertentwicklung | BrickSpecs`;
    const facts = [
      entry.p > 0 ? `${entry.p} Teile` : "",
      entry.s.length > 0
        ? `enthalten in ${entry.s.length} Set${entry.s.length === 1 ? "" : "s"}`
        : "",
    ]
      .filter(Boolean)
      .join(", ");
    const description = truncateDescription(
      `LEGO-Minifigur ${entry.t} (${entry.n})${facts ? ` - ${facts}` : ""}. Steckbrief mit Set-Zuordnung und Preisen in der BrickSpecs-Datenbank.`
    );
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        ...(entry.i ? { images: [entry.i] } : {}),
      },
    };
  }

  // Unbekannte ID → neutrale Fallback-Metadata (die Page rendert notFound)
  return {
    title: "Minifiguren-Datenbank | BrickSpecs",
    description:
      "Minifiguren-Steckbriefe mit Sets, Erstjahr, Seltenheit, Preisen und Wertentwicklung in der BrickSpecs-Datenbank.",
  };
}

export default async function MinifigDetailPage({
  params,
}: {
  params: Promise<{ figId: string }>;
}) {
  const { figId } = await params;

  // 1) Kuratierte Figur (redaktionelle Daten, z. B. "sw0107")
  const curated = MINIFIGS.some((f) => f.id === figId);
  if (curated) return <MinifigDetail figId={figId} />;

  // 2) Katalog-Eintrag (Rebrickable, z. B. "fig-000123")
  const entry = getCatalogFig(figId);
  if (!entry) notFound();

  return (
    <CatalogMinifigDetail
      fig={{
        id: entry.n,
        name: entry.t,
        parts: entry.p,
        img: entry.i,
        sets: entry.s,
      }}
    />
  );
}
