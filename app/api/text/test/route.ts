import { NextResponse } from "next/server";
import { secretOk } from "@/lib/security";
import { sendText, textingConfigured } from "@/lib/text/provider";

/** Owner-only test send: GET /api/text/test?to=+1555…  with header Authorization: Bearer <CRON_SECRET>. */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secretOk(req.headers.get("authorization")?.replace(/^Bearer\s+/i, ""), secret)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const to = new URL(req.url).searchParams.get("to");
  if (!to) return NextResponse.json({ ok: false, error: "add ?to=+1…" }, { status: 400 });
  const r = await sendText(to, "🦝 Rocco here. Test message from rocco.works. Reply “help” to see what I can do.");
  return NextResponse.json({ configured: textingConfigured(), ...r });
}
