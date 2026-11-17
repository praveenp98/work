import { NextResponse } from "next/server";
import { getPriceState } from "@/lib/payments";

/** Current founding price + ladder position (cached ~60s). */
export async function GET() {
  return NextResponse.json(await getPriceState(), { headers: { "cache-control": "public, s-maxage=30, stale-while-revalidate=60" } });
}
