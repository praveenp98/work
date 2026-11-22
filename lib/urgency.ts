/**
 * Real urgency only (no fake timers, no "price goes up" we don't mean): the seller's own calendar.
 * Returns the line for the paywall, or null when nothing real is coming up.
 */
const DAY = 86_400_000;
const EVENTS = [
  { at: "2026-11-27", name: "Black Friday", pre: "Get the wasted ad spend out before peak bids." },
  { at: "2026-11-30", name: "Cyber Monday", pre: "Last chance to fix bids before the biggest ad day of the year." },
  { at: "2026-12-15", name: "the last big gifting week", pre: "Keep winners funded and stock in place." },
  { at: "2027-07-08", name: "Prime Day (expected July)", pre: "Start tuning a few weeks out." },
];

export function urgencyLine(now = new Date()): { days: number; text: string } | null {
  for (const e of EVENTS) {
    const days = Math.ceil((new Date(`${e.at}T00:00:00Z`).getTime() - now.getTime()) / DAY);
    if (days < 0) continue;
    if (days > 45) return null;
    return { days, text: days === 0 ? `${e.name} is today. ${e.pre}` : `${e.name} is in ${days} day${days === 1 ? "" : "s"}. ${e.pre}` };
  }
  return null;
}

/** First-day result on a real connected account (Habit Nest US, Nov 22 live pull), shown anonymized. */
export const PROOF = { adSpendMonthly: 2631, fixes: 87, line: "On a real seller account spending $2.6K/mo on ads, I found 87 fixes on day one." } as const;
