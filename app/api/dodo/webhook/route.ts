import { NextResponse } from "next/server";
import { getPriceState } from "@/lib/payments";

/**
 * Dodo webhook (payment.succeeded / refund events). The body is not trusted: it only triggers
 * a re-count of sales from Dodo's API and a price sync, which is idempotent.
 */
let last = 0;
export async function POST() {
  if (Date.now() - last < 2000) return NextResponse.json({ ok: true, throttled: true });
  last = Date.now();
  const s = await getPriceState({ fresh: true });
  return NextResponse.json({ ok: true, sold: s.sold, price: s.priceCents });
}
