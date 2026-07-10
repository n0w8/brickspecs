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
  return NextResponse.json(result);
}
