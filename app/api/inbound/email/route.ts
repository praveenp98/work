import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { fromPostmark, fromRaw, handleInbound } from "@/lib/inbox";
import { getStore } from "@/lib/store";

/**
 * Inbound report emails → Rocco. Two senders are supported:
 *  - Cloudflare Email Worker (workers/email-inbound.js): raw email, content-type message/rfc822, header x-rocco-to.
 *  - Postmark inbound webhook: JSON. Use https://rocco:SECRET@rocco.works/api/inbound/email as the webhook URL.
 * Auth: ROCCO_INBOUND_SECRET via x-rocco-inbound-secret header, basic-auth password, or ?key=.
 * Always answers 200 for authenticated calls (so the provider doesn't retry an email Rocco can't read).
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: Request): boolean {
  const secret = process.env.ROCCO_INBOUND_SECRET;
  if (!secret) return false;
  const h = req.headers;
  const basic = h.get("authorization")?.match(/^Basic (.+)$/i)?.[1];
  const fromBasic = basic ? Buffer.from(basic, "base64").toString().split(":").slice(1).join(":") : null;
  const given = h.get("x-rocco-inbound-secret") ?? fromBasic ?? new URL(req.url).searchParams.get("key") ?? "";
  const a = Buffer.from(given), b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const store = getStore();
  if (!store) return NextResponse.json({ ok: false, error: "no store" }, { status: 503 });
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > 30_000_000) return NextResponse.json({ ok: true, skipped: "too big" });
  const type = req.headers.get("content-type") ?? "";
  try {
    const mail = type.includes("application/json")
      ? fromPostmark((await req.json()) as Record<string, unknown>)
      : await fromRaw(new Uint8Array(await req.arrayBuffer()), req.headers.get("x-rocco-to") ?? undefined);
    const r = await handleInbound(store, mail);
    return NextResponse.json({ ok: true, team: !!r.ws, analyzed: r.analyzed, note: r.item?.note ?? null });
  } catch (e) {
    return NextResponse.json({ ok: true, error: e instanceof Error ? e.message.slice(0, 200) : "unreadable" });
  }
}
