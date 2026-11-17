import type { CampaignRow } from "../parsers/campaign";
import { r2, type Analysis, type Finding, type Metrics, type Proposal } from "./types";

export interface BudgetSettings {
  targetAcos: number;
  breakevenAcos: number;
}

interface Camp { campaign: string; budget: number; spend: number; sales: number; orders: number; clicks: number }

/**
 * Budget shift: find winners that run out of budget (missing sales) and losers above breakeven,
 * and move money from the second group to the first. Budget moves are capped at +25% / −20% per step.
 */
export function analyzeBudgets(rows: CampaignRow[], days: number, s: BudgetSettings): Analysis {
  const map = new Map<string, Camp>();
  for (const r of rows) {
    if (r.status && !["enabled", "enabled ", "delivering", "running", ""].includes(r.status) && r.spend === 0) continue;
    const c = map.get(r.campaign) ?? { campaign: r.campaign, budget: 0, spend: 0, sales: 0, orders: 0, clicks: 0 };
    c.budget = Math.max(c.budget, r.budget);
    c.spend += r.spend; c.sales += r.sales; c.orders += r.orders; c.clicks += r.clicks;
    map.set(r.campaign, c);
  }
  const findings: Finding[] = [];
  const proposals: Proposal[] = [];
  let g = 0;
  let freed = 0;
  const camps = [...map.values()];
  const acos = (c: Camp) => (c.sales > 0 ? c.spend / c.sales : Infinity);
  const perDay = (n: number) => n / days;
  const before = (c: Camp): Metrics => ({ spendPerDay: r2(perDay(c.spend)), salesPerDay: r2(perDay(c.sales)), clicksPerDay: r2(perDay(c.clicks)), ordersPerDay: r2(perDay(c.orders)), acos: c.sales > 0 ? r2(c.spend / c.sales) : -1 });

  // losers first, so freed budget can fund winners
  for (const c of camps) {
    const util = c.budget > 0 ? perDay(c.spend) / c.budget : 0;
    const a = acos(c);
    if (a > s.breakevenAcos && c.clicks >= 30) {
      const loss = Math.max(0, c.spend - c.sales * s.breakevenAcos) * (30 / days);
      const newBudget = r2(Math.max(1, Math.min(c.budget, perDay(c.spend)) * 0.8));
      if (newBudget < c.budget) freed += c.budget - newBudget;
      g++;
      proposals.push({ code: `G${g}`, kind: "budget", campaign: c.campaign, adGroup: "", target: c.campaign, current: c.budget, proposed: newBudget, reason: `ACoS ${Number.isFinite(a) ? Math.round(a * 100) + "%" : "∞"} is above breakeven ${Math.round(s.breakevenAcos * 100)}%; ${Math.round(util * 100)}% of budget used. Cut budget and fix bids/negatives first.`, valueMonthly: r2(loss), before: before(c), undo: `Set the daily budget back to ${c.budget}.` });
      findings.push({ severity: "high", title: `${c.campaign} loses money`, detail: `ACoS ${Number.isFinite(a) ? Math.round(a * 100) + "%" : "with no sales"} vs breakeven ${Math.round(s.breakevenAcos * 100)}%. About $${Math.round(loss)}/month above breakeven.`, line: `${c.campaign} is a money furnace with a campaign name.`, valueMonthly: r2(loss) });
    }
  }
  for (const c of camps) {
    const util = c.budget > 0 ? perDay(c.spend) / c.budget : 0;
    const a = acos(c);
    if (util >= 0.9 && a <= s.targetAcos) {
      const proposed = r2(c.budget * 1.25);
      const extraSales = ((proposed - c.budget) * 30) / a;
      g++;
      proposals.push({ code: `G${g}`, kind: "budget", campaign: c.campaign, adGroup: "", target: c.campaign, current: c.budget, proposed, reason: `Uses ${Math.round(util * 100)}% of its budget at ${Math.round(a * 100)}% ACoS (under target). It's running out of money while profitable.`, valueMonthly: r2(extraSales), before: before(c), undo: `Set the daily budget back to ${c.budget}.` });
      findings.push({ severity: "medium", title: `${c.campaign} runs out of budget while profitable`, detail: `${Math.round(util * 100)}% budget used at ${Math.round(a * 100)}% ACoS. Raising budget 25% could add ~$${Math.round(extraSales)}/month in sales at the same ACoS.`, line: `${c.campaign} is your best worker and you keep sending it home at lunch.`, valueMonthly: r2(extraSales) });
    }
  }
  const totalBudget = camps.reduce((a, c) => a + c.budget, 0);
  const totalSpend = camps.reduce((a, c) => a + c.spend, 0);
  const totalSales = camps.reduce((a, c) => a + c.sales, 0);
  return {
    reportType: "sp_campaign",
    headline: `${camps.length} campaigns · $${Math.round(totalBudget)}/day budget · ACoS ${totalSales ? Math.round((totalSpend / totalSales) * 100) : 0}%. ${proposals.length ? `${proposals.length} budget moves${freed > 0 ? `, freeing ~$${Math.round(freed)}/day for winners` : ""}.` : "Budgets look balanced."}`,
    findings,
    proposals,
    stats: { campaigns: camps.length, dailyBudget: r2(totalBudget), spend: r2(totalSpend), sales: r2(totalSales), days },
  };
}
