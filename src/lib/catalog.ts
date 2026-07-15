// Serverseitige Katalog-Schicht: lädt den kompletten Rebrickable-Dump
// (27k+ Einträge, nach Non-Building-Filter ~19,6k Bau-Sets) einmal in den
// Speicher. NUR aus Server-Code importieren.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SETS } from "@/data/sets";
import type { LegoSet } from "@/data/types";
import { expandSearchQuery } from "@/lib/search-synonyms";

export interface CatalogSet {
  /** Setnummer inkl. Variante, z. B. "10188-1" */
  n: string;
  /** Name (englisch, aus Katalog) */
  t: string;
  /** Deutscher Name (aus names-de.json), nur wenn er vom englischen abweicht */
  d?: string;
  y: number;
  /** Theme-ID */
  th: string;
  /** Teilezahl */
  p: number;
  /** Bild-URL (Rebrickable CDN) */
  i: string;
}

interface ThemeEntry {
  name: string;
  parent: string | null;
}

interface Cache {
  fetchedAt: string;
  sets: CatalogSet[];
  byId: Map<string, CatalogSet>;
  themes: Record<string, ThemeEntry>;
  rootThemeNames: string[];
  /** Jahr → Anzahl Sets, absteigend nach Jahr sortiert */
  years: { year: number; count: number }[];
  /** Katalog-ID → kuratiertes Set (redaktionelle Daten) */
  curatedByCatalogId: Map<string, LegoSet>;
  /** kuratierte Set-ID → Katalog-ID */
  catalogIdByCuratedId: Map<string, string>;
}

let cache: Cache | null = null;

// Root-Themes ohne Bau-Sets: Merchandise (Schlüsselanhänger, Uhren,
// Rucksäcke), Bücher, Ersatzteil-/Service-Packs und lose Steine-Beutel
// gehören nicht ins Set-Lexikon. Duplo bleibt drin (ist LEGO).
const NON_BUILDING_ROOT_THEMES = new Set(["Gear", "Books", "Service Packs", "Bulk Bricks"]);

function rootTheme(themes: Record<string, ThemeEntry>, id: string): string {
  let cur = themes[id];
  let guard = 0;
  while (cur?.parent && themes[cur.parent] && guard++ < 10) {
    cur = themes[cur.parent];
  }
  return cur?.name ?? "-";
}

function load(): Cache {
  if (cache) return cache;
  const dir = join(process.cwd(), "src", "data", "catalog");
  const raw = JSON.parse(readFileSync(join(dir, "catalog.json"), "utf8")) as {
    fetchedAt: string;
    sets: CatalogSet[];
  };
  const themes = JSON.parse(readFileSync(join(dir, "themes.json"), "utf8")) as Record<
    string,
    ThemeEntry
  >;

  // Deutsche Katalognamen (von scripts/generate-names-de.mjs erzeugt).
  // Optional: fehlt die Datei, bleiben alle Namen englisch.
  let namesDe: Record<string, string> = {};
  try {
    namesDe = JSON.parse(readFileSync(join(dir, "names-de.json"), "utf8")) as Record<
      string,
      string
    >;
  } catch {
    // kein Fehler - Feature ist dann einfach inaktiv
  }

  // Root-Theme pro Theme-ID einmal auflösen (für den Non-Building-Filter).
  const rootByThemeId = new Map<string, string>();
  const rootOf = (id: string): string => {
    let r = rootByThemeId.get(id);
    if (r === undefined) {
      r = rootTheme(themes, id);
      rootByThemeId.set(id, r);
    }
    return r;
  };

  // Zwei Filterstufen:
  // 1. Rebrickable-Platzhalter ausblenden (keine echten Produkte, z. B.
  //    "DATABASE-...", "... Database Set", "Unused Parts Database").
  // 2. Nicht-Bau-Themes ausblenden (Gear, Books, Service Packs, Bulk
  //    Bricks inkl. aller Unter-Themes) - das Lexikon zeigt nur Bau-Sets.
  //    Wichtig: Der Filter betrifft NUR die Set-Liste; Minifiguren-
  //    Inventare (minifig-catalog.ts) bleiben unangetastet.
  const cat = {
    fetchedAt: raw.fetchedAt,
    sets: raw.sets.filter(
      (s) =>
        !s.n.startsWith("DATABASE-") &&
        !/unused parts/i.test(s.t) &&
        !/database set/i.test(s.t) &&
        !NON_BUILDING_ROOT_THEMES.has(rootOf(s.th))
    ),
  };

  const byId = new Map<string, CatalogSet>();
  const byBase = new Map<string, CatalogSet[]>();
  for (const s of cat.sets) {
    const de = namesDe[s.n];
    if (de) s.d = de;
    byId.set(s.n, s);
    const base = s.n.replace(/-\d+$/, "");
    const list = byBase.get(base);
    if (list) list.push(s);
    else byBase.set(base, [s]);
  }

  // Kuratierte Sets den Katalog-Einträgen zuordnen (Jahr als Tiebreaker,
  // z. B. Gelbe Burg 375 → Katalog "375-2").
  const curatedByCatalogId = new Map<string, LegoSet>();
  const catalogIdByCuratedId = new Map<string, string>();
  for (const curated of SETS) {
    const candidates = byBase.get(curated.id) ?? [];
    if (candidates.length === 0) continue;
    const best =
      candidates.find((c) => c.y === curated.year) ??
      candidates.find((c) => Math.abs(c.y - curated.year) <= 1) ??
      candidates[0];
    curatedByCatalogId.set(best.n, curated);
    catalogIdByCuratedId.set(curated.id, best.n);
  }

  const rootNames = new Set<string>();
  const yearCounts = new Map<number, number>();
  for (const s of cat.sets) {
    rootNames.add(rootTheme(themes, s.th));
    if (s.y > 0) yearCounts.set(s.y, (yearCounts.get(s.y) ?? 0) + 1);
  }

  cache = {
    fetchedAt: cat.fetchedAt,
    sets: cat.sets,
    byId,
    themes,
    rootThemeNames: Array.from(rootNames).sort((a, b) => a.localeCompare(b)),
    years: Array.from(yearCounts.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => b.year - a.year),
    curatedByCatalogId,
    catalogIdByCuratedId,
  };
  return cache;
}

