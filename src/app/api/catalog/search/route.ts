import { NextRequest, NextResponse } from "next/server";
import {
  catalogMeta,
  searchCatalog,
  type CatalogSortKey,
} from "@/lib/catalog";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  if (sp.get("meta") === "1") {
    return NextResponse.json(catalogMeta());
  }

  const num = (key: string) => {
    const v = sp.get(key);
    if (!v) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  const result = searchCatalog({
    q: sp.get("q") ?? undefined,
    theme: sp.get("theme") ?? undefined,
    yearFrom: num("yearFrom"),
    yearTo: num("yearTo"),
    sort: (sp.get("sort") as CatalogSortKey | null) ?? undefined,
    page: num("page"),
    pageSize: num("pageSize"),
  });

  return NextResponse.json(result);
}
