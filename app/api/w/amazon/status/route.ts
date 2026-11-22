import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { loadWorkspace } from "@/lib/workspace";

/** Cheap check for the loading screen: has the first pull brought anything in yet? (no DataDoe calls) */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const t = new URL(req.url).searchParams.get("t") ?? "";
  const store = getStore();
  const ws = store && t ? await loadWorkspace(store, t) : null;
  if (!ws) return NextResponse.json({ ok: false }, { status: 400 });
  const s = ws.amazon?.lastSync;
  return NextResponse.json({ ok: true, ready: !!s?.kinds.length, at: s?.at ?? null, kinds: s?.kinds ?? [], errors: s?.errors ?? [] }, { headers: { "cache-control": "no-store" } });
}
