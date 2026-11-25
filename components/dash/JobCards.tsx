"use client";
import { track } from "@/lib/analytics";
import { officeAct } from "@/lib/client/office";
import { money, USD, type Currency } from "@/lib/currency";
import { useState } from "react";
import { LoadingText } from "@/components/LoadingText";
import type { Job } from "@/lib/jobs";
import { RestockPanel, type RestockCtx } from "./RestockPanel";

type Res = { status: "applied" | "manual" | "failed" | "queued"; how?: string; reason?: string };
const REASONS = [
  { id: "done", icon: "✅", label: "Already done" },
  { id: "strategy", icon: "🧭", label: "Not my strategy" },
  { id: "risky", icon: "⚠️", label: "Too risky right now" },
  { id: "numbers", icon: "🔢", label: "Numbers look off" },
  { id: "later", icon: "⏰", label: "Not now" },
];
const LEARN: Record<string, string> = {
  done: "Got it, already handled. I won't count that against this kind of fix.",
  strategy: "Noted. Say it twice for this kind of fix and I'll stop suggesting it.",
  risky: "Fair. I'll only bring these back when the case is stronger.",
  numbers: "Thanks for flagging it. I'll double-check my math on this one.",
  later: "Okay. It'll come back tomorrow if it still matters.",
};

const post = (url: string, body: object) => fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()).catch(() => null);

/**
 * Today's work as jobs (lib/jobs.ts): "Block 6 searches that waste money", "New exact campaign: 3 proven searches",
 * "Restock 2 products". One Approve per job (untick anything you don't want). direct = Rocco makes it in Amazon;
 * otherwise exact steps + "I've made these changes".
 */
