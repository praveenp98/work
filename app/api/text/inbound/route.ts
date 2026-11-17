import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { handleInbound } from "@/lib/text/handler";
import { firstDelivery, parseInbound, sendText } from "@/lib/text/provider";

/**
 * LoopMessage webhook. In LoopMessage → API → Webhooks, set the URL to https://rocco.works/api/text/inbound and add a
 * custom header `Authorization: <TEXT_WEBHOOK_SECRET>`. Must answer 200 within 15s or LoopMessage retries.
 */
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.TEXT_WEBHOOK_SECRET;
  const got = req.headers.get("authorization");
  if (secret && got !== secret && got !== `Bearer ${secret}`) return NextResponse.json({ ok: false }, { status: 401 });
  if (!secret && process.env.NODE_ENV === "production") return NextResponse.json({ ok: false, error: "TEXT_WEBHOOK_SECRET not set" }, { status: 503 });

  const msg = parseInbound((await req.json().catch(() => ({}))) as Record<string, unknown>);
  if (!msg) return NextResponse.json({ ok: true, ignored: true }); // statuses, reactions, etc.
  if (!firstDelivery(msg.id)) return NextResponse.json({ ok: true, duplicate: true });
  const store = getStore();
  if (!store) return NextResponse.json({ ok: true, error: "memory not configured" });

  // Personal opt-in links carry the workspace link code → link automatically.
  const text = msg.linkCode ? `link ${msg.linkCode}` : msg.text || "hi";
  const reply = await handleInbound(store, msg.contact, text);
  const sent = await sendText(msg.contact, reply);
  return NextResponse.json({ ok: true, sent: sent.ok, dryRun: sent.dryRun });
}
