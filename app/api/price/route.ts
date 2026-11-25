import { NextResponse } from "next/server";
import { getPriceState } from "@/lib/payments";

/** Current flat price + how many teams have paid (cached ~60s). No price ladder. */
export async function GET() {
  return NextResponse.json(await getPriceState(), { headers: { "cache-control": "public, s-maxage=30, stale-while-revalidate=60" } });
}
