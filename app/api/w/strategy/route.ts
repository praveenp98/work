import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/access";
import { getStore } from "@/lib/store";
import { breakevenFromMargin, strategyLines } from "@/lib/strategy";
import { brandSettings, loadWorkspace, setBrandSettings } from "@/lib/workspace";

/**
 * Save the owner's strategy for one account (lib/strategy.ts): main goal, target ACoS, margin → break-even, monthly ad
 * budget ceiling, never-cut list, goal per product, autonomy, notes. Used from the next check on; returns the plan lines.
 */
const clean = (v: unknown, n: number) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const store = getStore();
  const ws = store && typeof b.t === "string" ? await loadWorkspace(store, b.t) : null;
  if (!store || !ws) return NextResponse.json({ ok: false }, { status: 400 });
  if (!hasAccess(ws)) return NextResponse.json({ ok: false, error: "Hire Rocco to set a strategy." }, { status: 402 });
  const names = new Set([...Object.keys(ws.brands), ...(ws.amazon?.accounts ?? []).map((a) => a.name)]);
  const brand = typeof b.brand === "string" && names.has(b.brand) ? b.brand : Object.keys(ws.brands)[0] ?? ws.amazon?.accounts?.[0]?.name ?? "main";

  const mainGoal = b.mainGoal === "profit" || b.mainGoal === "growth" ? b.mainGoal : "balance";
  const t = Number(b.targetAcos);
  if (!Number.isFinite(t) || t < 0.05 || t > 1) return NextResponse.json({ ok: false, error: "Target ACoS should be between 5% and 100%." }, { status: 400 });
  const margin = b.marginPct === "" || b.marginPct == null ? NaN : Number(b.marginPct);
  if (Number.isFinite(margin) && (margin < 5 || margin > 95)) return NextResponse.json({ ok: false, error: "Margin before ads should be between 5% and 95%." }, { status: 400 });
  const breakevenAcos = Number.isFinite(margin) ? breakevenFromMargin(margin) : undefined;
  if (breakevenAcos !== undefined && breakevenAcos < t) return NextResponse.json({ ok: false, error: `A ${Math.round(t * 100)}% target is above your break-even (${Math.round(breakevenAcos * 100)}%): every sale would lose money. Lower the target or check the margin.` }, { status: 400 });
  const budget = b.monthlyAdBudget === "" || b.monthlyAdBudget == null ? NaN : Number(b.monthlyAdBudget);
  if (Number.isFinite(budget) && (budget < 30 || budget > 10_000_000)) return NextResponse.json({ ok: false, error: "Monthly ad budget looks off. Leave it empty for no limit." }, { status: 400 });
  const list = (v: unknown) => [...new Set((Array.isArray(v) ? v : String(v ?? "").split(",")).map((x) => clean(x, 60)).filter((x) => x.length >= 2))].slice(0, 20);
  const seen = new Set<string>();
  const goals = (Array.isArray(b.goals) ? b.goals : []).slice(0, 30).map((g) => g as { match?: unknown; goal?: unknown })
    .map((g) => ({ match: clean(g.match, 40), goal: (g.goal === "profit" || g.goal === "growth" ? g.goal : "balance") as "profit" | "balance" | "growth" }))
    .filter((g) => g.match.length >= 2 && !seen.has(g.match.toLowerCase()) && seen.add(g.match.toLowerCase()));

  if (b.autonomy === "approve" || b.autonomy === "guardrails" || b.autonomy === "auto") {
    if (ws.autonomy !== b.autonomy) { ws.autonomy = b.autonomy; ws.autonomySetAt = new Date().toISOString(); } // standing approval, logged
  }
  await setBrandSettings(store, ws, brand, {
    mainGoal, targetAcos: Math.round(t * 1000) / 1000, breakevenAcos,
    monthlyAdBudget: Number.isFinite(budget) ? Math.round(budget) : undefined,
    protectedCampaigns: list(b.protectedCampaigns), protectedTerms: list(b.protectedTerms), goals,
    notes: clean(b.notes, 600) || undefined, strategySetAt: new Date().toISOString(),
  });
  // "No limit" / cleared margin must actually clear (setBrandSettings skips undefined).
  if (!Number.isFinite(budget)) delete ws.brands[brand].monthlyAdBudget;
  if (!Number.isFinite(margin)) delete ws.brands[brand].breakevenAcos;
  if (!clean(b.notes, 600)) delete ws.brands[brand].notes;
  await store.saveWorkspace(ws);
  return NextResponse.json({ ok: true, brand, plan: strategyLines(brandSettings(ws, brand), ws.autonomy ?? "approve") });
}
