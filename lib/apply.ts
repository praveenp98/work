import { runAction, type ActionResult } from "./datadoe";
import type { Proposal } from "./rules/types";

/**
 * Approve → Rocco makes the change in Amazon (through DataDoe write Actions, docs/DATADOE.md).
 * Supported today: negative exact keywords (AMAZON_ADS_TARGETS_ADD, negative=true) and keyword/target bid changes
 * (AMAZON_ADS_TARGETS_UPDATE). Each change is dry-run first (free, validated by DataDoe), then run live.
 * Anything without the Amazon IDs it needs, or of another kind, comes back as manual (exact clicks shown instead).
 * Hard rules: only after the seller's explicit approval, logged as an action, reversible (undo text on the proposal).
 */
export interface ActionPlan { type: string; details: Record<string, unknown> }

export function planFor(p: Proposal): ActionPlan | null {
  const ids = p.ids ?? {};
  if (p.kind === "negative" && ids.campaignId && ids.adGroupId && p.matchType !== "negative product") {
    return {
      type: "AMAZON_ADS_TARGETS_ADD",
      details: { targets: [{ campaignId: ids.campaignId, adGroupId: ids.adGroupId, adProduct: "SPONSORED_PRODUCTS", negative: true, state: "ENABLED", targetType: "KEYWORD", targetDetails: { keywordTarget: { keyword: p.target, matchType: "EXACT" } } }] },
    };
  }
  if (p.kind === "bid" && ids.keywordId && typeof p.proposed === "number" && p.proposed > 0) {
    return { type: "AMAZON_ADS_TARGETS_UPDATE", details: { targets: [{ targetId: ids.keywordId, adProduct: "SPONSORED_PRODUCTS", bid: Math.round(p.proposed * 100) / 100 }] } };
  }
  return null;
}

export type ApplyOutcome =
  | { code: string; status: "applied"; actionId?: string }
  | { code: string; status: "manual"; reason: string }
  | { code: string; status: "failed"; reason: string };

/** Dry run, then live. Stops at the dry run if DataDoe rejects the payload (nothing reaches Amazon). */
export async function applyInAmazon(accountId: string, p: Proposal, key: string): Promise<ApplyOutcome> {
  const plan = planFor(p);
  if (!plan) return { code: p.code, status: "manual", reason: p.ids?.campaignId ? "This kind of change is made by hand for now." : "Amazon IDs for this change aren't in the data yet." };
  const dry: ActionResult = await runAction(accountId, plan.type, plan.details, { dryRun: true }).catch((e) => ({ ok: false, error: String(e instanceof Error ? e.message : e) }));
  if (!dry.ok) return { code: p.code, status: "failed", reason: `Checked first, Amazon wouldn't accept it: ${dry.error ?? "invalid"}` };
  const live: ActionResult = await runAction(accountId, plan.type, plan.details, { idempotencyKey: key }).catch((e) => ({ ok: false, error: String(e instanceof Error ? e.message : e) }));
  if (!live.ok) {
    const readOnly = /403|READ_ONLY|read only|access level/i.test(live.error ?? "");
    return { code: p.code, status: readOnly ? "manual" : "failed", reason: readOnly ? "Rocco has read-only access to this account. Reconnect with edit access to let me make changes." : `Amazon didn't take it: ${live.error}` };
  }
  return { code: p.code, status: "applied", actionId: live.id };
}
