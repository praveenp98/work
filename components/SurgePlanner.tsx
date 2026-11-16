"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { download } from "@/lib/readTable";
import { toCsv } from "@/lib/rules/export";
import { surgePlan, SURGE_RULES, type Aggression } from "@/lib/rules/surge";

const $ = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

export function SurgePlanner() {
  const [budget, setBudget] = useState(150);
  const [target, setTarget] = useState(30);
  const [be, setBe] = useState(45);
  const [agg, setAgg] = useState<Aggression>("normal");
  const p = useMemo(() => surgePlan({ dailyBudget: budget, targetAcos: target / 100, breakevenAcos: be / 100, aggression: agg }), [budget, target, be, agg]);
  const csv = () =>
    toCsv([
      ["Date", "Day", "Phase", "Daily budget", "Budget x", "Winner bid change", "Top-of-search adj.", "ACoS ceiling", "Budget checks", "Note"],
      ...p.days.map((d) => [d.date, d.label, d.phase, d.budget, d.budgetMult, `+${d.winnerBidPct}%`, `+${d.topOfSearchPct}%`, `${Math.round(d.acosCeiling * 100)}%`, d.checks, d.note]),
    ]);
  return (
    <div className="tool">
      <div className="row">
        <label className="f">Total daily ad budget today ($)<input type="number" min={1} value={budget} onChange={(e) => setBudget(Number(e.target.value) || 0)} /></label>
        <label className="f">Target ACoS (%)<input type="number" value={target} onChange={(e) => setTarget(Number(e.target.value) || 0)} /></label>
        <label className="f">Breakeven ACoS (%) <Link href="/tools/breakeven-acos" className="fine">calculate</Link><input type="number" value={be} onChange={(e) => setBe(Number(e.target.value) || 0)} /></label>
        <label className="f">How bold?<select value={agg} onChange={(e) => setAgg(e.target.value as Aggression)}><option value="careful">Careful (thin margins)</option><option value="normal">Normal</option><option value="bold">Bold (strong margins, deep stock)</option></select></label>
      </div>
      {p.warnings.map((w) => <p key={w} className="warn" style={{ fontWeight: 700, marginTop: 12 }}>⚠ {w}</p>)}
      <div className="stats" style={{ marginTop: 16 }}>
        <div className="stat"><b>{$(p.totalBudget)}</b><span>total budget Nov 19 – Dec 2</span></div>
        <div className="stat"><b>{$(p.extraBudget)}</b><span>extra vs. your normal budget</span></div>
        <div className="stat"><b>{$(p.days.find((d) => d.date === "2026-11-27")!.budget)}</b><span>Black Friday daily budget</span></div>
      </div>
      <div className="tablewrap">
        <table className="fixes surge">
          <thead><tr><th>Day</th><th>Budget</th><th>Winner bids (vs. normal)</th><th>Top of search</th><th>Cut above ACoS</th><th>Checks</th><th>Rocco says</th></tr></thead>
          <tbody>
            {p.days.map((d) => (
              <tr key={d.date} className={d.phase === "peak" ? "peak" : ""}>
                <td><b>{d.label}</b></td>
                <td className="mult">{$(d.budget)} <span className="fine">×{d.budgetMult}</span></td>
                <td>{d.winnerBidPct ? `+${d.winnerBidPct}%` : "normal"}</td>
                <td>{d.topOfSearchPct ? `+${d.topOfSearchPct}%` : "–"}</td>
                <td>{Math.round(d.acosCeiling * 100)}%</td>
                <td>{d.checks}×</td>
                <td className="fine">{d.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="row" style={{ marginTop: 14 }}>
        <button className="btn small" onClick={() => download("rocco-bfcm-surge-plan.csv", csv())}>Download plan (.csv)</button>
        <Link className="btn ghost small" href="/tools/ad-roast?utm_source=surge&utm_medium=tool">Roast first: find what NOT to boost</Link>
      </div>
      <h3 style={{ marginTop: 22 }}>Rocco&apos;s surge rules</h3>
      <ul>{SURGE_RULES.map((r) => <li key={r}>{r}</li>)}</ul>
    </div>
  );
}
