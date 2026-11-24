import { NextResponse } from "next/server";
import { clientIp } from "@/lib/human";
import { allowShared } from "@/lib/limits";
import { verifyStandardWebhook } from "@/lib/security";
import { syncBilling } from "@/lib/billing";
import { recordPaid } from "@/lib/events";
import { notifyTeam } from "@/lib/notify";
import { getPriceState } from "@/lib/payments";
import { dollars } from "@/lib/pricing";
import { getStore } from "@/lib/store";
import { teamUrl } from "@/lib/workspace";
import { hasAccess } from "@/lib/access";

/**
 * Dodo webhook (subscription.* and payment.* events). The body is not trusted: it only names a subscription or
 * payment, which lib/billing fetches from Dodo's API. Updates the team's trial/paid state, tells the team, and
 * re-syncs the price ladder (counts paying customers only).
 */
let last = 0;
export async function POST(req: Request) {
  // Signed by Dodo (Standard Webhooks) when DODO_WEBHOOK_SECRET is set. Even unsigned, a forged body can't unlock
  // anything: lib/billing only trusts what Dodo's API returns for the ids named here.
  const raw = await req.text();
  const secret = process.env.DODO_WEBHOOK_SECRET;
  if (secret && !verifyStandardWebhook(secret, req.headers, raw)) return NextResponse.json({ ok: false }, { status: 401 });
  if (!secret && !(await allowShared(`dodo:${clientIp(req.headers)}`, 30, 60_000))) return NextResponse.json({ ok: false }, { status: 429 });
  let body: { type?: string; data?: { subscription_id?: string; payment_id?: string } } = {};
  try { body = JSON.parse(raw); } catch { /* empty */ }
  const store = getStore();
  let change: string | null = null;
  if (store && (body.data?.subscription_id || body.data?.payment_id)) {
    const r = await syncBilling(store, body);
    change = r.change;
    // Funnel only (lib/events.ts): note that this team paid, once. Reads billing's answer, changes nothing, never throws.
    if (r.ws && (r.change === "paid" || (!r.change && hasAccess(r.ws) && r.ws.licensed))) await recordPaid(r.ws.id);
    // /welcome often confirms the payment before the webhook lands (then change is null): still say hello, once.
    if (r.ws && !r.change && hasAccess(r.ws) && !r.ws.hiredNotifiedAt && r.ws.licensed) r.change = "paid";
    if (r.ws && r.change) {
      if (r.change === "paid") { if (r.ws.hiredNotifiedAt) r.change = null; else { r.ws.hiredNotifiedAt = new Date().toISOString(); await store.saveWorkspace(r.ws); } }
    }
    if (r.ws && r.change) {
      const price = await getPriceState({ fresh: true }).catch(() => null);
      const msg = {
        trial: `🎉 You're in. Connect your Amazon here and I'll start: ${teamUrl(r.ws)}`,
        paid: `You hired me 🎉🦝 Next: connect your Amazon (2 minutes) and I start reading. Your Rocco: ${teamUrl(r.ws)}`,
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
