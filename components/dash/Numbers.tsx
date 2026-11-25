"use client";
import { useMemo, useState } from "react";
import { track } from "@/lib/analytics";
import { addDays, previousPeriod, totals, type Daily } from "@/lib/daily";

const PRESETS = [7, 14, 30, 90, 180] as const;

/**
 * Your account's numbers for any date range (lib/daily.ts): sales, units, sessions, conversion, ad spend, ad sales,
 * ACoS, TACoS, ROAS, CPC, each vs the period before, plus a daily chart of sales vs ad spend.
 */
export function Numbers({ daily, sym = "$", target, costs }: { daily: Daily; sym?: string; target?: number; costs?: { href: string; missing: string[] } }) {
  const days = Object.keys(daily).sort();
  // Stop at the last complete day (fix list #10): today is still filling in, and a newest day with no sales after
  // a week of sales is Amazon not having published it yet, not a crash.
  const today = new Date().toISOString().slice(0, 10);
  const median7 = (() => { const v = days.slice(-8, -1).map((d) => daily[d].s ?? 0).sort((a, b) => a - b); return v[v.length >> 1] ?? 0; })();
  let lastI = days.length - 1;
  while (lastI > 0 && (days[lastI] >= today || ((daily[days[lastI]].s ?? 0) === 0 && median7 > 0 && lastI >= days.length - 3))) lastI--;
  const last = days[lastI];
  const first = days[0];
  const [preset, setPreset] = useState<number | "custom">(30);
  const [cFrom, setCFrom] = useState(addDays(last, -29) < first ? first : addDays(last, -29));
  const [cTo, setCTo] = useState(last);
  const from = preset === "custom" ? cFrom : addDays(last, -(preset - 1));
  const to = preset === "custom" ? cTo : last;
  const cur = useMemo(() => totals(daily, from, to), [daily, from, to]);
  const prevR = previousPeriod(from, to);
  const prev = useMemo(() => totals(daily, prevR.from, prevR.to), [daily, prevR.from, prevR.to]);
  // Honest growth (fix list #11): only compare when the period before has real data on most of its days.
  const active = (a: string, b: string) => days.filter((d) => d >= a && d <= b && ((daily[d].s ?? 0) > 0 || (daily[d].as ?? 0) > 0)).length;
  const hasPrev = prevR.from >= first && prev.days >= Math.max(1, Math.round(cur.days * 0.8)) && active(prevR.from, prevR.to) >= Math.max(1, Math.round(active(from, to) * 0.8));

  const money = (x: number) => `${sym}${Math.round(x).toLocaleString("en-US")}`;
  const pct = (x: number | null) => (x === null ? "—" : `${(x * 100).toFixed(1)}%`);
  const ch = (a: number | null, b: number | null, lowerIsGood = false, points = false) => {
    if (!hasPrev || a === null || b === null || (!points && !b)) return null;
    const d = points ? (a - b) * 100 : (a - b) / Math.abs(b);
    if (Math.abs(d) < (points ? 0.1 : 0.01)) return { t: "flat", c: "" };
    const good = lowerIsGood ? d < 0 : d > 0;
    return { t: `${d > 0 ? "▲" : "▼"} ${points ? `${Math.abs(d).toFixed(1)} pts` : `${Math.round(Math.abs(d) * 100)}%`}`, c: good ? "up" : "down" };
  };
  const tiles = [
    cur.hasSales && { k: "Total sales", v: money(cur.sales), d: ch(cur.sales, prev.sales) },
    cur.hasProfit && { k: cur.costMissing ? "Profit · some costs missing" : "Profit", v: money(cur.profit), d: ch(cur.profit, prev.profit) },
    cur.hasSales && { k: "Units", v: cur.units.toLocaleString("en-US"), d: ch(cur.units, prev.units) },
    cur.hasSales && { k: "Sessions", v: cur.sessions.toLocaleString("en-US"), d: ch(cur.sessions, prev.sessions) },
    cur.hasSales && { k: "Conversion", v: pct(cur.conv), d: ch(cur.conv, prev.conv, false, true) },
    cur.hasAds && { k: "Ad spend", v: money(cur.adSpend), d: ch(cur.adSpend, prev.adSpend, true) },
    cur.hasAds && { k: "Ad sales", v: money(cur.adSales), d: ch(cur.adSales, prev.adSales) },
    cur.hasAds && { k: target ? `ACoS (all ads) · target ${Math.round(target * 100)}%` : "ACoS (all ads)", v: pct(cur.acos), d: ch(cur.acos, prev.acos, true, true) },
    cur.hasAds && cur.hasSales && { k: "TACoS", v: pct(cur.tacos), d: ch(cur.tacos, prev.tacos, true, true) },
    cur.hasAds && { k: "ROAS", v: cur.roas === null ? "—" : `${cur.roas.toFixed(2)}×`, d: ch(cur.roas, prev.roas) },
    cur.hasAds && { k: "Cost per click", v: cur.cpc === null ? "—" : `${sym}${cur.cpc.toFixed(2)}`, d: ch(cur.cpc, prev.cpc, true) },
  ].filter(Boolean) as { k: string; v: string; d: { t: string; c: string } | null }[];

  // Chart: sales and ad spend per day in range.
  const inRange = days.filter((d) => d >= from && d <= to);
  const W = 720, H = 170, P = { l: 8, r: 8, t: 10, b: 22 };
  const top = Math.max(1, ...inRange.map((d) => Math.max(daily[d].s ?? 0, daily[d].as ?? 0))) * 1.1;
  const X = (i: number) => P.l + (inRange.length < 2 ? (W - P.l - P.r) / 2 : (i / (inRange.length - 1)) * (W - P.l - P.r));
  const Y = (v: number) => P.t + (H - P.t - P.b) * (1 - v / top);
  const line = (k: "s" | "as") => inRange.map((d, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(daily[d][k] ?? 0).toFixed(1)}`).join("");
  const area = (k: "s" | "as") => inRange.length > 1 ? `${line(k)}L${X(inRange.length - 1)},${H - P.b}L${X(0)},${H - P.b}Z` : "";
  const label = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

  return (
    <section className="nm" aria-label="Your numbers">
      <div className="nm-h">
        <div><h3>Your numbers</h3><small>{label(from)} – {label(to)}{hasPrev ? " · vs the period before" : " · not enough history before this to compare"}</small></div>
        <div className="nm-range" role="group" aria-label="Date range">
          {PRESETS.map((p) => <button key={p} className={preset === p ? "on" : ""} onClick={() => { setPreset(p); track("numbers_range", { days: p }); }}>{p}d</button>)}
          <button className={preset === "custom" ? "on" : ""} onClick={() => setPreset("custom")}>Custom</button>
        </div>
      </div>
      {preset === "custom" && (
        <div className="nm-custom">
          <label>From <input type="date" min={first} max={cTo} value={cFrom} onChange={(e) => setCFrom(e.target.value)} /></label>
          <label>To <input type="date" min={cFrom} max={last} value={cTo} onChange={(e) => setCTo(e.target.value)} /></label>
        </div>
      )}
      {cur.costMissing && costs && (
        <p className="nm-costs">
          <b>Profit is too high until product costs are in.</b>{" "}
          {costs.missing.length ? <>Missing for {costs.missing.length} product{costs.missing.length === 1 ? "" : "s"}: {costs.missing.slice(0, 3).join(", ")}{costs.missing.length > 3 ? ` and ${costs.missing.length - 3} more` : ""}. </> : "Some sales had no product cost. "}
          <a href={costs.href}>Add cost per unit (1 minute) →</a>
        </p>
      )}
      <div className="nm-tiles">
        {tiles.map((t) => <div key={t.k} className="nm-t"><span>{t.k}</span><b>{t.v}</b>{t.d && <em className={t.d.c}>{t.d.t}</em>}</div>)}
      </div>
      {inRange.length > 1 && (
        <figure className="nm-chart">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Daily sales and ad spend">
            {cur.hasSales && <><path d={area("s")} className="nm-a-s" /><path d={line("s")} className="nm-l-s" /></>}
            {cur.hasAds && <><path d={area("as")} className="nm-a-as" /><path d={line("as")} className="nm-l-as" /></>}
            <text x={P.l} y={H - 6} className="nm-x">{label(inRange[0])}</text>
            <text x={W - P.r} y={H - 6} className="nm-x" textAnchor="end">{label(inRange.at(-1)!)}</text>
          </svg>
          <figcaption>{cur.hasSales && <span><i className="k-s" /> Total sales</span>}{cur.hasAds && <span><i className="k-as" /> Ad spend</span>}<span className="fine">Daily · up to yesterday · from Amazon</span></figcaption>
        </figure>
      )}
      <p className="fine">History goes back to {label(first)}. Amazon can still adjust the last 2–3 days.</p>
    </section>
  );
}
