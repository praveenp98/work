import { after, NextResponse } from "next/server";
import { fromSlack, postSlack, teamKey, userKey, verifySlack } from "@/lib/slack";
import { getStore } from "@/lib/store";
import { respond } from "@/lib/text/handler";
import { firstDelivery } from "@/lib/text/provider";

/**
 * Slack Events API: @Rocco mentions in channels and DMs to Rocco. Same brain as iMessage. Slack needs a 200
 * within 3s, so the reply is posted after the response (next/server `after`).
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface SlackEvent { type: string; user?: string; text?: string; channel?: string; channel_type?: string; ts?: string; thread_ts?: string; bot_id?: string; subtype?: string }

export async function POST(req: Request) {
  const raw = await req.text();
  const body = JSON.parse(raw || "{}") as { type?: string; challenge?: string; team_id?: string; event_id?: string; event?: SlackEvent };
  if (!verifySlack(req.headers, raw)) return NextResponse.json({ ok: false }, { status: 401 });
  if (body.type === "url_verification") return NextResponse.json({ challenge: body.challenge });
  const e = body.event;
  const team = body.team_id;
  if (body.type !== "event_callback" || !e || !team || !e.user || e.bot_id || e.subtype) return NextResponse.json({ ok: true, ignored: true });
  const dm = e.type === "message" && e.channel_type === "im";
  if (e.type !== "app_mention" && !dm) return NextResponse.json({ ok: true, ignored: true });
  if (!firstDelivery(body.event_id ?? `${team}:${e.ts}`)) return NextResponse.json({ ok: true, duplicate: true });

  after(async () => {
    const store = getStore();
    if (!store) return;
    const linkRow = await store.getPhone(teamKey(team));
    const ws = linkRow ? await store.getWorkspaceById(linkRow.workspaceId) : null;
    if (!ws?.slack) return;
    const who = userKey(team, e.user!);
    if (!(await store.getPhone(who))) await store.savePhone({ phone: who, workspaceId: ws.id, optedOut: false, createdAt: new Date().toISOString() });
    const reply = await respond(store, who, fromSlack(e.text ?? "") || "help");
    const text = reply.bubbles.join("\n\n");
    await postSlack(ws.slack, text, { channel: e.channel, threadTs: dm ? undefined : e.thread_ts ?? e.ts });
  });
  return NextResponse.json({ ok: true });
}
