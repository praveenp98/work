"use client";
import { useEffect, useState } from "react";
import { PLAN } from "@/lib/pricing";
import { countdown, nextEvent } from "@/lib/urgency";

/**
 * The paywall's case, all honest:
 *  - Urgency: a live countdown to the next real selling event (Black Friday, Cyber Monday…), never a fake timer.
 *  - PriceRise: "prices go up by $10 every 5 hires", with how many hires are left at today's price (Dodo count).
 *  - ValueCalc: what the daily account checks cost in a team's own time (hours a day × $35/hour, stated) next to
 *    Rocco's price. Works for brands and agencies alike (an agency's managers do these same checks).
 */
const HOURS = [0.5, 1, 1.5, 2, 3, 4];
const RATE = 35;
const WORKDAYS = 22;
const $ = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
export const timeCost = (hoursPerDay: number) => hoursPerDay * WORKDAYS * RATE;

function useSold(): number | null {
  const [sold, setSold] = useState<number | null>(null);
  useEffect(() => { fetch("/api/price").then((r) => r.json()).then((s) => setSold(Number.isFinite(Number(s?.sold)) ? Number(s.sold) : null)).catch(() => {}); }, []);
  return sold;
}

export function Urgency() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  if (now === null) return null;
  const e = nextEvent(new Date(now));
  if (!e) return null;
  const left = countdown(e.startsAt - now);
  return (
    <div className="vc-urgent" role="timer" aria-live="off">
      <span className="vc-u-top"><span aria-hidden>⏳</span> {left ? <>{e.name} starts in <b className="vc-clock">{left}</b></> : <>{e.name} is on now.</>}</span>
      <span className="vc-u-sub">{e.pre}</span>
    </div>
  );
}

export function PriceRise() {
  const sold = useSold();
  const left = sold === null ? null : 5 - (sold % 5);
  return (
    <p className="vc-rise"><span aria-hidden>📈</span> Prices go up by $10 every 5 hires.{left !== null && <> <b>{left} {left === 1 ? "hire" : "hires"} left</b> at this price.</>}</p>
  );
}

export function ValueCalc({ plan = "annual", compact }: { plan?: "annual" | "monthly"; compact?: boolean }) {
  const [i, setI] = useState(1);
  const sold = useSold();
  const h = HOURS[i];
  const team = timeCost(h);
  const cost = plan === "annual" ? PLAN.annualCents / 1200 : PLAN.monthlyCents / 100;
  const pct = Math.max(5, Math.round((cost / team) * 100));
  return (
    <div className={`vc${compact ? " compact" : ""}`}>
      <label className="vc-q" htmlFor="vc-hours">Time spent checking ads, bids and stock <b>{h} {h === 1 ? "hour" : "hours"}/day</b></label>
      <input id="vc-hours" type="range" min={0} max={HOURS.length - 1} step={1} value={i} onChange={(e) => setI(Number(e.target.value))} aria-valuetext={`${h} hours a day`} />
      <div className="vc-bars" aria-live="polite">
        <div className="vc-bar"><span>That time</span><i><s style={{ width: "100%" }} /></i><b>{$(team)}/mo</b></div>
        <div className="vc-bar me"><span>Rocco</span><i><s style={{ width: `${pct}%` }} /></i><b>{$(cost)}/mo</b></div>
      </div>
      <p className="vc-note">At ${RATE} an hour. I do the daily checks and line up the changes; you or your team just approve. Brands and agencies: every account, one plan.</p>
      {sold !== null && sold >= 5 && <p className="vc-proof">✅ {sold} brands have hired me.</p>}
    </div>
  );
}
