"use client";
import { useMemo, useState } from "react";
import { LoadingText } from "@/components/LoadingText";
import type { TidyItem, TidyPlan } from "@/lib/rules/tidy";
import type { TidyDone } from "@/lib/tidy-apply";

const $ = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const post = (body: object) => fetch("/api/w/tidy", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()).catch(() => null);

const WHY = [
  { t: "Read 200 campaigns in seconds", d: "Product, targeting and keyword in the name. Sort by name and the account reads like a table of contents." },
  { t: "See which product is bleeding", d: "One portfolio per product: spend, sales and ACoS per product in one row, and a budget cap if you want one." },
  { t: "Stop exact and broad fighting", d: "Mixed campaigns share one budget and one bid for very different intent. Split, each match type gets its own lever." },
  { t: "Less noise, faster decisions", d: "Campaigns with no impressions in 30 days get paused, so what's on is what matters. Rocco's daily jobs read cleaner too." },
];
const TAG: Record<string, string> = { Auto: "auto", Exact: "exact", Phrase: "phrase", Broad: "broad", Product: "pat", Category: "pat", Mixed: "mixed", Unknown: "mixed" };

export function TidyClient({ token, account, plan: initial, done: initialDone, paid, hire }: { token: string; account: { id: string; name: string } | null; plan: TidyPlan | null; done: TidyDone | null; paid: boolean; hire: string }) {
  const [plan, setPlan] = useState<TidyPlan | null>(initial);
  const [done, setDone] = useState<TidyDone | null>(initialDone);
  const [busy, setBusy] = useState<"" | "scan" | "apply" | "undo">("");
  const [err, setErr] = useState("");
  const [paused, setPaused] = useState(false);
  const [opt, setOpt] = useState({ rename: true, portfolios: true, pauseIdle: false });
  const [off, setOff] = useState<Set<string>>(new Set()); // products left out

  const groups = useMemo(() => {
    const m = new Map<string, TidyItem[]>();
    for (const i of plan?.items ?? []) m.set(i.product, [...(m.get(i.product) ?? []), i]);
    return [...m.entries()].map(([name, items]) => ({ name, items, spend: items.reduce((t, i) => t + i.spend, 0), sales: items.reduce((t, i) => t + i.sales, 0) })).sort((a, b) => b.spend - a.spend);
  }, [plan]);
  const chosen = (plan?.items ?? []).filter((i) => !off.has(i.product));
  const counts = { rename: chosen.filter((i) => i.rename).length, portfolios: new Set(chosen.filter((i) => i.portfolio).map((i) => i.portfolio)).size, idle: chosen.filter((i) => i.issue === "idle").length };

  async function scan() {
    setBusy("scan"); setErr("");
    const d = await post({ t: token, account: account?.id, action: "scan", includePaused: paused });
    setBusy("");
    if (d?.plan) { setPlan(d.plan); setDone(null); setOff(new Set()); } else setErr(d?.error ?? "Couldn't reach Rocco. Try again.");
  }
  async function apply() {
    setBusy("apply"); setErr("");
    const d = await post({ t: token, account: account?.id, action: "apply", ...opt, ids: chosen.map((i) => i.id) });
    setBusy("");
    if (d?.done) setDone(d.done); else setErr(d?.error ?? "Couldn't reach Rocco. Try again.");
  }
  async function undo() {
    setBusy("undo"); setErr("");
    const d = await post({ t: token, account: account?.id, action: "undo" });
    setBusy("");
    if (d?.ok) setDone(null); else setErr((d?.errors ?? [d?.error ?? "Couldn't undo."]).join(" "));
  }

  if (!paid) return <div className="td-empty"><h1>Tidy your campaigns</h1><p>Hire Rocco to scan and restructure your campaigns.</p><a className="btn" href={hire}>Hire Rocco</a></div>;
  if (!account) return <div className="td-empty"><h1>Tidy your campaigns</h1><p>Connect your Amazon first, then come back here.</p></div>;

  const readablePct = plan && plan.total ? Math.round((plan.readable / plan.total) * 100) : 0;
  return (
    <div className="td-wrap">
      <span className="h5-kicker">Real work without the fluff</span>
      <h1>Tidy your campaigns</h1>
      <p className="td-lede">The best ads managers can read hundreds of campaigns at a glance because every name follows one system. I&apos;ll rename yours to <code>SP | Product | Targeting | Keyword</code>, group them into one portfolio per product, and flag what&apos;s dead weight.</p>

      {!plan && (
        <>
          <ul className="td-why">{WHY.map((w) => <li key={w.t}><b>{w.t}</b><span>{w.d}</span></li>)}</ul>
          <div className="td-start">
            <button className="btn" disabled={!!busy} onClick={scan}>{busy === "scan" ? "Scanning…" : `Scan ${account.name}'s campaigns →`}</button>
            <label className="td-check"><input type="checkbox" checked={paused} onChange={(e) => setPaused(e.target.checked)} /> Include paused campaigns</label>
            <p className="fine">Nothing changes until you approve. Takes about a minute.</p>
          </div>
        </>
      )}
      {busy === "scan" && <LoadingText steps={["Reading every campaign and its state…", "Reading keywords, match types and product targets…", "Matching each campaign to the product it advertises…", "Checking 30 days of impressions, spend and sales…", "Writing new names and grouping by product…"]} every={9000} />}

      {plan && (
        <>
          <div className="td-score">
            <div className="td-ring" style={{ ["--p" as string]: `${readablePct}` }}><b>{plan.readable}</b><small>of {plan.total}</small></div>
            <div>
              <h2>{plan.readable === plan.total ? "Your campaigns already read well." : `${plan.total - plan.readable} of ${plan.total} live campaigns are hard to read.`}</h2>
              <p className="muted">After tidying: all {plan.total} follow one system, in {plan.products.length} product group{plan.products.length === 1 ? "" : "s"}.</p>
              <ul className="td-chips">
                <li>✏️ {counts.rename} to rename</li>
                <li>🗂️ {counts.portfolios} portfolio{counts.portfolios === 1 ? "" : "s"} to add</li>
                {plan.idle > 0 && <li>💤 {plan.idle} with no impressions in 30 days</li>}
                {plan.mixed > 0 && <li>🔀 {plan.mixed} mixing match types</li>}
              </ul>
            </div>
          </div>

          <details className="td-whybox"><summary>Why tidy? (what top 1% ads managers do)</summary><ul className="td-why">{WHY.map((w) => <li key={w.t}><b>{w.t}</b><span>{w.d}</span></li>)}</ul></details>

          <div className="td-groups">
            {groups.map((g, gi) => (
              <details key={g.name} className={`td-group${off.has(g.name) ? " is-off" : ""}`} open={gi < 2}>
                <summary>
                  <input type="checkbox" checked={!off.has(g.name)} onClick={(e) => e.stopPropagation()} onChange={() => setOff((s) => { const n = new Set(s); if (n.has(g.name)) n.delete(g.name); else n.add(g.name); return n; })} aria-label={`Include ${g.name}`} />
                  <b>{g.name}</b>
                  <span className="td-g-meta">{g.items.length} campaign{g.items.length === 1 ? "" : "s"} · {$(g.spend)} spend · {g.spend > 0 ? `${Math.round((g.spend / Math.max(g.sales, 1)) * 100)}% ACoS` : "no spend"}</span>
                </summary>
                <ul className="td-rows">
                  {g.items.map((i) => (
                    <li key={i.id}>
                      <span className="td-old">{i.oldName}</span>
                      <span className="td-arrow" aria-hidden>→</span>
                      <span className="td-new">{i.rename ? i.newName : <em className="muted">keeps its name</em>}</span>
                      <span className={`td-tag t-${TAG[i.targeting]}`}>{i.targeting}</span>
                      {i.note && <span className={`td-note n-${i.issue}`}>{i.issue === "idle" ? "💤" : i.issue === "mixed" ? "🔀" : "❔"} {i.note}</span>}
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>

          {!done && (
            <div className="td-apply">
              <label className="td-check"><input type="checkbox" checked={opt.rename} onChange={(e) => setOpt((o) => ({ ...o, rename: e.target.checked }))} /> Rename {counts.rename} campaigns</label>
              <label className="td-check"><input type="checkbox" checked={opt.portfolios} onChange={(e) => setOpt((o) => ({ ...o, portfolios: e.target.checked }))} /> Add {counts.portfolios} product portfolio{counts.portfolios === 1 ? "" : "s"} (no budget cap)</label>
              {counts.idle > 0 && <label className="td-check"><input type="checkbox" checked={opt.pauseIdle} onChange={(e) => setOpt((o) => ({ ...o, pauseIdle: e.target.checked }))} /> Pause {counts.idle} campaigns with no impressions in 30 days</label>}
              <button className="btn" disabled={!!busy || (!opt.rename && !opt.portfolios && !opt.pauseIdle)} onClick={apply}>{busy === "apply" ? "Tidying in Amazon…" : "Tidy my campaigns"}</button>
              <p className="fine">Checked with Amazon first, logged, and one tap to undo (old names back, paused ones back on). Bids, budgets and targeting don&apos;t change.</p>
              {busy === "apply" && <LoadingText steps={["Checking every change with Amazon first…", opt.portfolios ? "Creating product portfolios…" : "Preparing new names…", opt.rename ? "Renaming campaigns in batches of 100…" : "Moving campaigns…", opt.portfolios ? "Moving each campaign into its product portfolio…" : "Almost done…", opt.pauseIdle ? "Pausing campaigns that did nothing…" : "Saving an undo point…"]} every={6000} />}
            </div>
          )}

          {done && (
            <div className="td-done">
              <p><span className="rd-tick" aria-hidden>✓</span> <b>Tidied.</b> {done.renamed.length} renamed{done.portfolios.length ? ` · ${done.portfolios.length} portfolios` : ""}{done.paused.length ? ` · ${done.paused.length} paused` : ""}. Sort by name in the Ads console and see the difference.</p>
              {done.errors.length > 0 && <p className="rd-fail">⚠️ {done.errors.slice(0, 3).join(" ")}</p>}
              <button className="btn ghost small" disabled={!!busy} onClick={undo}>{busy === "undo" ? "Putting it back…" : "Undo"}</button>
              {busy === "undo" && <LoadingText steps={["Putting the old names back…", "Turning paused campaigns back on…"]} every={4000} />}
            </div>
          )}
          {plan.mixed > 0 && <p className="fine">🔀 Mixed campaigns: split them by match type in the Ads console (copy the campaign, keep one match type in each). Rocco will offer this as a one-tap job soon.</p>}
          <p className="fine"><button className="linkbtn" disabled={!!busy} onClick={scan}>Scan again</button> · last scan {new Date(plan.at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
        </>
      )}
      {err && <p className="err" role="status">{err}</p>}
    </div>
  );
}
