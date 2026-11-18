import { NextResponse } from "next/server";
import { benchmark } from "@/lib/rules/benchmarks";
import { getStore } from "@/lib/store";
import { dailyNumbers } from "@/lib/text/daily";
import { sendText } from "@/lib/text/provider";
import { buildBrief } from "@/lib/workspace";
import { getPriceState } from "@/lib/payments";
import { paywall } from "@/lib/paywall";
import { postSlack } from "@/lib/slack";

/** Morning numbers to every linked, opted-in teammate. Vercel Cron calls this (see vercel.json). */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ ok: false }, { status: 401 });
  if (!secret && process.env.NODE_ENV === "production") return NextResponse.json({ ok: false, error: "CRON_SECRET not set" }, { status: 503 });
  const store = getStore();
  if (!store) return NextResponse.json({ ok: false, error: "memory not configured" }, { status: 503 });
  const phones = await store.listPhones({ optedIn: true });
  const byWs = new Map<string, string[]>();
  // Phones get texts; a "slack-team:" row means the workspace also gets the morning post in Slack.
  for (const p of phones) if (p.phone.startsWith("+") || p.phone.startsWith("slack-team:")) byWs.set(p.workspaceId, [...(byWs.get(p.workspaceId) ?? []), p.phone]);
  let sent = 0, failed = 0;
  for (const [wsId, list] of byWs) {
    const ws = await store.getWorkspaceById(wsId);
    if (!ws) continue;
    const b = await buildBrief(store, ws);
    if (!b.perBrand.some((x) => x.trends.length)) continue; // nothing plugged in yet: no empty "numbers" text
    const snap = b.perBrand[0]?.trends.find((t) => t.kind === "sp_search_term")?.latest;
    const bench = snap ? benchmark("sp_search_term", snap.stats, await store.peerStats("sp_search_term", ws.id)).lines : undefined;
    const msg = dailyNumbers(b, { bench, pending: ws.pending });
    // Paywall moment "found" (every 3 days at most, only when fixes are locked).
    const pay = paywall(ws, b, "found", { price: await getPriceState().catch(() => null) });
    if (pay) await store.saveWorkspace(ws);
    for (const to of list) {
      if (to.startsWith("slack-team:")) {
        if (ws.slack) (await postSlack(ws.slack, pay ? `${msg}\n\n${pay.text} ${pay.url}` : msg)) ? sent++ : failed++;
        continue;
      }
      (await sendText(to, msg)).ok ? sent++ : failed++;
      if (pay) { await sendText(to, pay.text); await sendText(to, pay.url); }
    }
  }
  return NextResponse.json({ ok: true, workspaces: byWs.size, sent, failed });
}
