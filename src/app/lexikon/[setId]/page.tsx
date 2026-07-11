import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SETS } from "@/data/sets";
import {
  catalogIdForCurated,
  curatedForCatalogId,
  getCatalogSet,
  rootThemeNameOf,
  searchCatalog,
  themeNameOf,
} from "@/lib/catalog";
import { figsInSet } from "@/lib/minifig-catalog";
import type { LegoSet } from "@/data/types";
import SetDetail from "@/components/SetDetail";
import CatalogSetDetail from "@/components/CatalogSetDetail";
import type { SimilarSetItem } from "@/components/SimilarSetsRow";
import SetMinifigsRow, { type SetMinifigItem } from "@/components/SetMinifigsRow";

export function generateStaticParams() {
  return SETS.map((set) => ({ setId: set.id }));
}

/** Kürzt einen Text auf ~155 Zeichen (Wortgrenze) für Meta-Descriptions. */
function truncateDescription(text: string, max = 155): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 80 ? lastSpace : max).trimEnd()} …`;
}

function curatedSetMetadata(set: LegoSet): Metadata {
  const title = `${set.name.de} (${set.id}) - Steckbrief, Preise & Wertentwicklung | BrickSpecs`;
  const description = truncateDescription(set.description.de);
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(set.imageUrl ? { images: [set.imageUrl] } : {}),
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ setId: string }>;
}): Promise<Metadata> {
  const { setId } = await params;

  // Gleiche Auflösung wie die Page: kuratiert → Katalog → kuratierter Katalog-Treffer
  const curated = SETS.find((s) => s.id === setId);
  if (curated) return curatedSetMetadata(curated);

  const entry = getCatalogSet(setId);
  if (entry) {
    const curatedMatch = curatedForCatalogId(entry.n);
    if (curatedMatch) return curatedSetMetadata(curatedMatch);

    const setNumber = entry.n.replace(/-\d+$/, "");
    const title = `${entry.t} (${setNumber}) - Steckbrief, Preise & Wertentwicklung | BrickSpecs`;
    const facts = [
      entry.y > 0 ? `aus dem Jahr ${entry.y}` : "",
      entry.p > 0 ? `mit ${entry.p.toLocaleString("de-DE")} Teilen` : "",
    ]
      .filter(Boolean)
      .join(" ");
    const description = truncateDescription(
      `LEGO ${entry.t} (${setNumber})${facts ? ` ${facts}` : ""} - Steckbrief, aktuelle Preise und Wertentwicklung im BrickSpecs-Lexikon.`
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
    title: "LEGO-Set-Lexikon | BrickSpecs",
    description:
      "Set-Steckbriefe mit Release, EOL, UVP, aktuellen Preisen und Wertentwicklung im BrickSpecs-Lexikon.",
  };
}

/** Basisnummer ohne Varianten-Suffix, z. B. "10188-1" → "10188". */
function baseNumberOf(id: string): string {
  return id.replace(/-\d+$/, "");
}

/**
 * Bis zu 6 ähnliche Sets aus dem Katalog: gleiches Root-Theme, Jahr ±3.
 * Innerhalb des Kandidaten-Pools wird nach Nähe der Teilezahl sortiert,
 * damit z. B. ein UCS-Set nicht neben 5-Teile-Polybags landet. Liefert das
 * Jahresfenster zu wenige Treffer, wird ohne Fenster aufgefüllt.
 */
function similarSetsFor(catalogId: string): SimilarSetItem[] {
  const entry = getCatalogSet(catalogId);
  if (!entry) return [];

  const theme = rootThemeNameOf(entry.th);
  const selfBase = baseNumberOf(entry.n);
  const picked: SimilarSetItem[] = [];
  const seenBases = new Set<string>([selfBase]);

  const collect = (withYearWindow: boolean) => {
    const { results } = searchCatalog({
      theme,
      pageSize: 60,
      ...(withYearWindow && entry.y > 0
        ? { yearFrom: entry.y - 3, yearTo: entry.y + 3 }
        : {}),
    });
    // Nähe zur eigenen Teilezahl als Rang; Sets ohne Teilezahl ans Ende
    const ranked =
      entry.p > 0
        ? [...results].sort((a, b) => {
            const da = a.parts > 0 ? Math.abs(a.parts - entry.p) : Number.MAX_SAFE_INTEGER;
            const db = b.parts > 0 ? Math.abs(b.parts - entry.p) : Number.MAX_SAFE_INTEGER;
            return da - db;
          })
        : results;
    for (const r of ranked) {
      if (picked.length >= 6) return;
      const base = baseNumberOf(r.id);
      if (seenBases.has(base)) continue;
      seenBases.add(base);
      picked.push({
        id: r.id,
        name: r.name,
        year: r.year,
        theme: r.theme,
        parts: r.parts,
        img: r.img,
      });
    }
  };

  if (entry.y > 0) collect(true);
  if (picked.length < 6) collect(false);
  return picked;
}

/** Minifiguren des Sets als Props für die Karten-Reihe (max. 12). */
function minifigsFor(catalogId: string): { figs: SetMinifigItem[]; total: number } {
  const all = figsInSet(catalogId);
  return {
    figs: all.slice(0, 12).map((f) => ({ id: f.n, name: f.t, parts: f.p, img: f.i })),
    total: all.length,
  };
}

export default async function SetDetailPage({
  params,
}: {
  params: Promise<{ setId: string }>;
}) {
  const { setId } = await params;

  // 1) Kuratierte ID direkt (z. B. "10188")
  const curated = SETS.find((s) => s.id === setId);
  if (curated) {
    const catalogId = catalogIdForCurated(curated.id);
    const minifigs = minifigsFor(catalogId ?? curated.id);
    // Volle Katalogliste nur, wenn sie mehr zeigt als die redaktionelle
    // "Enthaltene Minifiguren"-Auswahl im SetDetail selbst.
    const showAll = minifigs.total > curated.minifigIds.length;
    return (
      <>
        <SetDetail
          setId={curated.id}
          similar={catalogId ? similarSetsFor(catalogId) : []}
        />
        {showAll && (
          <div className="mt-10">
            <SetMinifigsRow figs={minifigs.figs} total={minifigs.total} />
          </div>
        )}
      </>
    );
  }

  // 2) Katalog-Eintrag (z. B. "10188-1" oder unbekannte Nummer → "-1"-Variante)
  const entry = getCatalogSet(setId);
  if (!entry) notFound();

  const minifigs = minifigsFor(entry.n);

  // Falls der Katalog-Eintrag redaktionelle Daten hat → voller Steckbrief
  const curatedMatch = curatedForCatalogId(entry.n);
  if (curatedMatch) {
    const showAll = minifigs.total > curatedMatch.minifigIds.length;
    return (
      <>
        <SetDetail setId={curatedMatch.id} similar={similarSetsFor(entry.n)} />
        {showAll && (
          <div className="mt-10">
            <SetMinifigsRow figs={minifigs.figs} total={minifigs.total} />
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <CatalogSetDetail
        entry={{
          id: entry.n,
          name: entry.t,
          year: entry.y,
          themeName: themeNameOf(entry.th),
          parts: entry.p,
          img: entry.i,
        }}
        similar={similarSetsFor(entry.n)}
      />
      <div className="mt-10">
        <SetMinifigsRow figs={minifigs.figs} total={minifigs.total} />
      </div>
    </>
  );
}
