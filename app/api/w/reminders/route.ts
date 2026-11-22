import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/access";
import { getStore } from "@/lib/store";
import { loadWorkspace } from "@/lib/workspace";

/**
 * Reminder settings (paying teams only): how often Rocco nudges them on iMessage / WhatsApp / Slack, and whether
 * they can approve fixes right in the message. Approve-by-text unlocks only after they've seen their jobs on the
 * dashboard once, so nobody approves changes they never looked at.
 */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { t?: string; cadence?: unknown; weekday?: unknown; channel?: unknown; approveByText?: unknown; style?: unknown };
  const store = getStore();
  const ws = store && b.t ? await loadWorkspace(store, b.t) : null;
  if (!store || !ws) return NextResponse.json({ ok: false }, { status: 400 });
  if (!hasAccess(ws)) return NextResponse.json({ ok: false, error: "Reminders come with your plan." }, { status: 402 });
  const cadence = b.cadence === "weekly" || b.cadence === "off" ? b.cadence : "daily";
  const channel = b.channel === "whatsapp" || b.channel === "slack" || b.channel === "imessage" ? b.channel : ws.reminders?.channel;
  const weekday = typeof b.weekday === "number" && b.weekday >= 0 && b.weekday <= 6 ? b.weekday : 1;
  // Approve-by-text only after they've reviewed their jobs on the site once (nobody approves what they never saw).
  const wanted = b.style === "approve" || b.approveByText === true ? "approve" : b.style === "top3" ? "top3" : "nudge";
  const style = wanted === "approve" && !ws.seenJobsAt ? "nudge" : wanted;
  const approveByText = style === "approve";
  ws.reminders = { cadence, weekday: cadence === "weekly" ? weekday : undefined, channel, approveByText, style, setAt: new Date().toISOString() };
  await store.saveWorkspace(ws);
  return NextResponse.json({ ok: true, reminders: ws.reminders, approveLocked: b.approveByText === true && !ws.seenJobsAt });
}
