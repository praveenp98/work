import { NextResponse } from "next/server";
import { secretOk } from "@/lib/security";
import { benchmark } from "@/lib/rules/benchmarks";
import { getStore } from "@/lib/store";
import { dailyNumbers } from "@/lib/text/daily";
import { sendText } from "@/lib/text/provider";
import { buildBrief } from "@/lib/workspace";
import { getPriceState } from "@/lib/payments";
import { paywall } from "@/lib/paywall";
import { postSlack } from "@/lib/slack";
import { morningNudge, notifyTeam } from "@/lib/notify";
import { hasAccess, trialHoursLeft } from "@/lib/access";
import { dollars } from "@/lib/pricing";

/** Morning numbers to every linked, opted-in teammate. Vercel Cron calls this (see vercel.json). */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && !secretOk(req.headers.get("authorization")?.replace(/^Bearer\s+/i, ""), secret)) return NextResponse.json({ ok: false }, { status: 401 });
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
    // Amazon connected directly: the morning message comes from the daily pull (lib/datadoe-sync tellTeam), which
    // follows the team's reminder settings. Nothing from this older Claude-bridge job.
    if (ws.amazon?.accounts?.length || ws.reminders?.cadence === "off") continue;
    // Trial ends within a day: say so once, with the price and how to cancel (avoids surprise charges/chargebacks).
    const left = trialHoursLeft(ws);
    if (left !== null && left <= 30 && !ws.nudges?.trialEnd) {
      const price = await getPriceState().catch(() => null);
      ws.nudges = { ...(ws.nudges ?? {}), trialEnd: new Date().toISOString() };
      await store.saveWorkspace(ws);
      sent += await notifyTeam(store, ws, [`⏰ Your free trial ends tomorrow. Then your plan renews automatically for the whole team. Want to stop? Reply CANCEL.`]);
    }
    // No trial or plan: no numbers. A teaser + trial link at most 3 times (2+ days apart), or the setup reminder.
    if (!hasAccess(ws)) {
      const latestAt = (await store.listSnapshots(ws.id, { limit: 1 }))[0]?.createdAt ?? null;
      if (latestAt) {
        const b0 = await buildBrief(store, ws);
        const n = Number(ws.nudges?.teaseCount ?? 0);
        const pay = n < 3 ? paywall(ws, b0, "found", { price: await getPriceState().catch(() => null) }) : null;
        if (pay) {
          ws.nudges = { ...(ws.nudges ?? {}), teaseCount: String(n + 1) };
          await store.saveWorkspace(ws);
          sent += await notifyTeam(store, ws, [pay.text, pay.url]);
        }
      } else {
        const nudge0 = morningNudge(ws, null);
        if (nudge0) { await store.saveWorkspace(ws); sent += await notifyTeam(store, ws, nudge0); }
      }
      continue;
    }
    // Already pushed today (the team's check ran and numbers went out the moment they landed).
    if (ws.lastPushDay === new Date().toISOString().slice(0, 10)) continue;
    const latest = (await store.listSnapshots(ws.id, { limit: 1 }))[0]?.createdAt ?? null;
    const nudge = morningNudge(ws, latest);
    if (nudge && (!latest || new Date(latest).getTime() < Date.now() - 20 * 3600_000)) {
      // No check today: one-tap link to run it (or a setup reminder). Numbers follow the moment it runs.
      await store.saveWorkspace(ws);
      sent += await notifyTeam(store, ws, nudge);
      continue;
    }
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
