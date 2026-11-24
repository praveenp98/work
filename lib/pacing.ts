/**
 * Same-day budget pacing: "Serum · Exact will run out of budget by ~3 PM, and it's profitable today."
 * Reads today's spend per campaign (DataDoe refreshes Amazon Ads performance at 8am / 1pm / 4pm local) at midday and
 * flags profitable campaigns on pace to hit their daily budget hours before midnight: those are lost sales tonight.
 * Pure function (tested); the cron (app/api/cron/pacing) does the pull and the message.
 */
export interface TodayRow { campaign: string; budget: number; spend: number; sales: number }
export interface PaceAlert { campaign: string; budget: number; spent: number; outAt: number; acos: number | null }

export function pacingAlerts(rows: TodayRow[], o: { localHour: number; targetAcos: number; targetFor?: (campaign: string) => number }): PaceAlert[] {
  const h = Math.max(1, Math.min(23, o.localHour));
  const out: PaceAlert[] = [];
  for (const r of rows) {
    if (!(r.budget > 0) || !(r.spend > 0)) continue;
    const used = r.spend / r.budget;
    if (used < 0.6) continue; // not close yet
    const outAt = Math.round((h / used) * 10) / 10; // local hour it runs dry at today's pace
    if (outAt > 21) continue; // runs out late evening at worst: little lost
    const acos = r.sales > 0 ? r.spend / r.sales : null;
    const target = o.targetFor ? o.targetFor(r.campaign) : o.targetAcos;
    if (acos === null || acos > target) continue; // only raise money for campaigns that pay today
    out.push({ campaign: r.campaign, budget: r.budget, spent: r.spend, outAt, acos });
  }
  return out.sort((a, b) => a.outAt - b.outAt).slice(0, 3);
}

const hourText = (h: number) => { const x = Math.floor(h); const ap = x >= 12 ? "PM" : "AM"; return `${x % 12 === 0 ? 12 : x % 12} ${ap}`; };

/** The text message (one per account per day). */
export function pacingMessage(account: string, alerts: PaceAlert[], link: string, sym = "$"): string {
  const lines = alerts.map((a) => `• ${a.campaign.slice(0, 48)}: ${sym}${a.spent.toFixed(0)} of ${sym}${a.budget.toFixed(0)} spent, runs out ~${hourText(a.outAt)} at ${Math.round((a.acos ?? 0) * 100)}% ACoS`);
  return [`⏱️ ${account}: ${alerts.length === 1 ? "a profitable campaign is" : `${alerts.length} profitable campaigns are`} about to run out of budget today.`, ...lines, `Raise today's budget in Seller Central (Campaign Manager), or tap through and I'll suggest how much: ${link}`].join("\n");
}
