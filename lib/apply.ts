import { runAction, type ActionResult } from "./datadoe";
import type { Proposal } from "./rules/types";

/**
 * Approve → Rocco makes the change in Amazon (DataDoe write Actions, formats checked with DataDoe dry runs Nov 22):
 *  - negative exact keyword    AMAZON_ADS_TARGETS_ADD     (negative: true)
 *  - keyword/target bid        AMAZON_ADS_TARGETS_UPDATE
 *  - campaign daily budget     AMAZON_ADS_CAMPAIGNS_UPDATE (budgets: MONETARY / DAILY)
 * A job's changes go out as one Action per type (≤100 items: 3 DataDoe tokens instead of 3 per change). Each batch is
 * dry-run first (free); if DataDoe rejects the batch, each change is tried on its own so one bad item doesn't block
 * the rest. New campaigns from winners: lib/create-campaign.ts.
 * Hard rules: only after the seller's explicit approval, logged as an action, reversible (undo text on the proposal).
 */
export interface ActionPlan { type: string; details: Record<string, unknown[]> }

const item = (p: Proposal): { type: string; field: string; value: Record<string, unknown> } | null => {
  const ids = p.ids ?? {};
  if (p.kind === "negative" && ids.campaignId && ids.adGroupId && p.matchType !== "negative product") {
    return { type: "AMAZON_ADS_TARGETS_ADD", field: "targets", value: { campaignId: ids.campaignId, adGroupId: ids.adGroupId, adProduct: "SPONSORED_PRODUCTS", negative: true, state: "ENABLED", targetType: "KEYWORD", targetDetails: { keywordTarget: { keyword: p.target, matchType: "EXACT" } } } };
  }
  if (p.kind === "bid" && ids.keywordId && typeof p.proposed === "number" && p.proposed > 0) {
    return { type: "AMAZON_ADS_TARGETS_UPDATE", field: "targets", value: { targetId: ids.keywordId, adProduct: "SPONSORED_PRODUCTS", bid: Math.round(p.proposed * 100) / 100 } };
  }
  if (p.kind === "budget" && ids.campaignId && typeof p.proposed === "number" && p.proposed >= 1) {
    return { type: "AMAZON_ADS_CAMPAIGNS_UPDATE", field: "campaigns", value: { campaignId: ids.campaignId, budgets: [{ budgetType: "MONETARY", recurrenceTimePeriod: "DAILY", budgetValue: { monetaryBudgetValue: { monetaryBudget: { value: Math.round(p.proposed * 100) / 100 } } } }] } };
  }
  return null;
};

export function planFor(p: Proposal): ActionPlan | null {
  const i = item(p);
  return i ? { type: i.type, details: { [i.field]: [i.value] } } : null;
}

export type ApplyOutcome =
  | { code: string; status: "applied"; actionId?: string }
  | { code: string; status: "manual"; reason: string }
  | { code: string; status: "failed"; reason: string };

const err = (e: unknown) => ({ ok: false, error: String(e instanceof Error ? e.message : e) }) as ActionResult;
const readOnly = (e?: string) => /403|READ_ONLY|read only|access level/i.test(e ?? "");
const disabled = (e?: string) => /disabled|not enabled|enable it/i.test(e ?? "");
const manualReason = (p: Proposal) => (p.kind === "harvest" ? "New campaigns are created from the job card." : p.ids?.campaignId || p.ids?.keywordId ? "This kind of change is made by hand for now." : "Amazon IDs for this change aren't in the data yet.");

function liveFailure(code: string, e?: string): ApplyOutcome {
  if (readOnly(e)) return { code, status: "manual", reason: "Rocco has read-only access to this account. Reconnect with edit access to let me make changes." };
  if (disabled(e)) return { code, status: "manual", reason: "This change type is switched off in DataDoe (Settings → Actions)." };
  console.warn(`[apply] ${code} refused: ${e}`);
  if (/429|rate/i.test(e ?? "")) return { code, status: "failed", reason: "Amazon is busy right now, so nothing changed. Try again in a minute." };
  if (/40[04]|not found|archived/i.test(e ?? "")) return { code, status: "failed", reason: "Amazon couldn't find that keyword or campaign anymore (it may have been changed or archived), so nothing changed." };
  return { code, status: "failed", reason: "Amazon said no to this change, so nothing changed. You can make it by hand below, or try again tomorrow." };
}

/** One change: dry run, then live. */
export async function applyInAmazon(accountId: string, p: Proposal, key: string): Promise<ApplyOutcome> {
  return (await applyMany(accountId, [p], key))[0];
}

/** Several changes (one job): grouped into one Action per type, dry run first, isolated retries on rejection. */
export async function applyMany(accountId: string, ps: Proposal[], key: string): Promise<ApplyOutcome[]> {
  const out = new Map<string, ApplyOutcome>();
  const groups = new Map<string, { field: string; items: { p: Proposal; value: Record<string, unknown> }[] }>();
  for (const p of ps) {
    const i = item(p);
    if (!i) { out.set(p.code, { code: p.code, status: "manual", reason: manualReason(p) }); continue; }
    const g = groups.get(i.type) ?? { field: i.field, items: [] };
    g.items.push({ p, value: i.value });
    groups.set(i.type, g);
  }
  for (const [type, g] of groups) {
    for (let k = 0; k < g.items.length; k += 100) {
      const chunk = g.items.slice(k, k + 100);
      const details = { [g.field]: chunk.map((x) => x.value) };
      const dry = await runAction(accountId, type, details, { dryRun: true }).catch(err);
      if (!dry.ok) {
        if (chunk.length === 1) {
          console.warn(`[apply] ${chunk[0].p.code} dry run refused: ${dry.error}`);
          out.set(chunk[0].p.code, disabled(dry.error)
            ? { code: chunk[0].p.code, status: "manual", reason: "This change type is switched off in DataDoe (Settings → Actions)." }
            : { code: chunk[0].p.code, status: "failed", reason: "I checked it with Amazon first and it wouldn't be accepted, so nothing changed. Here's how to make it by hand." });
          continue;
        }
        for (const x of chunk) out.set(x.p.code, (await applyMany(accountId, [x.p], `${key}:${x.p.code}`))[0]); // isolate the bad one
        continue;
      }
      const live = await runAction(accountId, type, details, { idempotencyKey: `${key}:${type}:${k}` }).catch(err);
      for (const x of chunk) out.set(x.p.code, live.ok ? { code: x.p.code, status: "applied", actionId: live.id } : liveFailure(x.p.code, live.error));
    }
  }
  return ps.map((p) => out.get(p.code)!);
}
