import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/access";
import { datadoeOn } from "@/lib/datadoe";
import { syncGroup } from "@/lib/datadoe-sync";
import { refreshManager } from "@/lib/manager";
import { getStore } from "@/lib/store";
import { loadWorkspace } from "@/lib/workspace";

/** "Check now": pull this team's Amazon data right away (at most once an hour; each pull spends DataDoe credits). */
export const maxDuration = 300;

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { t?: string };
  const store = getStore();
  const ws = store && b.t ? await loadWorkspace(store, b.t) : null;
  if (!store || !ws || !datadoeOn() || !ws.amazon?.accounts?.length) return NextResponse.json({ ok: false }, { status: 400 });
  if (!hasAccess(ws)) return NextResponse.json({ ok: false, error: "Hire Rocco first, then connect your Amazon." }, { status: 402 });
  const last = ws.amazon.lastSync?.at;
  if (last && Date.now() - new Date(last).getTime() < 3_600_000) return NextResponse.json({ ok: true, skipped: "checked in the last hour", lastSync: ws.amazon.lastSync });
  const results = [...(await syncGroup(store, ws.amazon.accounts.map((a) => ({ wsId: ws.id, id: a.id, name: a.name })))).values()]; // one export per report for all of this team's accounts
  const lastSync = { at: new Date().toISOString(), kinds: results.flatMap((r) => r.kinds), errors: results.flatMap((r) => r.errors) };
  const fresh = (await store.getWorkspaceById(ws.id)) ?? ws;
  fresh.amazon = { ...(fresh.amazon ?? { accounts: [] }), lastSync };
  await store.saveWorkspace(fresh);
  if (results.length) await refreshManager(store, ws.id).catch(() => 0);
  return NextResponse.json({ ok: true, lastSync });
}
