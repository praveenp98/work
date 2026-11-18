import { after } from "next/server";
import { getPriceState } from "./payments";
import { paywall } from "./paywall";
import { postSlack } from "./slack";
import type { Store, Workspace } from "./store/types";
import { dailyNumbers } from "./text/daily";
import { sendText } from "./text/provider";
import { buildBrief, revealToken } from "./workspace";

/**
 * The Claude bridge: the team's AI pulls Amazon data through Amazon's connectors into Rocco; Rocco pushes it to
 * the team (iMessage + Slack). Three moments:
 *  - first use: the first time their AI calls Rocco → "🔔 I'm on!"
 *  - fresh check: the first completed check of the day (rocco_brief after analyses) → numbers pushed right away
 *  - stale morning: no check yet today → one-tap link that opens their AI with "Rocco, morning check" typed
 */
export type AiApp = "claude" | "chatgpt" | "claude_code";
export const ASK = "Rocco, morning check";
export const askLink = (ai?: AiApp) => (ai === "chatgpt" ? `https://chatgpt.com/?q=${encodeURIComponent(ASK)}` : ai === "claude_code" ? null : `https://claude.ai/new?q=${encodeURIComponent(ASK)}`);
const today = (d = new Date()) => d.toISOString().slice(0, 10);

/** Run after the response when inside a request (Next `after`), right away otherwise (tests, scripts). */
export function later(fn: () => Promise<unknown>) {
  try { after(fn); } catch { void fn(); }
}

/** Text every opted-in phone on the team and post to their Slack channel. */
export async function notifyTeam(store: Store, ws: Workspace, bubbles: string[]): Promise<number> {
  let n = 0;
  const phones = (await store.listPhones({ workspaceId: ws.id, optedIn: true })).filter((p) => p.phone.startsWith("+"));
  for (const p of phones) for (const b of bubbles) if ((await sendText(p.phone, b)).ok) n++;
  if (ws.slack && (await postSlack(ws.slack, bubbles.join("\n\n")))) n++;
  return n;
}

/** First time the team's AI uses Rocco: the bing. */
export async function onFirstUse(store: Store, ws: Workspace, now = new Date()) {
  if (ws.connectedAt) return false;
  ws.connectedAt = now.toISOString();
  await store.saveWorkspace(ws);
  await notifyTeam(store, ws, [`🔔 I'm on! Your AI just connected to me. Say “${ASK}” there and I'll text everyone what I find.`]);
  return true;
}

/** A finished check (brief after analyses): push today's numbers to the team once a day, the moment they exist. */
export async function onFreshCheck(store: Store, ws: Workspace, now = new Date()) {
  const fresh = (await store.listSnapshots(ws.id, { limit: 1 }))[0];
  if (!fresh || fresh.createdAt.slice(0, 10) !== today(now) || ws.lastPushDay === today(now)) return false;
  const first = !ws.firstDataAt;
  ws.lastPushDay = today(now);
  ws.firstDataAt = ws.firstDataAt ?? now.toISOString();
  ws.connectedAt = ws.connectedAt ?? now.toISOString();
  const b = await buildBrief(store, ws, now);
  const pay = paywall(ws, b, "found", { now, price: await getPriceState().catch(() => null) });
  await store.saveWorkspace(ws);
  await notifyTeam(store, ws, [
    ...(first ? ["✅ Amazon is connected. Here's my first check 🦝"] : []),
    dailyNumbers(b, { now, pending: ws.pending }),
    ...(pay ? [pay.text, pay.url] : []),
  ]);
  return true;
}

/** The morning text when no check ran yet today (or nothing is connected yet). Null = nothing to say. */
export function morningNudge(ws: Workspace, latestAt: string | null, now = new Date()): string[] | null {
  if (latestAt && latestAt.slice(0, 10) === today(now)) return null;
  if (!ws.connectedAt && !latestAt) {
    // Not connected: remind at most 3 times, 2 days apart.
    const n = Number(ws.nudges?.setupCount ?? 0);
    const last = ws.nudges?.setup;
    if (n >= 3 || (last && now.getTime() - new Date(last).getTime() < 2 * 86_400_000)) return null;
    ws.nudges = { ...(ws.nudges ?? {}), setup: now.toISOString(), setupCount: String(n + 1) };
    const t = revealToken(ws);
    return ["Morning ☀️ Want me on your Amazon? Connect once in Claude or ChatGPT, 2 minutes, and I'll text your numbers every day 👇", t ? `https://rocco.works/w/${t}` : "https://rocco.works/setup"];
  }
  if (!ws.connectedAt) return null; // data came from texted reports, not their AI: just send the numbers we have
  const link = askLink(ws.ai);
  return link
    ? ["Morning ☀️ Tap to run today's check. I'll text everyone the numbers right after 👇", link]
    : [`Morning ☀️ Run /morning-check in Claude Code and I'll text everyone the numbers right after.`];
}
