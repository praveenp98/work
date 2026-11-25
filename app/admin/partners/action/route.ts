import { NextResponse } from "next/server";
import { adminCookieFromHeader, adminCookieOk } from "@/lib/events";
import { markPayoutPaid, setPartnerStatus } from "@/lib/partner-db";

/**
 * Owner-only actions from /admin/partners: approve (creates the code), pause, and mark a due payout as paid.
 * Same auth as /admin/funnel/booked (the admin cookie is SameSite=strict, so other sites can't post here).
 */
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!adminCookieOk(adminCookieFromHeader(req.headers.get("cookie")))) return NextResponse.json({ ok: false }, { status: 401 });
  const form = await req.formData().catch(() => null);
  const op = String(form?.get("op") ?? "");
  const id = Number(form?.get("id"));
  const back = (done: string) => NextResponse.redirect(new URL(`/admin/partners?done=${done}`, req.url), 303);
  if (!Number.isInteger(id) || id <= 0) return back("error");
  if (op === "approve" || op === "pause") {
    const p = await setPartnerStatus(id, op === "approve" ? "approved" : "paused");
    return back(p ? (op === "approve" ? "approved" : "paused") : "error");
  }
  if (op === "paid") {
    const r = await markPayoutPaid(id, Number(form?.get("amount")), String(form?.get("date") ?? ""));
    return back(r.ok ? "paid" : "error");
  }
  return back("error");
}
