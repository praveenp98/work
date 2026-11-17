import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { handleInbound } from "@/lib/text/handler";
import { sendText } from "@/lib/text/provider";

/**
 * Inbound texts (LoopMessage webhook). Set the webhook's auth header to TEXT_WEBHOOK_SECRET.
 * Payload fields vary by provider; we read the sender from recipient/from/sender and the body from text/message.
 */
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.TEXT_WEBHOOK_SECRET;
  if (secret && req.headers.get("authorization") !== secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!secret && process.env.NODE_ENV === "production") return NextResponse.json({ ok: false, error: "TEXT_WEBHOOK_SECRET not set" }, { status: 503 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const type = String(body.alert_type ?? body.type ?? "message_inbound");
  if (!/inbound|received|message$/.test(type)) return NextResponse.json({ ok: true, ignored: type });
  const from = String(body.recipient ?? body.from ?? body.sender ?? body.number ?? "");
  const text = String(body.text ?? body.message ?? body.body ?? "").slice(0, 2000);
  if (!from || !text.trim()) return NextResponse.json({ ok: true, ignored: "empty" });
  const store = getStore();
  if (!store) return NextResponse.json({ ok: false, error: "memory not configured" }, { status: 503 });
  const reply = await handleInbound(store, from, text);
  const sent = await sendText(from, reply);
  return NextResponse.json({ ok: sent.ok, dryRun: sent.dryRun });
}
