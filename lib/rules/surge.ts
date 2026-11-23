/**
 * BFCM Surge Plan: a day-by-day budget and bid schedule for Black Friday / Cyber Monday 2026.
 * Thanksgiving = Thu Nov 26, Black Friday = Fri Nov 27, Cyber Monday = Mon Nov 30.
 * Multipliers are Rocco's playbook defaults (scaled by aggression), not Amazon data.
 */
export type Aggression = "careful" | "normal" | "bold";

export interface SurgeInput {
  dailyBudget: number; // current total daily budget across campaigns
  targetAcos: number; // fraction
  breakevenAcos: number; // fraction
  aggression: Aggression;
}

export interface SurgeDay {
  date: string; // ISO yyyy-mm-dd
  label: string;
  phase: "warmup" | "build" | "peak" | "hold" | "cooldown";
  budgetMult: number;
  budget: number;
  winnerBidPct: number; // bid change for proven winners (exact terms under target ACoS)
  topOfSearchPct: number; // placement adjustment
  acosCeiling: number; // pause/cut threshold for the day
  checks: number; // budget checks per day
  note: string;
}

const BASE: Omit<SurgeDay, "budget" | "acosCeiling" | "date">[] = [
  { label: "Thu Nov 19", phase: "warmup", budgetMult: 1.2, winnerBidPct: 5, topOfSearchPct: 0, checks: 1, note: "Early deals start. Add your negatives now so peak spend goes to buyers." },
  { label: "Fri Nov 20", phase: "warmup", budgetMult: 1.2, winnerBidPct: 5, topOfSearchPct: 0, checks: 1, note: "Harvest winners into exact campaigns so they have budget of their own on peak days." },
  { label: "Sat Nov 21", phase: "warmup", budgetMult: 1.25, winnerBidPct: 5, topOfSearchPct: 10, checks: 1, note: "Weekend browsing. Watch impressions on your top 5 terms." },
  { label: "Sun Nov 22", phase: "warmup", budgetMult: 1.25, winnerBidPct: 5, topOfSearchPct: 10, checks: 1, note: "Check stock: no budget increase on any SKU with under 21 days of cover." },
  { label: "Mon Nov 23", phase: "build", budgetMult: 1.35, winnerBidPct: 10, topOfSearchPct: 10, checks: 2, note: "Shoppers start adding to cart and lists. Raise winners, not everything." },
  { label: "Tue Nov 24", phase: "build", budgetMult: 1.4, winnerBidPct: 10, topOfSearchPct: 15, checks: 2, note: "Confirm coupons and deals are live and margins still clear breakeven." },
  { label: "Wed Nov 25", phase: "build", budgetMult: 1.5, winnerBidPct: 15, topOfSearchPct: 15, checks: 2, note: "Last calm day. Set tomorrow's budgets tonight; don't do it at 9 a.m. on Black Friday." },
  { label: "Thu Nov 26 (Thanksgiving)", phase: "peak", budgetMult: 1.7, winnerBidPct: 15, topOfSearchPct: 20, checks: 3, note: "Evening traffic spikes after dinner. Check budgets mid-afternoon and late evening." },
  { label: "Fri Nov 27 (Black Friday)", phase: "peak", budgetMult: 2.2, winnerBidPct: 20, topOfSearchPct: 25, checks: 4, note: "Biggest day. Campaigns that run out of budget by noon lose the evening. Check 4 times." },
  { label: "Sat Nov 28", phase: "hold", budgetMult: 1.8, winnerBidPct: 15, topOfSearchPct: 20, checks: 3, note: "Hold winners. Cut anything above your ceiling with 10+ clicks and no orders today." },
  { label: "Sun Nov 29", phase: "hold", budgetMult: 1.8, winnerBidPct: 15, topOfSearchPct: 20, checks: 3, note: "Re-run the roast on the last 7 days. New junk terms show up fast in peak week." },
  { label: "Mon Nov 30 (Cyber Monday)", phase: "peak", budgetMult: 2.0, winnerBidPct: 20, topOfSearchPct: 25, checks: 4, note: "Second peak. Same playbook as Black Friday." },
  { label: "Tue Dec 1", phase: "cooldown", budgetMult: 1.3, winnerBidPct: 5, topOfSearchPct: 10, checks: 2, note: "Pull bids back toward normal. Run the BFCM post-mortem roast." },
  { label: "Wed Dec 2", phase: "cooldown", budgetMult: 1.1, winnerBidPct: 0, topOfSearchPct: 0, checks: 1, note: "Back to normal bids. Gifting season continues: keep winners funded through mid-December." },
];

const SCALE: Record<Aggression, number> = { careful: 0.5, normal: 1, bold: 1.4 };
const ISO = ["2026-11-19", "2026-11-20", "2026-11-21", "2026-11-22", "2026-11-23", "2026-11-24", "2026-11-25", "2026-11-26", "2026-11-27", "2026-11-28", "2026-11-29", "2026-11-30", "2026-12-01", "2026-12-02"];

const r2 = (n: number) => Math.round(n * 100) / 100;

export function surgePlan(i: SurgeInput) {
  const k = SCALE[i.aggression];
  const cap = 20; // never more than +20% per step on bids, same guardrail as the roast
  const days: SurgeDay[] = BASE.map((d, idx) => {
    const budgetMult = r2(1 + (d.budgetMult - 1) * k);
    // In peak, conversion rates rise, so tolerate ACoS up to breakeven; otherwise hold the target.
    const acosCeiling = d.phase === "peak" || d.phase === "hold" ? Math.max(i.targetAcos, i.breakevenAcos) : i.targetAcos * 1.2;
    return {
      ...d,
      date: ISO[idx],
      budgetMult,
      budget: r2(i.dailyBudget * budgetMult),
      winnerBidPct: Math.min(cap, Math.round(d.winnerBidPct * k)),
      topOfSearchPct: Math.round(d.topOfSearchPct * k),
      acosCeiling: r2(acosCeiling),
    };
  });
  const normal = i.dailyBudget * days.length;
  const total = days.reduce((a, d) => a + d.budget, 0);
  return {
    days,
    totalBudget: r2(total),
    extraBudget: r2(total - normal),
    warnings: [
      ...(i.breakevenAcos <= i.targetAcos ? ["Your target ACoS is at or above breakeven. Fix your target before raising anything."] : []),
      ...(i.breakevenAcos <= 0 ? ["Breakeven ACoS is 0 or negative: you lose money on every sale before ads. Don't surge."] : []),
    ],
  };
}

export const SURGE_RULES = [
  "Only raise bids on proven winners: exact-match terms with orders and ACoS under target in the last 30 days.",
  "Never raise a bid by more than 20% in one step. Go up in steps, check, then go again.",
  "Add your negatives before the surge. Extra budget on junk terms just loses money faster.",
  "Don't surge any SKU with under 21 days of stock cover. Running out on Black Friday also hurts ranking after.",
  "During peak days, tolerate ACoS up to breakeven on winners (conversion rates rise); outside peak, hold your target.",
  "Check budgets several times on Black Friday and Cyber Monday. A campaign that's out of budget by noon misses the evening.",
  "On Dec 1, pull bids back and run a post-mortem roast on the peak week.",
];
