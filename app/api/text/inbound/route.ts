import { NextResponse } from "next/server";
import { SITE } from "@/lib/site";
import { getStore } from "@/lib/store";
import { respond } from "@/lib/text/handler";
import { firstDelivery, parseInbound, sendText } from "@/lib/text/provider";

/**
 * LoopMessage webhook. In LoopMessage → API → Webhooks, set the URL to https://rocco.works/api/text/inbound and add a
 * custom header `Authorization: <TEXT_WEBHOOK_SECRET>`. Must answer 200 within 15s or LoopMessage retries.
 */
export const dynamic = "force-dynamic";
/** A dedicated Rocco number, if you have one. Shared lines differ per conversation, so then the card uses the line from the webhook. */
const DEDICATED_LINE = process.env.ROCCO_PHONE;

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
  const reply = await respond(store, msg.contact, text, new Date(), { attachments: msg.attachments });
  // Separate bubbles, like a person texting. Then Rocco's contact card (name + photo) on the first hello.
  let sent = { ok: true, dryRun: false };
  for (const [i, b] of reply.bubbles.entries()) {
    if (i) await new Promise((r) => setTimeout(r, 900));
    sent = await sendText(msg.contact, b);
  }
  // Only send the card when we know the exact number they texted: a card with the wrong number is worse than none.
  const line = DEDICATED_LINE ?? msg.line;
  if (reply.card && line) {
    await new Promise((r) => setTimeout(r, 900));
    await sendText(msg.contact, "Save me so you know it's me 👇", { mediaUrl: `${SITE.url}/card/${line.replace(/\D/g, "")}.vcf` });
  }
  return NextResponse.json({ ok: true, sent: sent.ok, dryRun: sent.dryRun, bubbles: reply.bubbles.length });
}
