import { NextResponse } from "next/server";
import { datadoeOn } from "@/lib/datadoe";
import { syncAccount } from "@/lib/datadoe-sync";
import { getStore } from "@/lib/store";
import { loadWorkspace } from "@/lib/workspace";

/** "Check now": pull this team's Amazon data right away (at most once an hour; each pull spends DataDoe credits). */
export const maxDuration = 300;

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { t?: string };
  const store = getStore();
  const ws = store && b.t ? await loadWorkspace(store, b.t) : null;
  if (!store || !ws || !datadoeOn() || !ws.amazon?.accounts?.length) return NextResponse.json({ ok: false }, { status: 400 });
  const last = ws.amazon.lastSync?.at;
  if (last && Date.now() - new Date(last).getTime() < 3_600_000) return NextResponse.json({ ok: true, skipped: "checked in the last hour", lastSync: ws.amazon.lastSync });
  const results = [];
  for (const a of ws.amazon.accounts) results.push(await syncAccount(store, ws, a));
  const fresh = (await store.getWorkspaceById(ws.id)) ?? ws;
  const lastSync = { at: new Date().toISOString(), kinds: results.flatMap((r) => r.kinds), errors: results.flatMap((r) => r.errors) };
  fresh.amazon = { ...(fresh.amazon ?? { accounts: [] }), lastSync };
  await store.saveWorkspace(fresh);
  return NextResponse.json({ ok: true, lastSync });
}
