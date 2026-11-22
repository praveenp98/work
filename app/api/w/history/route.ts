import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/access";
import { datadoeOn } from "@/lib/datadoe";
import { importHistory } from "@/lib/history";
import { LIMIT_MSG, spend } from "@/lib/security";
import { getStore } from "@/lib/store";
import { loadWorkspace } from "@/lib/workspace";

/**
 * "Before Rocco": read Amazon's change history for an account once (runs on its own at connect; this is the
 * button for accounts connected before it existed). 4 DataDoe tokens + one short Claude call, never repeated.
 */
export const maxDuration = 300;

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { t?: string; account?: string };
  const store = getStore();
  const ws = store && b.t ? await loadWorkspace(store, b.t) : null;
  if (!store || !ws) return NextResponse.json({ ok: false }, { status: 400 });
  if (!hasAccess(ws)) return NextResponse.json({ ok: false, error: "Hire Rocco to read your account's history." }, { status: 402 });
  const account = ws.amazon?.accounts?.find((a) => a.id === b.account) ?? ws.amazon?.accounts?.[0];
  if (!datadoeOn() || !account) return NextResponse.json({ ok: false, error: "Connect your Amazon first." }, { status: 400 });
  if (!ws.history?.[account.id] && !(await spend(store, ws, "history"))) return NextResponse.json({ ok: false, error: LIMIT_MSG.history }, { status: 429 });
  try {
    const h = await importHistory(store, ws.id, account);
    return NextResponse.json({ ok: true, total: h?.summary.total ?? 0 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: `I couldn't read Amazon's change history yet (${e instanceof Error ? e.message.slice(0, 120) : "DataDoe"}). Amazon may still be sending it; try again in an hour.` }, { status: 502 });
  }
}
