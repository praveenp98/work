import { modeFor, regionFromRequest } from "@/lib/region";
import { NextResponse } from "next/server";
import { clientIp, fromOurSite, looksLikeBot } from "@/lib/human";
import { allowShared } from "@/lib/limits";
import { SITE } from "@/lib/site";
import { getStore } from "@/lib/store";
import { seal, unseal } from "@/lib/vault";
import { createWorkspace, ensureLinkCode, loadWorkspace, rememberToken } from "@/lib/workspace";

/**
 * "Hire Rocco" without Google sign-in (fallback): on a real tap, create the team's Rocco (or reuse the one this
 * browser already has), remember it in a sealed cookie, and send them to checkout tagged with that team (pay at signup),
 * or to their page if they already pay. The workspace key never goes to Dodo.
 */
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const h = req.headers;
  const why = h.get("x-rocco-tap") !== "1" ? "no tap" : !fromOurSite(h, SITE.domain) ? "not from rocco.works" : looksLikeBot(h);
  if (why) return NextResponse.json({ ok: false, error: why }, { status: 403 });
  if (!(await allowShared(`hire:${clientIp(h)}`, 6, 10 * 60_000))) return NextResponse.json({ ok: false, error: "Too many tries. Give it a minute." }, { status: 429 });
  const body = (await req.json().catch(() => ({}))) as { email?: unknown; plan?: unknown };
  const email = typeof body.email === "string" && /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/.test(body.email.trim()) ? body.email.trim().toLowerCase() : undefined;
  const store = getStore();
  if (!store) return NextResponse.json({ ok: false, url: "/pricing" });

  // Reuse this browser's Rocco if it has one (from a text link or an earlier tap), else make a new one.
  const cookie = h.get("cookie")?.match(/(?:^|;\s*)rocco_team=([^;]+)/)?.[1];
  let token = unseal(cookie ? decodeURIComponent(cookie) : undefined);
  let ws = token ? await loadWorkspace(store, token) : null;
  if (!ws) {
    const c = await createWorkspace(store);
    await rememberToken(store, c.ws, c.token);
    await ensureLinkCode(store, c.ws);
    token = c.token;
    ws = c.ws;
  }
  // A typed email is not proof of anything: it only prefills checkout. Ownership comes from Google sign-in.
  if (email && !ws.ownerEmail) ws.checkoutEmail = email;
  if (!ws.mode) ws.mode = modeFor(regionFromRequest(req)); // US: Claude; elsewhere: report inbox
  await store.saveWorkspace(ws);
  const res = NextResponse.json({ ok: true, url: `/w/${token}` /* unpaid: the plan step (HireCard), then checkout */ });
  const sealed = seal(token!);
  if (sealed) res.cookies.set("rocco_team", sealed, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 180 * 86_400 });
  return res;
}
