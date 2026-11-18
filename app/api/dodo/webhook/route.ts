import { NextResponse } from "next/server";
import { syncBilling } from "@/lib/billing";
import { notifyTeam } from "@/lib/notify";
import { getPriceState } from "@/lib/payments";
import { dollars } from "@/lib/pricing";
import { getStore } from "@/lib/store";

/**
 * Dodo webhook (subscription.* and payment.* events). The body is not trusted: it only names a subscription or
 * payment, which lib/billing fetches from Dodo's API. Updates the team's trial/paid state, tells the team, and
 * re-syncs the price ladder (counts paying customers only).
 */
let last = 0;
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { type?: string; data?: { subscription_id?: string; payment_id?: string } };
  const store = getStore();
  let change: string | null = null;
  if (store && (body.data?.subscription_id || body.data?.payment_id)) {
    const r = await syncBilling(store, body);
    change = r.change;
    if (r.ws && r.change) {
      const price = await getPriceState({ fresh: true }).catch(() => null);
      const msg = {
        trial: "🎉 You're in. Everything's unlocked for the whole team. Text “brief” and let's get to work.",
        paid: `You hired me 🎉🦝 ${price ? `${dollars(price.priceCents)}/year` : "Yearly plan"} is active for your whole team. Text “brief” anytime.`,
        cancelled: "Done: your plan is cancelled and you won't be charged again. I'll keep working until the end of your current period.",
        ended: "Your Rocco is paused (the payment didn't go through). Start again anytime from your Rocco page.",
      }[r.change];
      await notifyTeam(store, r.ws, [msg]);
    }
  }
  if (Date.now() - last > 2000) {
    last = Date.now();
    await getPriceState({ fresh: true }).catch(() => null);
  }
  return NextResponse.json({ ok: true, change, unlocked: change === "trial" || change === "paid" });
}
