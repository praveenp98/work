"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { track } from "@/lib/analytics";

type Goal = "profit" | "balance" | "growth";
type Level = "approve" | "guardrails" | "auto";
export interface StrategyInit {
  mainGoal?: Goal; targetAcos: number; breakevenAcos?: number; monthlyAdBudget?: number;
  protectedCampaigns?: string[]; protectedTerms?: string[]; goals?: { match: string; goal: Goal }[]; notes?: string;
}

const GOALS: { id: Goal; ic: string; t: string; d: string; acos: number }[] = [
  { id: "profit", ic: "💰", t: "Profit first", d: "Cut waste, protect margin, scale only clear winners.", acos: 20 },
  { id: "balance", ic: "⚖️", t: "Balance", d: "Grow sales at a steady ACoS.", acos: 30 },
  { id: "growth", ic: "🚀", t: "Growth first", d: "Buy rank and new customers. Higher ACoS for a while.", acos: 40 },
];
const LEVELS: { id: Level; t: string; d: string }[] = [
  { id: "approve", t: "Ask me first", d: "Nothing reaches Amazon until someone taps Approve. Best to start." },
  { id: "guardrails", t: "Inside guardrails", d: "I make money-saving moves myself; anything that spends more waits." },
  { id: "auto", t: "Fully autonomous", d: "Every one-tap change inside your limits, logged and undoable." },
];
const join = (a?: string[]) => [...new Set(a ?? [])].join(", ");

/**
 * "You set the strategy, I do the work": the owner's plan for one account, asked once during onboarding (while
 * Amazon's first load runs) and shown back as plain-English commitments. Saved via /api/w/strategy.
 */
