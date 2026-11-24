"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { RoccoHead } from "@/components/Rocco";
import { Office } from "@/components/dash/Office";
import { officeAct } from "@/lib/client/office";
import type { OfficeEvent } from "@/lib/office";
import { BRAND, JOBS, LOG, SAVED, TERMS, type JobState } from "./data";

type Tab = "today" | "terms" | "log" | "autonomy" | "messages";
const TABS: { id: Tab; t: string }[] = [
  { id: "today", t: "Today" }, { id: "terms", t: "Search terms" }, { id: "log", t: "Change log" }, { id: "autonomy", t: "Autonomy & goals" }, { id: "messages", t: "Messages" },
];
type Level = "approve" | "guardrails" | "auto";

interface Step { tab?: Tab; focus?: string; cap: string; ms: number; act?: string; card?: "intro" | "price" | "outro" }
/** The guided tour (also the 2-minute demo film). ~2 minutes end to end. */
const TOUR: Step[] = [
  { card: "intro", cap: "Meet Rocco, your AI Amazon manager. Two minutes, one demo account.", ms: 5000 },
  { tab: "today", focus: "dm-hero", cap: "Every morning I read every search term, campaign, budget and SKU, then turn it into a few jobs, ranked by money.", ms: 9000 },
  { tab: "today", focus: "dm-pace", cap: "I watch budgets during the day too: this winner runs dry by 4 PM. One tap adds $40 for today.", ms: 8000, act: "pace" },
  { tab: "today", focus: "job-neg", cap: "Each job shows its evidence. Six searches got clicks and no orders, so I block them.", ms: 7000 },
  { tab: "today", focus: "job-neg", cap: "You approve. I check it with Amazon first, then make it in your account.", ms: 7000, act: "neg" },
  { tab: "today", focus: "job-bud", cap: "Every change is measured after 7 days, and the undo is armed.", ms: 7000, act: "bud" },
  { tab: "today", focus: "job-camp", cap: "Searches that already sell get their own exact campaign: built in Amazon in one tap.", ms: 8000, act: "camp" },
  { tab: "today", focus: "job-stock", cap: "Not just ads. When stock runs low, I create the FBA shipment plan in Amazon. You just box it.", ms: 9000, act: "stock" },
  { tab: "terms", focus: "dm-terms", cap: "Every search term, every day, with what I'm doing about it.", ms: 9000 },
  { tab: "log", focus: "dm-log", cap: "The change log: who approved what, and whether it worked. If something makes things worse, I put it back.", ms: 10000 },
  { tab: "autonomy", focus: "dm-ladder", cap: "You choose how much I do alone: approve every move, inside guardrails, or fully autonomous.", ms: 9000, act: "ladder" },
  { tab: "autonomy", focus: "dm-goals", cap: "Set a goal per product: profit, balance or growth. My bids and budgets follow it.", ms: 7000 },
  { tab: "messages", focus: "dm-phone", cap: "No dashboard habit needed. I nudge your team on iMessage, WhatsApp or Slack.", ms: 9000 },
  { card: "price", cap: "$279 a month, flat. Not 2% of your ad spend. Whole team, 3 Amazon accounts, every marketplace.", ms: 7000 },
  { card: "outro", cap: "Try me for 7 days on your own account. Not useful? Every cent back.", ms: 6000 },
];
export const TOUR_MS = TOUR.reduce((t, s) => t + s.ms, 0);

/** Demo account's morning (example data), replayed by the office like a real account's events. */
const at = (h: number, m: number) => { const d = new Date(); d.setHours(h, m, 0, 0); return d.toISOString(); };
const DEMO_EVENTS: OfficeEvent[] = [
  { at: at(6, 2), station: "dock", text: "Pulled ad search terms, ad campaigns, sales & traffic, FBA stock from Amazon" },
  { at: at(6, 3), station: "desk", text: "Ran the numbers on ad search terms: 4,812 searches · 6 wasted $214 last month" },
  { at: at(6, 3), station: "desk", text: "Ran the numbers on FBA stock: Bamboo Board 3-pack runs out in 9 days" },
  { at: at(6, 4), station: "lab", text: "Checked G2: worked · $212/mo less wasted" },
  { at: at(6, 4), station: "board", text: "Pinned 5 jobs to your board, worth ~$1,480/mo" },
];
const $ = (n: number) => `$${n.toLocaleString("en-US")}`;

