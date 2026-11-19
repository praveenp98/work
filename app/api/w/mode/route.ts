import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { loadWorkspace } from "@/lib/workspace";

/** Switch how this team feeds Rocco: Claude + Amazon's connectors, or Amazon's scheduled report emails. */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { t?: string; mode?: string };
  const store = getStore();
  const ws = store && b.t ? await loadWorkspace(store, b.t) : null;
  if (!store || !ws || (b.mode !== "claude" && b.mode !== "reports")) return NextResponse.json({ ok: false }, { status: 400 });
  ws.mode = b.mode;
  await store.saveWorkspace(ws);
  return NextResponse.json({ ok: true, mode: ws.mode });
}