export function StrategyCard({ token, brand, init, plan: plan0, suggestions = [], autonomy = "approve", startOpen }: {
  token: string; brand: string; init: StrategyInit; plan?: string[] | null; suggestions?: string[]; autonomy?: Level; startOpen?: boolean;
}) {
  const router = useRouter();
  const [plan, setPlan] = useState<string[] | null>(plan0 ?? null);
  const [open, setOpen] = useState(startOpen ?? !plan0);
  const [goal, setGoal] = useState<Goal>(init.mainGoal ?? "balance");
  const [acos, setAcos] = useState(Math.round(init.targetAcos * 100));
  const [touched, setTouched] = useState(!!init.mainGoal);
  const [margin, setMargin] = useState(init.breakevenAcos ? String(Math.round(init.breakevenAcos * 100)) : "");
  const [budget, setBudget] = useState(init.monthlyAdBudget ? String(init.monthlyAdBudget) : "");
  const [protect, setProtect] = useState(join([...(init.protectedCampaigns ?? []), ...(init.protectedTerms ?? [])]));
  const [rows, setRows] = useState(init.goals ?? []);
  const [level, setLevel] = useState<Level>(autonomy);
  const [notes, setNotes] = useState(init.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const unused = suggestions.filter((s) => !rows.some((r) => r.match.toLowerCase() === s.toLowerCase())).slice(0, 6);

  function pick(g: Goal) {
    setGoal(g);
    if (!touched) setAcos(GOALS.find((x) => x.id === g)!.acos); // preset until they set their own number
  }

  async function save() {
    setBusy(true); setErr("");
    const words = protect.split(",").map((s) => s.trim()).filter(Boolean);
    const d = await fetch("/api/w/strategy", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ t: token, brand, mainGoal: goal, targetAcos: acos / 100, marginPct: margin, monthlyAdBudget: budget, protectedCampaigns: words, protectedTerms: words, goals: rows.filter((r) => r.match.trim()), autonomy: level, notes }),
    }).then((r) => r.json()).catch(() => null);
    setBusy(false);
    if (!d?.ok) { setErr(d?.error ?? "Couldn't save. Try again."); return; }
    setPlan(d.plan); setOpen(false);
    track("strategy_saved", { goal, target: acos, budget: !!budget, margin: !!margin, protect: words.length, products: rows.length, autonomy: level, first: !plan0 });
    router.refresh();
  }

  if (!open && plan) return (
    <section className="st st-done" aria-label="Your strategy">
      <div className="st-h">
        <div><span className="st-k">Your strategy · {brand}</span><h3>Here&apos;s how I&apos;ll run it</h3></div>
        <button className="linkbtn" onClick={() => setOpen(true)}>Edit</button>
      </div>
      <ol className="st-plan">{plan.map((l) => <li key={l}>{l}</li>)}</ol>
      <p className="fine">Every job I suggest follows this. Change it any time; the next morning&apos;s jobs use the new plan.</p>
    </section>
  );

  if (!open) return (
    <section className="st st-tease" aria-label="Set your strategy">
      <div><b>Set my strategy for {brand}</b><small>Profit or growth, your target, a budget limit, what never to cut. 1 minute; every job follows it.</small></div>
      <button className="btn small" onClick={() => setOpen(true)}>Set strategy →</button>
    </section>
  );

  return (
    <section className="st" aria-label="Set your strategy">
      <div className="st-h">
        <div>
          <span className="st-k">{plan ? `Edit strategy · ${brand}` : "1 minute · while Amazon sends your data"}</span>
          <h3>{plan ? "Your strategy" : "You set the strategy. I do the work."}</h3>
          {!plan && <p className="fine">Tell me what you want from this account. My first diagnosis, and every job after it, follows this plan.</p>}
        </div>
        {plan && <button className="linkbtn" onClick={() => setOpen(false)}>Cancel</button>}
      </div>

      <fieldset className="st-q">
        <legend>1. What matters most right now?</legend>
        <div className="st-goals" role="radiogroup">
          {GOALS.map((g) => (
            <button key={g.id} type="button" role="radio" aria-checked={goal === g.id} className={`st-goal${goal === g.id ? " on" : ""}`} onClick={() => pick(g.id)}>
              <span className="st-ic" aria-hidden>{g.ic}</span><b>{g.t}</b><small>{g.d}</small>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="st-q st-row">
        <legend>2. Your numbers</legend>
        <label><span className="st-l">Target ACoS</span>
          <span className="st-in"><input type="number" inputMode="numeric" min={5} max={100} value={acos} onChange={(e) => { setTouched(true); setAcos(Number(e.target.value)); }} /><i>%</i></span>
        </label>
        <label><span className="st-l">Margin before ads <small>(optional)</small></span>
          <span className="st-in"><input type="number" inputMode="numeric" min={5} max={95} placeholder="e.g. 35" value={margin} onChange={(e) => setMargin(e.target.value)} /><i>%</i></span>
          <small className="st-help">Price minus product, fees and shipping. Sets your break-even: I never let a campaign sit above it.</small>
        </label>
        <label><span className="st-l">Monthly ad budget limit <small>(optional)</small></span>
          <span className="st-in"><i>$</i><input type="number" inputMode="numeric" min={30} placeholder="No limit" value={budget} onChange={(e) => setBudget(e.target.value)} /></span>
          <small className="st-help">I won&apos;t raise budgets past this, even for winners.</small>
        </label>
      </fieldset>

      <fieldset className="st-q">
        <legend>3. Never cut <small>(optional)</small></legend>
        <input className="st-text" placeholder="Your brand name, launch or brand-defense campaigns, hero keywords (comma-separated)" value={protect} onChange={(e) => setProtect(e.target.value)} />
        <small className="st-help">Searches and campaigns with these words are never blocked or cut, even when they look expensive. Your brand name is protected automatically: I never block it or lower its bids.</small>
      </fieldset>

      <fieldset className="st-q">
        <legend>4. Products with a different goal <small>(optional)</small></legend>
        {rows.map((r, i) => (
          <div key={i} className="st-prod">
            <input className="st-text" placeholder="Word in its campaign names, e.g. 3-pack" value={r.match} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, match: e.target.value } : x)))} />
            <select value={r.goal} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, goal: e.target.value as Goal } : x)))}>
              <option value="profit">Profit</option><option value="balance">Balance</option><option value="growth">Growth</option>
            </select>
            <button type="button" className="linkbtn muted" aria-label="Remove" onClick={() => setRows(rows.filter((_, j) => j !== i))}>✕</button>
          </div>
        ))}
        <div className="st-sugg">
          {unused.map((s) => <button key={s} type="button" className="st-chip" onClick={() => setRows([...rows, { match: s, goal: goal === "growth" ? "profit" : "growth" }])}>+ {s}</button>)}
          {rows.length < 30 && <button type="button" className="st-chip" onClick={() => setRows([...rows, { match: "", goal: "growth" }])}>+ Add a product</button>}
        </div>
        <small className="st-help">E.g. a new launch on Growth while the rest runs for profit. Profit = 20% under your target, Growth = 30% over.</small>
      </fieldset>

      <fieldset className="st-q">
        <legend>5. How much I do on my own</legend>
        <div className="st-levels" role="radiogroup">
          {LEVELS.map((l) => (
            <button key={l.id} type="button" role="radio" aria-checked={level === l.id} className={`st-level${level === l.id ? " on" : ""}`} onClick={() => setLevel(l.id)}>
              <b>{l.t}</b><small>{l.d}</small>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="st-q">
        <legend>6. Anything I should know? <small>(optional)</small></legend>
        <textarea className="st-text" rows={3} maxLength={600} placeholder="Launching a new flavor in March. Q4 is 40% of our year. Don't touch the Bamboo Board 3-pack until it's back in stock." value={notes} onChange={(e) => setNotes(e.target.value)} />
      </fieldset>

      <div className="st-act">
        <button className="btn" disabled={busy} onClick={save}>{busy ? "Saving…" : plan ? "Save strategy" : "Set my strategy →"}</button>
        {err && <p className="st-err" role="alert">{err}</p>}
      </div>
    </section>
  );
}
