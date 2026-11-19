import { NextResponse } from "next/server";
import { inboxAddress } from "@/lib/inbox";
import { getStore } from "@/lib/store";
import { loadWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";

/** The team's report inbox: address + the last emails that landed (for the live setup checklist). */
export async function GET(req: Request) {
  const t = new URL(req.url).searchParams.get("t") ?? "";
  const store = getStore();
  const ws = store && t ? await loadWorkspace(store, t) : null;
  if (!store || !ws) return NextResponse.json({ ok: false }, { status: 404 });
  return NextResponse.json({ ok: true, address: await inboxAddress(store, ws), inbox: ws.inbox ?? [], reportsAt: ws.reportsAt ?? null }, { headers: { "cache-control": "no-store" } });
}
