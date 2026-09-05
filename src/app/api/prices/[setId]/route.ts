import { NextRequest, NextResponse } from "next/server";
import { COUNTRIES, getPrices, type PriceSource } from "@/lib/prices";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ setId: string }> }
) {
  const { setId } = await ctx.params;
  const sp = req.nextUrl.searchParams;

  const sourceParam = sp.get("source");
  const source: PriceSource = sourceParam === "ebay-sold" ? "ebay-sold" : "bricklink";

  const countryParam = (sp.get("country") ?? "DE").toUpperCase();
  const country = COUNTRIES.some((c) => c.code === countryParam) ? countryParam : "DE";

  const result = await getPrices(setId, source, country);
  // Preise werden einmal taeglich per GitHub Action aktualisiert - die Antwort darf am
  // Vercel-Rand 6 Stunden liegen. Wiederholte Aufrufe kosten dann keine Funktionszeit.
  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" },
  });
}