export function JobCards({ token, brand, jobs, direct, cur = USD, restock }: { token: string; brand: string; jobs: Job[]; direct: boolean; cur?: Currency; restock?: RestockCtx }) {
  const $ = (n: number) => money(n, cur);
  const [res, setRes] = useState<Record<string, Res>>({});
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [thanks, setThanks] = useState<{ title: string; reason: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<Record<string, string>>({});
  const visible = jobs.filter((j) => !skipped.has(j.id));
  const openAuto = visible.filter((j) => j.mode === "auto" && j.codes.some((c) => !res[c]));

  async function approve(job: Job, codes: string[]) {
    track("job_approved", { kind: job.kind, changes: codes.length, mode: job.mode });
    if (!codes.length) return;
    setBusy(job.id);
    officeAct("dock", `Taking ${codes.join(", ")} to Amazon…`);
    if (job.mode === "create") {
      const d = (await post("/api/w/create-campaign", { t: token, brand, codes })) as { status?: Res["status"]; reason?: string; done?: string[] } | null;
      const r: Res = d?.status ? { status: d.status, reason: d.status === "applied" ? `Done: ${d.done?.join(", ")}.` : d.reason } : { status: "failed", reason: "Couldn't reach Rocco. Try again." };
      setRes((x) => ({ ...x, ...Object.fromEntries(codes.map((c) => [c, r])) }));
      officeAct(r.status === "applied" ? "lab" : "bell", r.status === "applied" ? `Created ${codes.join(", ")} in Amazon ✓ I'll check it in a week.` : `Couldn't make ${codes.join(", ")}: ${r.reason ?? "try again"}`);
    } else {
      const d = (await post("/api/w/approve", { t: token, brand, codes })) as { results?: ({ code: string } & Res)[]; approved?: string[]; locked?: string[] } | null;
      if (!d) setNote((n) => ({ ...n, [job.id]: "Couldn't reach Rocco. Try again." }));
      else setRes((x) => {
        const n = { ...x };
        for (const r of d.results ?? []) n[r.code] = { status: r.status, how: r.how, reason: r.reason };
        for (const c of d.approved ?? []) n[c] = { status: "queued" };
        return n;
      });
      const ok = (d?.results ?? []).filter((r) => r.status === "applied").map((r) => r.code);
      const bad = (d?.results ?? []).filter((r) => r.status === "failed").map((r) => r.code);
      officeAct(ok.length ? "lab" : "bell", ok.length ? `Made ${ok.join(", ")} in Amazon ✓ I'll check the result in a week.` : bad.length ? `Amazon said no to ${bad.join(", ")}. Details on the card.` : d ? "Saved your approval." : "Couldn't reach Amazon. Try again.");
      if (d?.locked?.length) setNote((n) => ({ ...n, [job.id]: "These unlock when you hire Rocco." }));
    }
    setBusy(null);
  }
  async function made(job: Job, codes: string[]) {
    setBusy(job.id);
    const d = (await post("/api/w/applied", { t: token, brand, codes })) as { ok?: boolean; logged?: string[] } | null;
    setBusy(null);
    if (d?.ok) setRes((x) => ({ ...x, ...Object.fromEntries((d.logged ?? codes).map((c) => [c, { status: "applied" as const }])) }));
  }
  function skip(job: Job, reason?: string) {
    track("job_skipped", { kind: job.kind, reason: reason ?? "none" });
    setSkipped((s) => new Set([...s, job.id]));
    setThanks({ title: job.title, reason: reason ? LEARN[reason] : "Skipped. It'll come back if it still matters." });
    if (job.codes.length) post("/api/w/skip", { t: token, brand, codes: job.codes, reason });
  }
  async function approveAll() {
    for (const j of openAuto) await approve(j, j.codes.filter((c) => !res[c]));
  }

  return (
    <div className="tw">
      <div className="tw-head">
        <div>
          <h2>Today&apos;s work</h2>
          {(() => {
            // Live counts: they always add up to what's on screen and change as jobs are approved or skipped.
            const isDone = (j: Job) => j.codes.length > 0 && j.codes.every((c) => res[c]?.status === "applied");
            const left = visible.filter((j) => !isDone(j));
            const tap = left.filter((j) => j.mode === "auto").length, make = left.filter((j) => j.mode === "create").length, you = left.filter((j) => j.mode === "manual").length, done = visible.length - left.length;
            const parts = [tap && `${tap} one-tap`, make && `${make} new campaign${make === 1 ? "" : "s"} to review`, you && `${you} step${you === 1 ? "" : "s"} for you`, done && `${done} done ✓`].filter(Boolean);
            return parts.length ? <p className="rd-split">{parts.join(" · ")} · $ values are estimates</p> : null;
          })()}
        </div>
        {openAuto.length > 1 && <button className="btn small" disabled={!!busy} onClick={approveAll}>Approve the {openAuto.length} one-tap jobs{openAuto.some((j) => j.value > 0) ? <> · ~{$(openAuto.reduce((t, j) => t + j.value, 0))}/mo</> : null}</button>}
      </div>
      <ul className="tw-list">
        {visible.map((j, i) => <JobCard key={j.id} restock={restock} cur={cur} job={j} first={i === 0} res={res} busy={busy === j.id} anyBusy={!!busy} direct={direct} note={note[j.id]} onApprove={(c) => approve(j, c)} onMade={(c) => made(j, c)} onSkip={(r) => skip(j, r)} />)}
      </ul>
      {thanks && <p className="tw-thanks" role="status"><span aria-hidden>🧠</span> <b>{thanks.title}</b>: {thanks.reason}</p>}
      <p className="fine"><b>Real work without the fluff.</b> {direct ? "Approve and I make the changes in Amazon: checked first, logged, and undoable. Nothing changes without you." : "Nothing changes without your approval. Every change is logged and checked a week later."}</p>
    </div>
  );
}

function JobCard({ restock, cur, job, first, res, busy, anyBusy, direct, note, onApprove, onMade, onSkip }: { restock?: RestockCtx; cur: Currency; job: Job; first: boolean; res: Record<string, Res>; busy: boolean; anyBusy: boolean; direct: boolean; note?: string; onApprove: (codes: string[]) => void; onMade: (codes: string[]) => void; onSkip: (reason?: string) => void }) {
  const $ = (n: number) => money(n, cur);
  const [open, setOpen] = useState(false);
  const [on, setOn] = useState<Set<string>>(() => new Set(job.codes));
  const [how, setHow] = useState(false);
  const [asking, setAsking] = useState(false);
  const rs = job.codes.map((c) => res[c]).filter(Boolean) as Res[];
  const state = !rs.length ? null : rs.some((r) => r.status === "failed") ? "failed" : rs.some((r) => r.status === "manual") ? "manual" : rs.every((r) => r.status === "applied") ? "applied" : "queued";
  const chosen = job.codes.filter((c) => on.has(c));
  const shownItems = open ? job.items : job.items.slice(0, 3);
  const steps = [...new Set(job.codes.map((c) => res[c]?.how).filter(Boolean))].slice(0, 3);
  const reason = rs.find((r) => r.reason)?.reason;
  const doneCount = rs.filter((r) => r.status === "applied").length;
  const rsOn = job.kind === "restock" && !!restock && job.items.some((i) => i.sku);
  const verb = job.mode === "create" ? "Create campaign" : chosen.length === job.codes.length ? `Approve${job.codes.length > 1 ? ` all ${job.codes.length}` : ""}` : `Approve ${chosen.length}`;

  const [exp, setExp] = useState(false);
  const primary = !state && (
    job.mode === "manual"
      ? <button className="btn ghost small" onClick={() => { setExp(true); setHow(true); }}>{rsOn ? "Plan shipment" : "Show steps"}</button>
      : <button className="btn small" disabled={anyBusy || !chosen.length} onClick={() => onApprove(chosen)}>{busy ? (direct ? (job.mode === "create" ? "Creating…" : "Making it…") : "…") : verb}</button>
  );

  return (
    <li id={`job-${job.kind}`} className={`tw-job tw-c${exp ? " is-open" : ""}${state ? ` is-${state}` : ""}${first && !state ? " is-first" : ""}`}>
      <div className="tw-row">
        <span className="tw-ic" aria-hidden>{job.icon}</span>
        <button className="tw-main" onClick={() => setExp((e) => !e)} aria-expanded={exp}>
          <span className="tw-title"><b>{job.title}</b>{job.why && first && <span className="tw-pick">Rocco&apos;s pick</span>}</span>
          <span className="tw-why">{job.why ?? job.summary}</span>
        </button>
        <div className="tw-right">
          <span className="tw-val">{job.value > 0 ? <>~{$(job.value)}<small>/mo</small></> : null}</span>
          {primary}
          <button className={`tw-chev${exp ? " on" : ""}`} onClick={() => setExp((e) => !e)} aria-expanded={exp} aria-label={exp ? "Hide details" : "Show details"}>▾</button>
          {!state && <button className="tw-skip" onClick={() => setAsking(true)} aria-label="Skip">Skip</button>}
        </div>
      </div>

      {exp && (
        <div className="tw-body">
          {job.manualWhy && !rsOn && <p className="tw-manual">{job.manualWhy}</p>}
          {job.mode !== "manual" && <p className="tw-guard"><span>✓ Checked with Amazon first</span><span>⏱ Measured in 7 days</span><span>{["bids_down", "bids_up", "budget_up", "budget_down"].includes(job.kind) ? "↩ Undo armed" : "↩ Logged with undo steps"}</span></p>}
          {job.mode === "create" && <p className="fine">New Sponsored Products campaign, $10–50/day, exact match. The searches stop in the old campaign.</p>}
          {rsOn && <RestockPanel ctx={restock!} items={job.items} />}
          {!rsOn && job.items.length > 0 && (
            <ul className="tw-items">
              {shownItems.map((it) => (
                <li key={it.code}>
                  {job.mode !== "manual" && !state ? (
                    <label><input type="checkbox" checked={on.has(it.code)} onChange={() => setOn((s) => { const n = new Set(s); if (n.has(it.code)) n.delete(it.code); else n.add(it.code); return n; })} /> <span className="ji-l">{it.label}</span></label>
                  ) : <span className="ji-l">{it.label}</span>}
                  {it.detail && <span className="ji-d">{it.detail}</span>}
                  {it.value > 0 && <span className="ji-v">~{$(it.value)}</span>}
                </li>
              ))}
              {job.items.length > 3 && <li className="tw-more"><button className="linkbtn" onClick={() => setOpen((o) => !o)}>{open ? "Show less" : `Show all ${job.items.length}`}</button></li>}
            </ul>
          )}
          {how && !state && job.steps && <p className="tw-steps"><b>How:</b> {job.steps}</p>}
        </div>
      )}

      {state === "applied" && <p className="tw-done"><span className="rd-tick" aria-hidden>✓</span> {job.mode === "create" ? reason : `Done in Amazon: ${doneCount} change${doneCount === 1 ? "" : "s"}.`} I&apos;ll check the results in a week.{job.value > 0 && <span className="rd-gain" aria-hidden>+~{$(job.value)}/mo</span>}</p>}
      {(state === "manual" || state === "queued") && (
        <div className="tw-how">
          <p>{reason ? `${reason} ` : ""}{direct ? "" : "Approved. "}<b>How:</b> {steps.length ? steps.join(" ") : job.steps ?? "Make these in the Ads console."}</p>
          <button className="btn ghost small" disabled={anyBusy} onClick={() => onMade(job.codes)}>I&apos;ve made these changes</button>
        </div>
      )}
      {state === "failed" && <p className="rd-fail">⚠️ {reason}</p>}
      {note && <p className="err">{note}</p>}

      {busy && <LoadingText steps={job.mode === "create"
        ? ["Finding the product these searches sell through…", "Creating the exact campaign in Amazon…", "Adding the ad group…", "Adding your product ad…", "Adding each search as an exact keyword…", "Blocking them in the old campaign so you don't pay twice…"]
        : direct ? ["Checking every change with Amazon first…", `Making ${chosen.length} change${chosen.length === 1 ? "" : "s"} in Amazon…`, "Logging them so I can check results in a week…"]
        : ["Saving your approval…", "Writing the exact steps…"]} every={job.mode === "create" ? 7000 : 2200} />}
      {asking && !state && (
        <div className="tw-ask" role="group" aria-label="Why skip?">
          <p><b>Why skip this?</b> One tap, and I&apos;ll work more like you.</p>
          <div className="tw-reasons">
            {REASONS.map((r) => <button key={r.id} className="tw-reason" onClick={() => onSkip(r.id)}><span aria-hidden>{r.icon}</span> {r.label}</button>)}
          </div>
          <button className="linkbtn muted" onClick={() => onSkip()}>Just skip</button>
        </div>
      )}
    </li>
  );
}
