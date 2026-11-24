import { NextResponse } from "next/server";
import { clientIp } from "@/lib/human";
import { readUnsubscribeToken, unsubscribeEmail } from "@/lib/leads";
import { allowShared } from "@/lib/limits";

/**
 * Unsubscribe with a signed link, no login. The page /unsubscribe shows a button that posts here, so a mail
 * scanner opening the link doesn't unsubscribe anyone by accident. Also accepts one-click unsubscribe posts
 * from mail apps (List-Unsubscribe-Post) with the token in the query string.
 */
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const u = new URL(req.url);
  const form = await req.formData().catch(() => null);
  const token = String(form?.get("token") ?? u.searchParams.get("token") ?? "");
  if (!(await allowShared(`unsub:${clientIp(req.headers)}`, 20, 10 * 60_000))) return NextResponse.json({ ok: false }, { status: 429 });
  const email = readUnsubscribeToken(token);
  if (!email) return NextResponse.redirect(new URL("/unsubscribe?bad=1", req.url), 303);
  await unsubscribeEmail(email);
  return NextResponse.redirect(new URL(`/unsubscribe?token=${encodeURIComponent(token)}&done=1`, req.url), 303);
}