export function themeNameOf(themeId: string): string {
  const c = load();
  const own = c.themes[themeId]?.name ?? "-";
  const root = rootTheme(c.themes, themeId);
  return root === own ? own : `${root} · ${own}`;
}

export function rootThemeNameOf(themeId: string): string {
  return rootTheme(load().themes, themeId);
}

export function getCatalogSet(id: string): CatalogSet | null {
  const c = load();
  return c.byId.get(id) ?? c.byId.get(`${id}-1`) ?? null;
}

export function curatedForCatalogId(catalogId: string): LegoSet | null {
  return load().curatedByCatalogId.get(catalogId) ?? null;
}

export function catalogIdForCurated(curatedId: string): string | null {
  return load().catalogIdByCuratedId.get(curatedId) ?? null;
}

export function catalogMeta() {
  const c = load();
  return {
    fetchedAt: c.fetchedAt,
    total: c.sets.length,
    themes: c.rootThemeNames,
    years: c.years,
  };
}

export type CatalogSortKey = "year-desc" | "year-asc" | "parts-desc" | "name";

export interface CatalogSearchParams {
  q?: string;
  theme?: string;
  yearFrom?: number;
  yearTo?: number;
  sort?: CatalogSortKey;
  page?: number;
  pageSize?: number;
}

export interface CatalogSearchResultItem {
  id: string;
  name: string;
  /** Deutscher Name, nur wenn er vom englischen abweicht */
  nameDe?: string;
  year: number;
  theme: string;
  parts: number;
  img: string;
  /** ID des kuratierten Steckbriefs, falls vorhanden */
  curatedId?: string;
  /** Heutiger Marktwert aus redaktionellen Daten, falls vorhanden */
  curatedValueEUR?: number | null;
}

export function searchCatalog(params: CatalogSearchParams) {
  const c = load();
  const q = (params.q ?? "").trim().toLowerCase();
  const pageSize = Math.min(60, Math.max(1, params.pageSize ?? 24));
  const page = Math.max(1, params.page ?? 1);

  const base = c.sets.filter((s) => {
    if (params.theme && rootTheme(c.themes, s.th) !== params.theme) return false;
    if (params.yearFrom && s.y < params.yearFrom) return false;
    if (params.yearTo && s.y > params.yearTo) return false;
    return true;
  });

  // Gematcht wird gegen Setnummer, englischen UND deutschen Namen -
  // "Polizeistation" findet damit auch ohne Synonym-Umweg direkt Treffer.
  const matches = (s: CatalogSet, term: string) =>
    s.n.toLowerCase().startsWith(term) ||
    s.t.toLowerCase().includes(term) ||
    (s.d !== undefined && s.d.toLowerCase().includes(term));

  // Query-Abgleich: Original-Query zuerst; deutsche Begriffe werden
  // zusätzlich über die DE->EN-Synonym-Map gesucht (z. B. "Polizeistation"
  // -> "police station") und die Ergebnisse angehängt.
  let primary: CatalogSet[];
  const secondary: CatalogSet[] = [];
  if (q) {
    const expansions = expandSearchQuery(q).map((e) => e.toLowerCase());
    primary = [];
    for (const s of base) {
      if (matches(s, q)) primary.push(s);
      else if (expansions.length > 0 && expansions.some((e) => matches(s, e))) {
        secondary.push(s);
      }
    }
  } else {
    primary = base;
  }

  let cmp: (a: CatalogSet, b: CatalogSet) => number;
  switch (params.sort) {
    case "year-asc":
      cmp = (a, b) => a.y - b.y || a.n.localeCompare(b.n);
      break;
    case "parts-desc":
      cmp = (a, b) => b.p - a.p;
      break;
    case "name":
      cmp = (a, b) => a.t.localeCompare(b.t);
      break;
    default:
      cmp = (a, b) => b.y - a.y || a.n.localeCompare(b.n);
  }
  primary.sort(cmp);
  if (secondary.length > 0) secondary.sort(cmp);
  const filtered = secondary.length > 0 ? primary.concat(secondary) : primary;

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const items: CatalogSearchResultItem[] = filtered.slice(start, start + pageSize).map((s) => {
    const curated = c.curatedByCatalogId.get(s.n);
    return {
      id: s.n,
      name: s.t,
      ...(s.d !== undefined ? { nameDe: s.d } : {}),
      year: s.y,
      theme: rootTheme(c.themes, s.th),
      parts: s.p,
      img: s.i,
      ...(curated
        ? { curatedId: curated.id, curatedValueEUR: curated.currentValueNewEUR }
        : {}),
    };
  });

  return { total, page, pageSize, results: items };
}
