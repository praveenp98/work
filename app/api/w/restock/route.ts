import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/access";
import { datadoeOn, runAction, waitForAction, findId } from "@/lib/datadoe";
import { checkItems, checkShipFrom, createPlan, explain, sendToAmazonUrl } from "@/lib/restock";
import { LIMIT_MSG, spend } from "@/lib/security";
import { getStore } from "@/lib/store";
import { approvedBy } from "@/lib/team";
import { trackServer } from "@/lib/track-server";
import { loadWorkspace } from "@/lib/workspace";

/**
 * One-tap restock (lib/restock.ts, docs/RESTOCK.md).
 *  { t, account, address }            save the ship-from address for that Amazon account
 *  { t, account, items }              create the FBA inbound plan in Amazon (dry run, then live, idempotent)
 *  { t, check: restockId }            re-read a plan Amazon was still creating
 *  { t, cancel: restockId }           cancel a plan Rocco created (only before a shipment is confirmed)
 */
export const maxDuration = 120;

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { t?: string; account?: string; address?: unknown; items?: unknown; check?: string; cancel?: string };
  const store = getStore();
  const ws = store && b.t ? await loadWorkspace(store, b.t) : null;
  if (!store || !ws) return NextResponse.json({ ok: false }, { status: 400 });
  if (!hasAccess(ws)) return NextResponse.json({ ok: false, error: "Hire Rocco to create shipments in Amazon." }, { status: 402 });
  if (!datadoeOn()) return NextResponse.json({ ok: false, error: "Connect Amazon first." }, { status: 400 });

  // Re-read or cancel an earlier plan.
  const id = b.check || b.cancel;
  if (id) {
    const r = ws.restocks?.find((x) => x.id === id);
    if (!r) return NextResponse.json({ ok: false, error: "I can't find that plan." }, { status: 404 });
    if (b.check) {
      if (r.status !== "pending") return NextResponse.json({ ok: true, restock: r });
      const done = await waitForAction(r.actionId, 2);
      if (done && !/FAIL|ERROR|REJECT/i.test(done.status)) { r.status = "created"; r.planId = findId(done.result, "inboundPlanId") ?? r.planId; }
      else if (done) { ws.restocks = ws.restocks!.filter((x) => x.id !== r.id); await store.saveWorkspace(ws); return NextResponse.json({ ok: false, error: explain(JSON.stringify(done.error ?? done.status)) }); }
      await store.saveWorkspace(ws);
      return NextResponse.json({ ok: true, restock: r });
    }
    if (r.status !== "created" || !r.planId) return NextResponse.json({ ok: false, error: "Amazon is still creating this plan. Try again in a minute." }, { status: 409 });
    if (!(await spend(store, ws, "writes", 1))) return NextResponse.json({ ok: false, error: LIMIT_MSG.writes }, { status: 429 });
    const res = await runAction(r.account, "AMAZON_FBA_INBOUND_PLANS_CANCEL", { path: { inboundPlanId: r.planId } }, { idempotencyKey: `rocco:${ws.id}:restock-cancel:${r.id}` });
    if (!res.ok) return NextResponse.json({ ok: false, error: `${explain(res.error ?? "")} If a shipment was already confirmed, cancel it in Seller Central (fees may apply outside Amazon's void window).` });
    r.status = "cancelled";
    await store.saveWorkspace(ws);
    return NextResponse.json({ ok: true, restock: r });
  }

  const account = ws.amazon?.accounts?.find((a) => a.id === b.account) ?? ws.amazon?.accounts?.[0];
  if (!account) return NextResponse.json({ ok: false, error: "Connect Amazon first." }, { status: 400 });

  // Save the ship-from address (owner or member).
  if (b.address !== undefined) {
    const a = checkShipFrom(b.address as never);
    if (!a.ok) return NextResponse.json({ ok: false, error: a.error }, { status: 400 });
    ws.shipFrom = { ...(ws.shipFrom ?? {}), [account.id]: a.value };
    await store.saveWorkspace(ws);
    if (b.items === undefined) return NextResponse.json({ ok: true });
  }

  const from = ws.shipFrom?.[account.id];
  if (!from) return NextResponse.json({ ok: false, needAddress: true, error: "Add the address you ship from first." }, { status: 400 });
  const items = checkItems(b.items);
  if (!items.ok) return NextResponse.json({ ok: false, error: items.error }, { status: 400 });

  // No double plans: a plan Rocco made for any of these SKUs in the last 7 days blocks a second one.
  const week = Date.now() - 7 * 86_400_000;
  const dup = (ws.restocks ?? []).find((x) => x.account === account.id && x.status !== "cancelled" && new Date(x.at).getTime() > week && x.items.some((i) => items.value.some((n) => n.sku === i.sku)));
  if (dup) return NextResponse.json({ ok: false, restock: dup, error: `There's already a plan for ${dup.items.map((i) => i.sku).join(", ")} from ${dup.at.slice(0, 10)}. Finish or cancel that one first.` }, { status: 409 });
  if (!(await spend(store, ws, "writes", 1))) return NextResponse.json({ ok: false, error: LIMIT_MSG.writes }, { status: 429 });

  const rid = randomUUID();
  const name = `Rocco restock ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  const out = await createPlan(account.id, account.country, from, items.value, `rocco:${ws.id}:restock:${items.value.map((i) => `${i.sku}x${i.qty}`).join(",")}`.slice(0, 120), name, (x) => waitForAction(x, 25));
  if (!out.ok) return NextResponse.json({ ok: false, error: out.error });
  const fresh = (await store.getWorkspaceById(ws.id)) ?? ws;
  const by = (await approvedBy(ws)).replace(" · approved by ", "") || undefined;
  const rec = { id: rid, account: account.id, at: new Date().toISOString(), by, actionId: out.actionId, planId: out.planId, status: out.pending ? "pending" as const : "created" as const, items: items.value, name };
  fresh.restocks = [rec, ...(fresh.restocks ?? [])].slice(0, 50);
  await store.saveWorkspace(fresh);
  trackServer(ws.id, "restock_plan_created", { skus: items.value.length, units: items.value.reduce((t, i) => t + i.qty, 0), pending: out.pending });
  return NextResponse.json({ ok: true, restock: rec, next: sendToAmazonUrl(account.country) });
}
