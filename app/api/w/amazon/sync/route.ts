import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/access";
import { datadoeOn } from "@/lib/datadoe";
import { syncGroup } from "@/lib/datadoe-sync";
import { refreshManager } from "@/lib/manager";
import { LIMIT_MSG, spend } from "@/lib/security";
import { getStore } from "@/lib/store";
import { loadWorkspace } from "@/lib/workspace";

/**
 * "Check now": pull this team's Amazon data right away. Each pull spends DataDoe credits, so a pull that worked is
 * reused for an hour; a pull that failed (a table was off, Amazon hiccuped) can be retried after 2 minutes, because
 * the seller usually just fixed the cause.
 */
export const maxDuration = 300;

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { t?: string };
  const store = getStore();
  const ws = store && b.t ? await loadWorkspace(store, b.t) : null;
  if (!store || !ws || !datadoeOn() || !ws.amazon?.accounts?.length) return NextResponse.json({ ok: false }, { status: 400 });
  if (!hasAccess(ws)) return NextResponse.json({ ok: false, error: "Hire Rocco first, then connect your Amazon." }, { status: 402 });
  const last = ws.amazon.lastSync?.at;
  const wait = ws.amazon.lastSync?.errors?.length ? 120_000 : 3_600_000;
  const since = last ? Date.now() - new Date(last).getTime() : Infinity;
  if (since < wait) return NextResponse.json({ ok: true, skipped: true, retryInMin: Math.max(1, Math.ceil((wait - since) / 60_000)), failed: !!ws.amazon.lastSync?.errors?.length, lastSync: ws.amazon.lastSync });
  if (!(await spend(store, ws, "sync"))) return NextResponse.json({ ok: false, error: LIMIT_MSG.sync }, { status: 429 });
  const results = [...(await syncGroup(store, ws.amazon.accounts.map((a) => ({ wsId: ws.id, id: a.id, name: a.name, ads: a.ads })))).values()]; // one export per report for all of this team's accounts
  // syncGroup already saved each account's result (amazon.syncs) and the team-wide lastSync.
  const lastSync = { at: new Date().toISOString(), kinds: results.flatMap((r) => r.kinds), errors: results.flatMap((r) => r.errors) };
  if (results.length) await refreshManager(store, ws.id).catch(() => 0);
  return NextResponse.json({ ok: true, lastSync });
}
