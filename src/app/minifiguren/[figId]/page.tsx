import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MINIFIGS } from "@/data/minifigs";
import { SETS } from "@/data/sets";
import { getCatalogFig } from "@/lib/minifig-catalog";
import { getCatalogSet } from "@/lib/catalog";
import MinifigDetail from "@/components/MinifigDetail";
import CatalogMinifigDetail from "@/components/CatalogMinifigDetail";
import type { SetThumb } from "@/components/SetThumbGrid";

/** Höchstens so viele Set-Kacheln rendern (Seiten-Gewicht); Rest als "+N". */
const MAX_SET_THUMBS = 48;

/**
 * Löst Setnummern ("10188-1") zu Kacheln mit Bild und Name auf. Neueste
 * zuerst. Liefert die begrenzte Liste plus die Gesamtzahl.
 */
function resolveSetThumbs(setIds: string[]): { thumbs: SetThumb[]; total: number } {
  const resolved = setIds
    .map((id) => {
      const s = getCatalogSet(id);
      if (!s) return null;
      return {
        id: s.n,
        name: s.t,
        ...(s.d !== undefined ? { nameDe: s.d } : {}),
        img: s.i,
        year: s.y,
      } satisfies SetThumb;
    })
    .filter((x): x is SetThumb => x !== null)
    .sort((a, b) => b.year - a.year || a.id.localeCompare(b.id));

  return { thumbs: resolved.slice(0, MAX_SET_THUMBS), total: resolved.length };
}

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
  const curatedFig = MINIFIGS.find((f) => f.id === figId);
  if (curatedFig) {
    // Sets, die NICHT als redaktioneller Steckbrief existieren, aus dem
    // Katalog mit Bild auflösen (die kuratierten zeigt MinifigDetail selbst).
    const unknownIds = curatedFig.appearsInSetIds.filter(
      (id) => !SETS.some((s) => s.id === id)
    );
    const { thumbs } = resolveSetThumbs(unknownIds);
    return <MinifigDetail figId={figId} catalogThumbs={thumbs} />;
  }

  // 2) Katalog-Eintrag (Rebrickable, z. B. "fig-000123")
  const entry = getCatalogFig(figId);
  if (!entry) notFound();

  const { thumbs, total } = resolveSetThumbs(entry.s);

  return (
    <CatalogMinifigDetail
      fig={{
        id: entry.n,
        name: entry.t,
        parts: entry.p,
        img: entry.i,
        sets: thumbs,
        totalSets: total,
      }}
    />
  );
}
