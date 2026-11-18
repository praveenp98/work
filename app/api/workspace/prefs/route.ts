import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { loadWorkspace } from "@/lib/workspace";

/** Remember which AI the team uses (for the morning one-tap "run today's check" link). */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { t?: string; ai?: string };
  const store = getStore();
  const ws = store && b.t ? await loadWorkspace(store, b.t) : null;
  if (!store || !ws || !["claude", "chatgpt", "claude_code"].includes(b.ai ?? "")) return NextResponse.json({ ok: false }, { status: 400 });
  ws.ai = b.ai as "claude" | "chatgpt" | "claude_code";
  await store.saveWorkspace(ws);
  return NextResponse.json({ ok: true });
}
