import { runAction } from "./datadoe";
import { adsState } from "./stock-ads";
import type { Proposal } from "./rules/types";
import type { Action } from "./store/types";

/**
 * Undo a change Rocco made in Amazon: put the old value back.
 *  - budget → the campaign's previous daily budget (exact)
 *  - bid    → the target's previous cost per click (the price it was paying before the change)
 *  - low-stock ad pause → the same ads back on
 * Negatives and new campaigns aren't reversible here yet (Amazon's IDs for what we created aren't stored): steps only.
 */
export interface UndoPlan { type: string; details: Record<string, unknown[]>; back: string }

export function reversePlan(p: Proposal): UndoPlan | null {
  const ids = p.ids ?? {};
  if (p.kind === "budget" && ids.campaignId && typeof p.current === "number" && p.current >= 1) {
    const v = Math.round(p.current * 100) / 100;
    return { type: "AMAZON_ADS_CAMPAIGNS_UPDATE", details: { campaigns: [{ campaignId: ids.campaignId, budgets: [{ budgetType: "MONETARY", recurrenceTimePeriod: "DAILY", budgetValue: { monetaryBudgetValue: { monetaryBudget: { value: v } } } }] }] }, back: `budget back to $${v.toFixed(2)}/day` };
  }
  if (p.kind === "bid" && ids.keywordId && typeof p.current === "number" && p.current > 0.02) {
    const v = Math.round(p.current * 100) / 100;
    return { type: "AMAZON_ADS_TARGETS_UPDATE", details: { targets: [{ targetId: ids.keywordId, adProduct: "SPONSORED_PRODUCTS", bid: v }] }, back: `bid back to $${v.toFixed(2)}` };
  }
  if (p.kind === "ads_down" && ids.adIds?.length) {
    return { type: "AMAZON_ADS_ADS_UPDATE", details: adsState(ids.adIds, "ENABLED"), back: `${ids.adIds.length} ad${ids.adIds.length === 1 ? "" : "s"} back on` };
  }
  return null;
}

export const canUndo = (a: Pick<Action, "status" | "proposal">) => a.status !== "reverted" && !!reversePlan(a.proposal);

/** Dry run, then live (idempotent per change). */
export async function undoInAmazon(accountId: string, a: Action): Promise<{ ok: true; back: string } | { ok: false; error: string }> {
  const plan = reversePlan(a.proposal);
  if (!plan) return { ok: false, error: "This change can't be undone automatically. Steps: " + a.proposal.undo };
  // Amazon takes up to 100 items per request; split bigger undos (e.g. many paused ads).
  const [field, list] = Object.entries(plan.details)[0];
  for (let i = 0; i < list.length; i += 100) {
    const details = { [field]: list.slice(i, i + 100) };
    const dry = await runAction(accountId, plan.type, details, { dryRun: true });
    if (!dry.ok) return { ok: false, error: `Amazon said no to the undo (${(dry.error ?? "").slice(0, 120)}). ${i ? "Part of it was undone." : "Nothing changed."}` };
    const live = await runAction(accountId, plan.type, details, { idempotencyKey: `rocco:undo:${a.id}:${i}` });
    if (!live.ok) return { ok: false, error: `Amazon said no to the undo (${(live.error ?? "").slice(0, 120)}). ${i ? "Part of it was undone." : "Nothing changed."}` };
  }
  return { ok: true, back: plan.back };
}
