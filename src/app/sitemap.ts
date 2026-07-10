import type { MetadataRoute } from "next";
import { SETS } from "@/data/sets";
import { MINIFIGS } from "@/data/minifigs";
import { ARTICLES } from "@/data/articles";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://brickspecs.com";

// Statische Hauptrouten mit grober Crawl-Priorisierung.
const STATIC_ROUTES: {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}[] = [
  { path: "", changeFrequency: "daily", priority: 1 },
  { path: "/lexikon", changeFrequency: "daily", priority: 0.9 },
  { path: "/minifiguren", changeFrequency: "daily", priority: 0.9 },
  { path: "/legenden", changeFrequency: "weekly", priority: 0.7 },
  { path: "/jahrgaenge", changeFrequency: "weekly", priority: 0.6 },
  { path: "/eol-radar", changeFrequency: "daily", priority: 0.8 },
  { path: "/leaks", changeFrequency: "daily", priority: 0.8 },
  { path: "/artikel", changeFrequency: "weekly", priority: 0.7 },
  { path: "/city-hub", changeFrequency: "monthly", priority: 0.5 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${BASE_URL}${r.path}`,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  // Kuratierte Set-Steckbriefe (redaktionelle Daten aus src/data/sets.ts)
  const setEntries: MetadataRoute.Sitemap = SETS.map((set) => ({
    url: `${BASE_URL}/lexikon/${set.id}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Kuratierte Minifiguren (redaktionelle Daten aus src/data/minifigs.ts)
  const figEntries: MetadataRoute.Sitemap = MINIFIGS.map((fig) => ({
    url: `${BASE_URL}/minifiguren/${fig.id}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // Redaktionelle Artikel (src/data/articles.ts)
  const articleEntries: MetadataRoute.Sitemap = ARTICLES.map((article) => ({
    url: `${BASE_URL}/artikel/${article.slug}`,
    lastModified: article.date,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  // Bewusst NICHT enthalten: die 27k+ Katalog-Sets und 17k+ Katalog-Figuren
  // (Rebrickable-Dump, /lexikon/{n} bzw. /minifiguren/fig-*). Die kommen in
  // Phase 2 per Sitemap-Splitting dazu (generateSitemaps, max. 50.000 URLs
  // pro Sitemap-Datei) - eine einzelne Sitemap würde sonst zu groß und die
  // kuratierten Seiten im Crawl-Budget untergehen.
  return [...staticEntries, ...setEntries, ...figEntries, ...articleEntries];
}
