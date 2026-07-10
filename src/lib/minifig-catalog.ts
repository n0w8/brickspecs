// Serverseitige Minifiguren-Katalog-Schicht: lädt den kompletten
// Rebrickable-Dump (~15k Figuren inkl. Set-Zuordnung) einmal in den
// Speicher. NUR aus Server-Code importieren.

import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface CatalogMinifig {
  /** Figurnummer, z. B. "fig-000123" */
  n: string;
  /** Name (englisch, aus Katalog) */
  t: string;
  /** Teilezahl */
  p: number;
  /** Bild-URL (Rebrickable CDN) */
  i: string;
  /** Setnummern (inkl. Variante, z. B. "10188-1"), in denen die Figur vorkommt */
  s: string[];
}

interface Cache {
  fetchedAt: string;
  figs: CatalogMinifig[];
  byId: Map<string, CatalogMinifig>;
  /** Vorsortiert: setCount absteigend (bekannteste zuerst), dann Name */
  byPopularity: CatalogMinifig[];
}

let cache: Cache | null = null;

function load(): Cache {
  if (cache) return cache;
  const dir = join(process.cwd(), "src", "data", "catalog");
  const cat = JSON.parse(readFileSync(join(dir, "minifig-catalog.json"), "utf8")) as {
    fetchedAt: string;
    figs: CatalogMinifig[];
  };

  const byId = new Map<string, CatalogMinifig>();
  for (const f of cat.figs) byId.set(f.n, f);

  const byPopularity = [...cat.figs].sort(
    (a, b) => b.s.length - a.s.length || a.t.localeCompare(b.t)
  );

  cache = { fetchedAt: cat.fetchedAt, figs: cat.figs, byId, byPopularity };
  return cache;
}

export function getCatalogFig(id: string): CatalogMinifig | null {
  return load().byId.get(id) ?? null;
}

export function figMeta() {
  const c = load();
  return { fetchedAt: c.fetchedAt, total: c.figs.length };
}

export interface FigSearchParams {
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface FigSearchResultItem {
  id: string;
  name: string;
  parts: number;
  img: string;
  setCount: number;
}

export function searchFigs(params: FigSearchParams) {
  const c = load();
  const q = (params.q ?? "").trim().toLowerCase();
  const pageSize = Math.min(60, Math.max(1, params.pageSize ?? 24));
  const page = Math.max(1, params.page ?? 1);

  const filtered = q
    ? c.byPopularity.filter(
        (f) => f.n.toLowerCase().startsWith(q) || f.t.toLowerCase().includes(q)
      )
    : c.byPopularity;

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const results: FigSearchResultItem[] = filtered.slice(start, start + pageSize).map((f) => ({
    id: f.n,
    name: f.t,
    parts: f.p,
    img: f.i,
    setCount: f.s.length,
  }));

  return { total, page, pageSize, results };
}
