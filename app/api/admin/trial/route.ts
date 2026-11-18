import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { loadWorkspace } from "@/lib/workspace";

/**
 * Owner-only test helper: give a workspace a 3-day trial without a payment, to see the full dashboard.
 * GET /api/admin/trial?t=<workspace key>&key=<CRON_SECRET>  (&days=N, &off=1 to remove). Redirects to the page.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const secret = process.env.CRON_SECRET ?? "";
  const key = u.searchParams.get("key") ?? "";
  const ok = !!secret && key.length === secret.length && timingSafeEqual(Buffer.from(key), Buffer.from(secret));
  if (!ok) return NextResponse.json({ ok: false }, { status: 401 });
  const store = getStore();
  const t = u.searchParams.get("t") ?? "";
  const ws = store ? await loadWorkspace(store, t) : null;
  if (!store || !ws) return NextResponse.json({ ok: false, error: "unknown workspace" }, { status: 404 });
  const days = Math.min(30, Math.max(1, Number(u.searchParams.get("days") ?? 3)));
  ws.trialEndsAt = u.searchParams.get("off") ? undefined : new Date(Date.now() + days * 86_400_000).toISOString();
  ws.nudges = { ...(ws.nudges ?? {}), testTrial: new Date().toISOString() };
  await store.saveWorkspace(ws);
  return NextResponse.redirect(new URL(`/w/${t}`, req.url), 302);
}
