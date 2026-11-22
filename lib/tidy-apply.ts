import { findId, runAction, waitForAction } from "./datadoe";
import type { TidyPlan } from "./rules/tidy";

/**
 * Apply a tidy plan in Amazon (formats checked with DataDoe dry runs, Nov 22):
 *   portfolios  AMAZON_ADS_PORTFOLIOS_ADD   { name, state: "ENABLED" }      one per product, waited for to get its id
 *   names       AMAZON_ADS_CAMPAIGNS_UPDATE { campaignId, name }             batches of 100
 *   portfolio   AMAZON_ADS_CAMPAIGNS_UPDATE { campaignId, portfolioId }
 *   pause idle  AMAZON_ADS_CAMPAIGNS_UPDATE { campaignId, state: "PAUSED" }
 * Every batch is dry-run first. Returns what changed, so it can be undone (old names / old states).
 */
export interface TidyChoice { rename: boolean; portfolios: boolean; pauseIdle: boolean; ids?: string[] }
export interface TidyDone { at: string; by?: string; renamed: { id: string; from: string; to: string }[]; paused: string[]; portfolios: { name: string; id: string; campaigns: string[] }[]; errors: string[] }

async function batch(accountId: string, items: Record<string, unknown>[], key: string, errors: string[]): Promise<boolean> {
  let ok = true;
  for (let i = 0; i < items.length; i += 100) {
    const details = { campaigns: items.slice(i, i + 100) };
    const dry = await runAction(accountId, "AMAZON_ADS_CAMPAIGNS_UPDATE", details, { dryRun: true }).catch((e) => ({ ok: false, error: String(e) }));
    if (!dry.ok) { errors.push(`checked first, rejected: ${dry.error}`); ok = false; continue; }
    const live = await runAction(accountId, "AMAZON_ADS_CAMPAIGNS_UPDATE", details, { idempotencyKey: `${key}:${i}` }).catch((e) => ({ ok: false, error: String(e) }));
    if (!live.ok) { errors.push(/disabled|not enabled/i.test(live.error ?? "") ? "Campaign changes are switched off in DataDoe (Settings → Actions → AMAZON_ADS_CAMPAIGNS_UPDATE)." : `Amazon didn't take it: ${live.error}`); ok = false; }
  }
  return ok;
}

export async function applyTidy(accountId: string, plan: TidyPlan, choice: TidyChoice, key: string, now = new Date()): Promise<TidyDone> {
  const pick = new Set(choice.ids ?? plan.items.map((i) => i.id));
  const items = plan.items.filter((i) => pick.has(i.id));
  const done: TidyDone = { at: now.toISOString(), renamed: [], paused: [], portfolios: [], errors: [] };

  if (choice.rename) {
    const r = items.filter((i) => i.rename);
    if (await batch(accountId, r.map((i) => ({ campaignId: i.id, name: i.newName })), `${key}:name`, done.errors)) done.renamed = r.map((i) => ({ id: i.id, from: i.oldName, to: i.newName }));
  }
  if (choice.portfolios) {
    const groups = new Map<string, string[]>();
    for (const i of items) if (i.portfolio) groups.set(i.portfolio, [...(groups.get(i.portfolio) ?? []), i.id]);
    for (const [name, ids] of groups) {
      const details = { portfolios: [{ name: name.slice(0, 100), state: "ENABLED" }] };
      const dry = await runAction(accountId, "AMAZON_ADS_PORTFOLIOS_ADD", details, { dryRun: true }).catch((e) => ({ ok: false, error: String(e) }));
      if (!dry.ok) { done.errors.push(`Portfolio "${name}": ${dry.error}`); continue; }
      const live = await runAction(accountId, "AMAZON_ADS_PORTFOLIOS_ADD", details, { idempotencyKey: `${key}:pf:${name}`.slice(0, 120) }).catch((e) => ({ ok: false, error: String(e), id: undefined }));
      const fin = live.ok && live.id ? await waitForAction(live.id) : null;
      const pid = fin ? findId(fin.result, "portfolioId") : undefined;
      if (!pid) { done.errors.push(`Portfolio "${name}" wasn't created${live.ok ? " (no id back)" : `: ${live.error}`}.`); continue; }
      if (await batch(accountId, ids.map((id) => ({ campaignId: id, portfolioId: pid })), `${key}:pf:${pid}`, done.errors)) done.portfolios.push({ name, id: pid, campaigns: ids });
    }
  }
  if (choice.pauseIdle) {
    const idle = items.filter((i) => i.issue === "idle" && i.state === "ENABLED");
    if (await batch(accountId, idle.map((i) => ({ campaignId: i.id, state: "PAUSED" })), `${key}:pause`, done.errors)) done.paused = idle.map((i) => i.id);
  }
  return done;
}

/** Put names back and re-enable what was paused (portfolios stay: they're harmless and easy to delete by hand). */
export async function undoTidy(accountId: string, d: TidyDone, key: string): Promise<string[]> {
  const errors: string[] = [];
  if (d.renamed.length) await batch(accountId, d.renamed.map((r) => ({ campaignId: r.id, name: r.from })), `${key}:undo-name`, errors);
  if (d.paused.length) await batch(accountId, d.paused.map((id) => ({ campaignId: id, state: "ENABLED" })), `${key}:undo-pause`, errors);
  return errors;
}
