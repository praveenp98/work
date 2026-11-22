/**
 * Real urgency only (no fake timers, no "price goes up" we don't mean): the seller's own calendar.
 * Returns the line for the paywall, or null when nothing real is coming up.
 */
const DAY = 86_400_000;
// Start times: midnight US Eastern (05:00 UTC) on the day.
export const EVENTS = [
  { at: "2026-11-27", name: "Black Friday", pre: "Get the wasted ad spend out before peak bids." },
  { at: "2026-11-30", name: "Cyber Monday", pre: "Last chance to fix bids before the biggest ad day of the year." },
  { at: "2026-12-15", name: "the last big gifting week", pre: "Keep winners funded and stock in place." },
  { at: "2027-07-08", name: "Prime Day (expected July)", pre: "Start tuning a few weeks out." },
];
const startOf = (at: string) => new Date(`${at}T05:00:00Z`).getTime();

/** The next real event within 45 days, with its exact start (for a live countdown). Null when nothing is close. */
export function nextEvent(now = new Date()): { name: string; pre: string; startsAt: number } | null {
  for (const e of EVENTS) {
    const t = startOf(e.at);
    if (t + 86_400_000 <= now.getTime()) continue; // the day itself still counts ("is today")
    if (t - now.getTime() > 45 * 86_400_000) return null;
    return { name: e.name, pre: e.pre, startsAt: t };
  }
  return null;
}

/** "4d 09h 12m 05s" until a time (or null once it started). */
export function countdown(ms: number): string | null {
  if (ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${Math.floor(s / 86400)}d ${p(Math.floor((s % 86400) / 3600))}h ${p(Math.floor((s % 3600) / 60))}m ${p(s % 60)}s`;
}

export function urgencyLine(now = new Date()): { days: number; text: string } | null {
  for (const e of EVENTS) {
    const days = Math.ceil((new Date(`${e.at}T00:00:00Z`).getTime() - now.getTime()) / DAY);
    if (days < 0) continue;
    if (days > 45) return null;
    return { days, text: days === 0 ? `${e.name} is today. ${e.pre}` : `${e.name} is in ${days} day${days === 1 ? "" : "s"}. ${e.pre}` };
  }
  return null;
}

