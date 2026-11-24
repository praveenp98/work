"use client";
import { useState } from "react";
import { track } from "@/lib/analytics";

type Goal = "profit" | "balance" | "growth";
interface Row { match: string; goal: Goal }
const GOALS: { id: Goal; t: string; d: string }[] = [
  { id: "profit", t: "Profit", d: "20% under target" },
  { id: "balance", t: "Balance", d: "your target" },
  { id: "growth", t: "Growth", d: "30% over, for rank" },
];

/**
 * Target ACoS for the account + a goal per product. Products are matched by a word in their campaign names
 * (Tidy puts the product in every name). Rocco's bid, harvest and budget jobs use the product's target.
 */
export function GoalsCard({ token, brand, target, initial, suggestions, autoUndo = false }: { token: string; brand: string; target: number; initial: Row[]; suggestions: string[]; autoUndo?: boolean }) {
  const [undo, setUndo] = useState(autoUndo);
  const [acos, setAcos] = useState(Math.round(target * 100));
  const [rows, setRows] = useState<Row[]>(initial.length ? initial : []);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const unused = suggestions.filter((s) => !rows.some((r) => r.match.toLowerCase() === s.toLowerCase())).slice(0, 6);

  async function save() {
    setBusy(true); setMsg("");
    const d = await fetch("/api/w/goals", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ t: token, brand, targetAcos: acos / 100, goals: rows.filter((r) => r.match.trim()), autoUndo: undo }) }).then((r) => r.json()).catch(() => null);
    setBusy(false);
    setMsg(d?.ok ? "Saved. Tomorrow's jobs use these goals." : d?.error ?? "Couldn't save. Try again.");
    if (d?.ok) track("goals_saved", { products: rows.length, target: acos });
  }

  return (
    <div className="rd-card gl">
      <h3>Goals</h3>
      <label className="gl-t">Target ACoS for this account
        <span><input type="number" min={5} max={100} value={acos} onChange={(e) => setAcos(Math.max(5, Math.min(100, Math.round(Number(e.target.value) || 0))))} />%</span>
      </label>
      <p className="fine">Per product: pick a word from its campaign names, then the goal. Profit tightens the target, Growth loosens it to buy rank.</p>
      <ul className="gl-rows">
        {rows.map((r, i) => (
          <li key={i}>
            <input placeholder="e.g. Morning Journal" value={r.match} maxLength={40} onChange={(e) => setRows((x) => x.map((y, j) => (j === i ? { ...y, match: e.target.value } : y)))} aria-label="Word in the product's campaign names" />
            <div className="gl-seg" role="radiogroup" aria-label="Goal">
              {GOALS.map((g) => <button key={g.id} type="button" role="radio" aria-checked={r.goal === g.id} className={r.goal === g.id ? "on" : ""} title={g.d} onClick={() => setRows((x) => x.map((y, j) => (j === i ? { ...y, goal: g.id } : y)))}>{g.t}</button>)}
            </div>
            <button type="button" className="linkbtn muted" aria-label="Remove" onClick={() => setRows((x) => x.filter((_, j) => j !== i))}>✕</button>
          </li>
        ))}
      </ul>
      <div className="gl-add">
        {unused.map((s) => <button key={s} type="button" className="chip" onClick={() => setRows((x) => [...x, { match: s, goal: "balance" }])}>+ {s}</button>)}
        {rows.length < 30 && <button type="button" className="linkbtn" onClick={() => setRows((x) => [...x, { match: "", goal: "balance" }])}>+ Add a product</button>}
      </div>
      <label className="gl-undo"><input type="checkbox" checked={undo} onChange={(e) => setUndo(e.target.checked)} /> <span><b>Undo automatically if it got worse.</b> When a bid or budget change I made hurts after a week, I put the old value back in Amazon and tell you in the change log.</span></label>
      <button className="btn small" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save goals"}</button>
      {msg && <p className="fine" role="status">{msg}</p>}
    </div>
  );
}
