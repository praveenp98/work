import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/access";
import { getStore } from "@/lib/store";
import { loadWorkspace, setBrandSettings } from "@/lib/workspace";

/** Save the account's target ACoS and goal per product (lib/rules/settings.ts targetFor). Used from the next check on. */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { t?: string; brand?: string; targetAcos?: unknown; goals?: unknown; autoUndo?: unknown; autonomy?: unknown };
  const store = getStore();
  const ws = store && b.t ? await loadWorkspace(store, b.t) : null;
  if (!store || !ws) return NextResponse.json({ ok: false }, { status: 400 });
  if (!hasAccess(ws)) return NextResponse.json({ ok: false, error: "Hire Rocco to set goals." }, { status: 402 });
  const names = new Set([...Object.keys(ws.brands), ...(ws.amazon?.accounts ?? []).map((a) => a.name)]);
  const brand = typeof b.brand === "string" && names.has(b.brand) ? b.brand : Object.keys(ws.brands)[0] ?? "main";
  const t = Number(b.targetAcos);
  if (!Number.isFinite(t) || t < 0.05 || t > 1) return NextResponse.json({ ok: false, error: "Target ACoS should be between 5% and 100%." }, { status: 400 });
  const seen = new Set<string>();
  const goals = (Array.isArray(b.goals) ? b.goals : []).slice(0, 30).map((g) => g as { match?: unknown; goal?: unknown })
    .map((g) => ({ match: String(g.match ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, 40), goal: (g.goal === "profit" || g.goal === "growth" ? g.goal : "balance") as "profit" | "balance" | "growth" }))
    .filter((g) => g.match.length >= 2 && !seen.has(g.match.toLowerCase()) && seen.add(g.match.toLowerCase()));
  if (typeof b.autoUndo === "boolean") ws.autoUndo = b.autoUndo; // explicit, opt-in approval for automatic undos
  if (b.autonomy === "approve" || b.autonomy === "guardrails" || b.autonomy === "auto") { ws.autonomy = b.autonomy; ws.autonomySetAt = new Date().toISOString(); } // standing approval, logged
  await setBrandSettings(store, ws, brand, { targetAcos: Math.round(t * 1000) / 1000, goals });
  return NextResponse.json({ ok: true, goals });
}
