"use client";
import { useEffect, useMemo, useState } from "react";
import type { ActionPlan } from "@/lib/action-agent";
import { AREAS, DOE_ACTIONS, USED_BY_JOBS, type DoeAction } from "@/lib/doe-actions";

const EXAMPLES = [
  "Pause the campaign with the highest ACoS this month",
  "Add \"free\" as a negative exact keyword to all my auto campaigns",
  "Set the price of SKU HN-JOURNAL-01 to $24.99",
  "What would Amazon charge in fees if I sold SKU HN-JOURNAL-01 at $19.99?",
  "Send a review request for my orders delivered last week",
  "Create a removal order to return my aged stock of SKU HN-OLD-02",
];

type Reply = { plan?: ActionPlan; answer?: string; question?: string; error?: string };

/** "Tell Rocco what to change" + every Action Rocco can make, grouped by area. */
export function ActionsStudio({ token, account, accountLabel }: { token: string; account: string; accountLabel: string }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<"" | "plan" | "run">("");
  const [reply, setReply] = useState<Reply | null>(null);
  const [sure, setSure] = useState(false);
  const [history, setHistory] = useState<ActionPlan[]>([]);
  const [q, setQ] = useState("");
  const post = (body: Record<string, unknown>) => fetch("/api/w/actions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ t: token, account, ...body }) }).then((r) => r.json()).catch(() => ({ ok: false, error: "Network hiccup. Try again." }));
  const load = () => post({ op: "list" }).then((r) => r.ok && setHistory(r.plans ?? []));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function plan(t = text) {
    if (!t.trim()) return;
    setBusy("plan"); setReply(null); setSure(false);
    const r = await post({ op: "plan", text: t });
    setReply(r.plan ? { plan: r.plan } : r.answer ? { answer: r.answer } : r.question ? { question: r.question } : { error: r.error ?? "Rocco couldn't work that out." });
    setBusy("");
  }
  async function run() {
    if (!reply?.plan) return;
    setBusy("run");
    const r = await post({ op: "run", id: reply.plan.id, sure });
    setReply(r.plan ? { plan: r.plan, ...(r.ok ? {} : { error: r.error ?? r.plan.error }) } : { ...reply, error: r.error });
    setBusy(""); load();
  }
  async function cancel() { if (reply?.plan) await post({ op: "cancel", id: reply.plan.id }); setReply(null); load(); }

  const meta = reply?.plan ? DOE_ACTIONS.find((a) => a.type === reply.plan!.type) : undefined;
  const shown = useMemo(() => DOE_ACTIONS.filter((a) => !q || `${a.what} ${a.type}`.toLowerCase().includes(q.toLowerCase())), [q]);

  return (
    <div className="ac">
      <section className="ac-ask">
        <label htmlFor="ac-text"><b>Tell Rocco what to change in {accountLabel}</b></label>
        <textarea id="ac-text" rows={3} value={text} placeholder="e.g. Pause the campaign with the highest ACoS this month" onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) plan(); }} />
        <div className="ac-row">
          <button className="btn" disabled={!!busy || text.trim().length < 4} onClick={() => plan()}>{busy === "plan" ? "Rocco is checking with Amazon…" : "Show me the change"}</button>
          <span className="fine">Nothing changes until you approve. Rocco checks it with Amazon first (a free dry run).</span>
        </div>
        <div className="ac-ex">{EXAMPLES.map((x) => <button key={x} className="ac-chip" onClick={() => { setText(x); plan(x); }}>{x}</button>)}</div>
      </section>

      {reply && (
        <section className={`ac-reply${reply.plan?.status === "done" ? " ok" : reply.error ? " bad" : ""}`} aria-live="polite">
          {reply.answer && <p className="ac-answer">🦝 {reply.answer}</p>}
          {reply.question && <p className="ac-answer">🦝 {reply.question} <span className="fine">(add it to your request above and ask again)</span></p>}
          {reply.plan && (
            <>
              <div className="ac-head"><span className={`ac-badge r-${meta?.risk ?? "normal"}`}>{meta?.risk === "high" ? "Needs care" : "Change"}</span><code>{reply.plan.type}</code></div>
              <h3>{reply.plan.summary}</h3>
              {reply.plan.lines.length > 0 && <ul>{reply.plan.lines.map((l, i) => <li key={i}>{l}</li>)}</ul>}
              <p className="fine">✓ Amazon's dry run passed · {meta?.undo ? `Undo: ${meta.undo}` : "This one can't be undone automatically."}</p>
              {reply.plan.status === "planned" && (
                <div className="ac-row">
                  {meta?.risk === "high" && <label className="ac-sure"><input type="checkbox" checked={sure} onChange={(e) => setSure(e.target.checked)} /> I understand this can&apos;t simply be undone</label>}
                  <button className="btn" disabled={!!busy || (meta?.risk === "high" && !sure)} onClick={run}>{busy === "run" ? "Making it in Amazon…" : "Approve · make it in Amazon"}</button>
                  <button className="linkbtn" onClick={cancel}>Cancel</button>
                </div>
              )}
              {reply.plan.status === "done" && <p className="ac-done">✓ {reply.plan.result} Logged under your name.</p>}
            </>
          )}
          {reply.error && <p className="err">{reply.error}</p>}
        </section>
      )}

      {history.length > 0 && (
        <section className="ac-hist">
          <h3>Recent</h3>
          <ul>{history.slice(0, 10).map((p) => <li key={p.id}><span className={`ac-dot s-${p.status}`} /> <b>{p.summary}</b> <small>{new Date(p.at).toLocaleString()} · {p.by} · {p.status === "done" ? "made in Amazon" : p.status}</small></li>)}</ul>
        </section>
      )}

      <section className="ac-cat">
        <div className="ac-cat-h"><h2>Everything Rocco can do in Amazon</h2><input type="search" placeholder="Search: price, negative, removal…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search actions" /></div>
        <p className="fine">{DOE_ACTIONS.filter((a) => a.mode === "W").length} kinds of change and {DOE_ACTIONS.filter((a) => a.mode === "R").length} lookups through Amazon&apos;s official APIs. <b>Daily</b> = Rocco already does it from today&apos;s jobs.</p>
        {AREAS.map((ar) => {
          const items = shown.filter((a) => a.area === ar.id);
          if (!items.length) return null;
          return (
            <details key={ar.id} className="ac-area" open={!!q || ar.id === "ads" || ar.id === "listings"}>
              <summary><span aria-hidden>{ar.icon}</span> <b>{ar.label}</b> <small>{items.length}</small>{ar.blurb && <em>{ar.blurb}</em>}</summary>
              <ul>{items.map((a) => <Row key={a.type} a={a} onAsk={() => { setText(`${a.what}: `); document.getElementById("ac-text")?.focus(); window.scrollTo({ top: 0, behavior: "smooth" }); }} />)}</ul>
            </details>
          );
        })}
      </section>
    </div>
  );
}

function Row({ a, onAsk }: { a: DoeAction; onAsk: () => void }) {
  return (
    <li className="ac-item">
      <div><b>{a.what}</b><small>{a.mode === "W" ? "Change" : "Lookup"}{a.risk === "high" ? " · needs care" : ""}{USED_BY_JOBS.has(a.type) ? " · Daily" : ""}{/Vendors/.test(a.who) && !/Sellers/.test(a.who) ? " · Vendor only" : ""}</small></div>
      <button className="linkbtn" onClick={onAsk}>Ask →</button>
    </li>
  );
}
