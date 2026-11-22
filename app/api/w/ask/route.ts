import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/access";
import { brainOn } from "@/lib/brain";
import { allow } from "@/lib/human";
import { askAccount } from "@/lib/manager";
import { getStore } from "@/lib/store";
import { loadWorkspace } from "@/lib/workspace";

/** "Ask Rocco" box on the dashboard. Paying teams, 40 questions a day per team. */
export const maxDuration = 60;

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { t?: string; q?: unknown; brand?: string };
  const store = getStore();
  const ws = store && b.t ? await loadWorkspace(store, b.t) : null;
  const q = typeof b.q === "string" ? b.q.trim().slice(0, 500) : "";
  if (!store || !ws || q.length < 2) return NextResponse.json({ ok: false }, { status: 400 });
  if (!hasAccess(ws)) return NextResponse.json({ ok: false, error: "Hire Rocco to ask about your account." }, { status: 402 });
  if (!brainOn()) return NextResponse.json({ ok: false, error: "I can't answer questions here yet. Try again soon." }, { status: 503 });
  if (!allow(`ask:${ws.id}`, 40, 86_400_000)) return NextResponse.json({ ok: false, error: "That's a lot of questions today. Ask me again tomorrow." }, { status: 429 });
  const answer = await askAccount(store, ws, q, b.brand);
  if (!answer) return NextResponse.json({ ok: false, error: "I couldn't answer that just now. Try again in a minute." }, { status: 502 });
  return NextResponse.json({ ok: true, answer });
}