export function DemoApp({ film = false }: { film?: boolean }) {
  const [tab, setTab] = useState<Tab>("today");
  const [st, setSt] = useState<Record<string, JobState>>({});
  const [paced, setPaced] = useState<JobState>("open");
  const [level, setLevel] = useState<Level>("approve");
  const [step, setStep] = useState<number | null>(null);
  const [phone, setPhone] = useState(0);
  const pane = useRef<HTMLDivElement>(null);

  const run = useCallback((id: string) => {
    if (id === "pace") { setPaced("checking"); setTimeout(() => setPaced("making"), 1200); setTimeout(() => setPaced("done"), 2600); return; }
    if (id === "ladder") { setTimeout(() => setLevel("guardrails"), 1500); return; }
    setSt((s) => ({ ...s, [id]: "checking" }));
    officeAct("dock", "Checking it with Amazon, then making it…");
    setTimeout(() => setSt((s) => ({ ...s, [id]: "making" })), 1300);
    setTimeout(() => { setSt((s) => ({ ...s, [id]: "done" })); officeAct("lab", "Done in Amazon ✓ I'll measure it in 7 days."); }, 3200);
  }, []);

  // Film: starts on window.__roccoFilm.start() (the recorder calls it once the page is ready), or after 1.5s on its own.
  useEffect(() => {
    if (!film) return;
    const w = window as unknown as { __roccoFilm?: { start: () => void; done: boolean } };
    w.__roccoFilm = { start: () => setStep((x) => (x === null ? 0 : x)), done: false };
    const auto = new URLSearchParams(location.search).has("manual") ? undefined : setTimeout(() => setStep((x) => (x === null ? 0 : x)), 1500);
    return () => { if (auto) clearTimeout(auto); };
  }, [film]);

  // Tour: switch tab, focus, act, advance.
  useEffect(() => {
    if (step === null) return;
    const s = TOUR[step];
    if (!s) { if (film) { (window as unknown as { __roccoFilm?: { done: boolean } }).__roccoFilm!.done = true; return; } setStep(null); return; }
    if (s.tab) setTab(s.tab);
    if (s.tab === "messages") { setPhone(0); [900, 2600, 4300, 6000].forEach((ms, i) => setTimeout(() => setPhone(i + 1), ms)); }
    const f = s.focus ? setTimeout(() => document.getElementById(s.focus!)?.scrollIntoView({ behavior: "smooth", block: "center" }), 250) : undefined;
    const a = s.act ? setTimeout(() => run(s.act!), 1800) : undefined;
    const n = setTimeout(() => setStep((x) => (x === null ? null : x + 1)), s.ms);
    return () => { clearTimeout(n); if (a) clearTimeout(a); if (f) clearTimeout(f); };
  }, [step, film, run]);

  const cur = step !== null ? TOUR[step] : film ? TOUR[0] : null;
  const focus = cur?.focus;
  const cls = (id: string) => (focus === id ? " dm-focus" : "");
  const doneVal = JOBS.filter((j) => st[j.id] === "done").reduce((t, j) => t + j.value, 0);

  return (
    <div className={`dm${film ? " dm-film" : ""}`}>
      {!film && (
        <div className="dm-bar">
          {step === null
            ? <span className="fine">Demo account, demo data. Click anything, or <button className="linkbtn" onClick={() => { setStep(0); track("demo_tour_started"); }}>play the guided tour here</button>.</span>
            : <span className="fine">Guided tour playing. <button className="linkbtn" onClick={() => setStep(null)}>Stop</button></span>}
        </div>
      )}
      <div className="dm-win">
        <div className="dm-chrome" aria-hidden><span /><span /><span /><em>rocco.works</em></div>
        <div className="dm-top">
          <div className="dm-acct"><i /> <b>{BRAND.name} · {BRAND.market}</b><small>checked {BRAND.checked}</small></div>
          <nav className="dm-tabs" aria-label="Demo sections">{TABS.map((t) => <button key={t.id} className={tab === t.id ? "on" : ""} onClick={() => { setTab(t.id); setStep(null); }}>{t.t}</button>)}</nav>
        </div>
        <div className="dm-pane" ref={pane}>
          {tab === "today" && (
            <>
              <Office events={DEMO_EVENTS} state={{ station: "bell", text: `${JOBS.length} jobs waiting for your OK` }} />
              <div id="dm-hero" className={`dm-hero${cls("dm-hero")}`}>
                <span className="dm-kick">Good morning</span>
                <h3>{JOBS.length} jobs today, worth <em>~$1,480/mo</em>.</h3>
                <p>Black Friday is Friday. Block the junk searches and fund the winners before peak traffic.</p>
                <div className="dm-roi"><span>Saved so far, measured</span><b>{$(SAVED.total + doneVal)}</b><em>{SAVED.times}× what I cost</em></div>
              </div>
              <div id="dm-pace" className={`dm-pace${cls("dm-pace")}`}>
                <span aria-hidden>⏱️</span>
                <div><b>SP | Cutting Board | Exact runs out of budget ~4 PM</b><small>$31 of $40 spent by 1 PM · 19% ACoS today</small></div>
                <button className="btn small" disabled={paced !== "open"} onClick={() => run("pace")}>{paced === "open" ? "+$40 today" : paced === "done" ? "✓ Done" : "Making it…"}</button>
              </div>
              <ul className="dm-jobs">
                {JOBS.map((j) => {
                  const s = st[j.id] ?? "open";
                  return (
                    <li key={j.id} id={`job-${j.id}`} className={`dm-job s-${s}${cls(`job-${j.id}`)}`}>
                      <div className="dm-jt"><span className="dm-ic" aria-hidden>{j.ic}</span><div><b>{j.title}{j.pick && <span className="dm-pick">Rocco&apos;s pick</span>}</b><small>{j.why}</small></div>{j.value > 0 && <span className="dm-v">~{$(j.value)}<small>/mo</small></span>}</div>
                      <ul className="dm-items">{j.items.map((it) => <li key={it.label}><span>{it.label}</span><small>{it.detail}</small>{it.v && <em>{it.v}</em>}</li>)}</ul>
                      <p className="dm-guard"><span>✓ Checked with Amazon first</span><span>⏱ Measured in 7 days</span><span>{j.undo ? "↩ Undo armed" : "↩ Logged with undo steps"}</span></p>
                      {s === "done"
                        ? <p className="dm-done"><span>✓</span> {j.done}. {j.kind === "restock" ? "Next: box it in Send to Amazon (5 min)." : "I'll check the result in a week."}</p>
                        : <div className="dm-act"><button className="btn" disabled={s !== "open"} onClick={() => { run(j.id); track("demo_approve", { job: j.id }); }}>{s === "open" ? j.btn : s === "checking" ? "Checking with Amazon…" : j.making}</button>{s === "open" && <button className="linkbtn muted">Skip</button>}</div>}
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {tab === "terms" && (
            <div id="dm-terms" className={`dm-sec${cls("dm-terms")}`}>
              <h3>Search terms · last 30 days</h3>
              <p className="fine">Every term read every day, with what I&apos;m doing about it.</p>
              <div className="dm-tw"><table className="dm-t"><thead><tr><th>Search term</th><th>Clicks</th><th>Spend</th><th>Orders</th><th>ACoS</th><th>Rocco</th></tr></thead>
                <tbody>{TERMS.map((r) => <tr key={r.term}><td>{r.term}</td><td>{r.clicks.toLocaleString()}</td><td>${r.spend.toLocaleString()}</td><td>{r.orders}</td><td>{r.acos === null ? "—" : `${r.acos}%`}</td><td><span className={`dm-tag t-${r.tone}`}>{r.act}</span></td></tr>)}</tbody></table></div>
            </div>
          )}

          {tab === "log" && (
            <div id="dm-log" className={`dm-sec${cls("dm-log")}`}>
              <h3>Change log</h3>
              <ul className="dm-log">{LOG.map((l) => <li key={l.code}><div><span className="dm-code">{l.code}</span><b>{l.what}</b></div><small>{l.when} · {l.who}</small><p className={`dm-res r-${l.tone}`}>{l.res}</p></li>)}</ul>
              <div className="dm-before"><b>Before Rocco</b><small>From Amazon&apos;s own change history: 1,284 changes in 90 days, 71% by hand, mostly bids raised on Mondays. Budgets ran out on 22 of 30 days.</small></div>
            </div>
          )}

          {tab === "autonomy" && (
            <div className="dm-sec">
              <h3>How much I do on my own</h3>
              <div id="dm-ladder" className={`dm-ladder${cls("dm-ladder")}`} role="radiogroup">
                {([["approve", "1", "Approve every move", "Nothing reaches Amazon until your team taps Approve."], ["guardrails", "2", "Inside guardrails", "I make money-saving changes myself each morning. Anything that spends more waits for you."], ["auto", "3", "Fully autonomous", "Every one-tap change, raises too. ±20% per step, 25 a day max."]] as const).map(([id, n, t, d]) => (
                  <button key={id} role="radio" aria-checked={level === id} className={level === id ? "on" : ""} onClick={() => setLevel(id)}><span className="gl-n">{n}</span><b>{t}</b><small>{d}</small></button>
                ))}
              </div>
              <div id="dm-goals" className={`dm-goals${cls("dm-goals")}`}>
                <h3>Goal per product</h3>
                {[["Cutting Board Large", "Profit"], ["Serving Tray", "Balance"], ["Knife Block (new)", "Growth"]].map(([p, g]) => (
                  <div key={p} className="dm-goal"><span>{p}</span><div className="gl-seg">{["Profit", "Balance", "Growth"].map((x) => <button key={x} className={x === g ? "on" : ""}>{x}</button>)}</div></div>
                ))}
                <label className="gl-undo"><input type="checkbox" defaultChecked /> <span><b>Undo automatically if it got worse.</b> After the 7-day check, I put the old bid or budget back.</span></label>
              </div>
            </div>
          )}

          {tab === "messages" && (
            <div id="dm-phone" className={`dm-phone${cls("dm-phone")}`}>
              <div className="dm-ph-top"><b>Rocco</b><small>iMessage</small></div>
              <div className="dm-thread">
                {phone >= 1 && <p className="in">☀️ Bamboo &amp; Co.: 5 jobs today, worth ~$1,480/mo.{"\n"}• G1+G2: Raise 2 budgets on winners{"\n"}• H1: New exact campaign{"\n"}Reply YES G1 G2 and I make them in Amazon.</p>}
                {phone >= 2 && <p className="in">🤖 Made 3 changes on my own (inside your guardrails), ~$240/mo. Each one is in the change log.</p>}
                {phone >= 3 && <p className="out">YES G1 G2</p>}
                {phone >= 4 && <p className="in">Done in Amazon ✅ 2 budgets raised. I&apos;ll check them next Monday.</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      {cur?.card && (
        <div className={`dm-card dm-card-${cur.card}`}>
          {cur.card === "intro" && <><svg className="dm-logo" viewBox="15 5 170 140" aria-hidden><RoccoHead mood="smirk" id="dmi" /></svg><h2>Rocco</h2><p>Your AI Amazon manager. You approve, I do the rest.</p></>}
          {cur.card === "price" && <><h2>$279/mo. Flat.</h2><p>Not 2% of your ad spend. Whole team · 3 Amazon accounts · every marketplace · ads and Seller Central.</p></>}
          {cur.card === "outro" && <><svg className="dm-logo" viewBox="15 5 170 140" aria-hidden><RoccoHead mood="wow" id="dmo" /></svg><h2>rocco.works</h2><p>Try me 7 days on your own account. Not useful? Every cent back.</p></>}
        </div>
      )}
      {cur && !cur.card && <div className="dm-cap" role="status"><svg className="dm-cap-av" viewBox="15 5 170 140" aria-hidden><RoccoHead mood="smirk" id="dmc" /></svg><p>{cur.cap}</p><i style={{ animationDuration: `${cur.ms}ms` }} key={step} /></div>}
      {cur?.card && film && <div className="dm-cap dm-cap-card" role="status"><p>{cur.cap}</p></div>}
    </div>
  );
}
