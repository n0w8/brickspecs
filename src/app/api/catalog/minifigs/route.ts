import { NextRequest, NextResponse } from "next/server";
import { figMeta, searchFigs } from "@/lib/minifig-catalog";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  if (sp.get("meta") === "1") {
    return NextResponse.json(figMeta());
  }

  const num = (key: string) => {
    const v = sp.get(key);
    if (!v) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  const result = searchFigs({
    q: sp.get("q") ?? undefined,
    page: num("page"),
    pageSize: num("pageSize"),
  });

  return NextResponse.json(result);
}
