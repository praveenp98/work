import { NextResponse } from "next/server";
import { allow, clientIp, fromOurSite, looksLikeBot } from "@/lib/human";
import { SITE } from "@/lib/site";
import { getStore } from "@/lib/store";
import { seal, unseal } from "@/lib/vault";
import { createWorkspace, ensureLinkCode, loadWorkspace, rememberToken } from "@/lib/workspace";

/**
 * "Hire Rocco" without Google sign-in (fallback): on a real tap, create the team's Rocco (or reuse the one this
 * browser already has), remember it in a sealed cookie, and open its page: set up, see the first real finding,
 * then pay (hireUrl on that page). The workspace key never goes to Dodo.
 */
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const h = req.headers;
  const why = h.get("x-rocco-tap") !== "1" ? "no tap" : !fromOurSite(h, SITE.domain) ? "not from rocco.works" : looksLikeBot(h);
  if (why) return NextResponse.json({ ok: false, error: why }, { status: 403 });
  if (!allow(`hire:${clientIp(h)}`, 6, 10 * 60_000)) return NextResponse.json({ ok: false, error: "Too many tries. Give it a minute." }, { status: 429 });
  const body = (await req.json().catch(() => ({}))) as { email?: unknown };
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
  if (email && ws.ownerEmail !== email) { ws.ownerEmail = email; await store.saveWorkspace(ws); }
  // First finding before payment: open the team's page (setup), checkout comes after Rocco has found something real.
  const res = NextResponse.json({ ok: true, url: `/w/${token}` });
  const sealed = seal(token!);
  if (sealed) res.cookies.set("rocco_team", sealed, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 180 * 86_400 });
  return res;
}
