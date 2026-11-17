import { NextResponse } from "next/server";
import { getPriceState, verifiedPurchase } from "@/lib/payments";
import { getStore } from "@/lib/store";
import { sendText } from "@/lib/text/provider";

/**
 * Dodo webhook (payment.succeeded / refund events). The body is not trusted:
 *  1. it triggers a re-count of sales from Dodo's API and a price sync (idempotent);
 *  2. if it names a payment, Rocco fetches that payment from Dodo's API, and when it's a real, succeeded purchase
 *     made from Rocco's own checkout link (metadata ref = workspace id), unlocks that workspace and tells the team.
 */
let last = 0;
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { type?: string; data?: { payment_id?: string } };
  let unlocked = false;
  const paymentId = body?.data?.payment_id;
  if (paymentId && (!body.type || body.type.startsWith("payment."))) {
    const buy = await verifiedPurchase(String(paymentId));
    const store = getStore();
    if (buy && store) {
      const ws = await store.getWorkspaceById(buy.ref);
      if (ws && !ws.licensed) {
        ws.licensed = true;
        ws.licenseKey = ws.licenseKey ?? `payment:${paymentId}`;
        await store.saveWorkspace(ws);
        unlocked = true;
        const team = await store.listPhones({ workspaceId: ws.id, optedIn: true });
        for (const p of team) await sendText(p.phone, "You hired me 🎉🦝 Every fix is unlocked for your whole team. Text “brief” and let's get to work.");
      }
    }
  }
  if (Date.now() - last > 2000) {
    last = Date.now();
    await getPriceState({ fresh: true });
  }
  return NextResponse.json({ ok: true, unlocked });
}
