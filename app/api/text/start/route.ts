import { NextResponse } from "next/server";
import { optInLinks } from "@/lib/text/provider";

/**
 * Homepage box "Rocco, help me with ___" → an iMessage link whose first text already says it.
 * LoopMessage needs its short opt-in code in the message; Rocco strips it when it arrives.
 */
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { q?: unknown };
  const q = String(b.q ?? "").replace(/[\[\]<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 90);
  const body = q ? `Hey Rocco 👋 Help me with ${q} [opt-in-code]` : "Hey Rocco 👋 Show me what you can do [opt-in-code]";
  const l = await optInLinks({ body }).catch(() => null);
  const url = l?.url || l?.imessage || process.env.ROCCO_OPTIN_URL || null;
  return NextResponse.json({ ok: !!url, url });
}
