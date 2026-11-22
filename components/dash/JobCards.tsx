"use client";
import { useState } from "react";
import { LoadingText } from "@/components/LoadingText";
import type { Job } from "@/lib/jobs";

type Res = { status: "applied" | "manual" | "failed" | "queued"; how?: string; reason?: string };
const $ = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const post = (url: string, body: object) => fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()).catch(() => null);

/**
 * Today's work as jobs (lib/jobs.ts): "Block 6 searches that waste money", "New exact campaign: 3 proven searches",
 * "Restock 2 products". One Approve per job (untick anything you don't want). direct = Rocco makes it in Amazon;
 * otherwise exact steps + "I've made these changes".
 */
export function JobCards({ token, brand, jobs, direct }: { token: string; brand: string; jobs: Job[]; direct: boolean }) {
  const [res, setRes] = useState<Record<string, Res>>({});
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<Record<string, string>>({});
  const visible = jobs.filter((j) => !skipped.has(j.id));
  const openAuto = visible.filter((j) => j.mode === "auto" && j.codes.some((c) => !res[c]));

  async function approve(job: Job, codes: string[]) {
    if (!codes.length) return;
    setBusy(job.id);
    if (job.mode === "create") {
      const d = (await post("/api/w/create-campaign", { t: token, brand, codes })) as { status?: Res["status"]; reason?: string; done?: string[] } | null;
      const r: Res = d?.status ? { status: d.status, reason: d.status === "applied" ? `Done: ${d.done?.join(", ")}.` : d.reason } : { status: "failed", reason: "Couldn't reach Rocco. Try again." };
      setRes((x) => ({ ...x, ...Object.fromEntries(codes.map((c) => [c, r])) }));
    } else {
      const d = (await post("/api/w/approve", { t: token, brand, codes })) as { results?: ({ code: string } & Res)[]; approved?: string[]; locked?: string[] } | null;
      if (!d) setNote((n) => ({ ...n, [job.id]: "Couldn't reach Rocco. Try again." }));
      else setRes((x) => {
        const n = { ...x };
        for (const r of d.results ?? []) n[r.code] = { status: r.status, how: r.how, reason: r.reason };
        for (const c of d.approved ?? []) n[c] = { status: "queued" };
        return n;
      });
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
  function skip(job: Job) {
    setSkipped((s) => new Set([...s, job.id]));
    if (job.codes.length) post("/api/w/skip", { t: token, brand, codes: job.codes });
  }
  async function approveAll() {
    for (const j of openAuto) await approve(j, j.codes.filter((c) => !res[c]));
  }

  return (
    <div className="tw">
      <div className="tw-head">
        <h2>Today&apos;s work</h2>
        {openAuto.length > 1 && <button className="btn small" disabled={!!busy} onClick={approveAll}>Approve all {openAuto.length} jobs · ~{$(openAuto.reduce((t, j) => t + j.value, 0))}/mo</button>}
      </div>
      <ul className="tw-list">
        {visible.map((j, i) => <JobCard key={j.id} job={j} first={i === 0} res={res} busy={busy === j.id} anyBusy={!!busy} direct={direct} note={note[j.id]} onApprove={(c) => approve(j, c)} onMade={(c) => made(j, c)} onSkip={() => skip(j)} />)}
      </ul>
      <p className="fine"><b>Real work without the fluff.</b> {direct ? "Approve and I make the changes in Amazon: checked first, logged, and undoable. Nothing changes without you." : "Nothing changes without your approval. Every change is logged and checked a week later."}</p>
    </div>
  );
}

function JobCard({ job, first, res, busy, anyBusy, direct, note, onApprove, onMade, onSkip }: { job: Job; first: boolean; res: Record<string, Res>; busy: boolean; anyBusy: boolean; direct: boolean; note?: string; onApprove: (codes: string[]) => void; onMade: (codes: string[]) => void; onSkip: () => void }) {
  const [open, setOpen] = useState(false);
  const [on, setOn] = useState<Set<string>>(() => new Set(job.codes));
  const [how, setHow] = useState(false);
  const rs = job.codes.map((c) => res[c]).filter(Boolean) as Res[];
  const state = !rs.length ? null : rs.some((r) => r.status === "failed") ? "failed" : rs.some((r) => r.status === "manual") ? "manual" : rs.every((r) => r.status === "applied") ? "applied" : "queued";
  const chosen = job.codes.filter((c) => on.has(c));
  const shownItems = open ? job.items : job.items.slice(0, 3);
  const steps = [...new Set(job.codes.map((c) => res[c]?.how).filter(Boolean))].slice(0, 3);
  const reason = rs.find((r) => r.reason)?.reason;
  const doneCount = rs.filter((r) => r.status === "applied").length;
  const verb = job.mode === "create" ? "Create campaign" : chosen.length === job.codes.length ? `Approve${job.codes.length > 1 ? ` all ${job.codes.length}` : ""}` : `Approve ${chosen.length}`;

  return (
    <li className={`tw-job${state ? ` is-${state}` : ""}${first && !state ? " is-first" : ""}`}>
      <div className="tw-top">
        <span className="tw-ic" aria-hidden>{job.icon}</span>
        <div className="tw-txt">
          <div className="tw-title"><b>{job.title}</b>{job.why && <span className="tw-pick">Rocco&apos;s pick</span>}</div>
          <p className="tw-why">{job.why ?? job.summary}</p>
        </div>
        {job.value > 0 && <span className="tw-val">~{$(job.value)}<small>/mo</small></span>}
      </div>

      {job.items.length > 0 && (
        <ul className="tw-items">
          {shownItems.map((it) => (
            <li key={it.code}>
              {open && job.mode !== "manual" && !state ? (
                <label><input type="checkbox" checked={on.has(it.code)} onChange={() => setOn((s) => { const n = new Set(s); if (n.has(it.code)) n.delete(it.code); else n.add(it.code); return n; })} /> <span className="ji-l">{it.label}</span></label>
              ) : <span className="ji-l">{it.label}</span>}
              {it.detail && <span className="ji-d">{it.detail}</span>}
              {it.value > 0 && <span className="ji-v">~{$(it.value)}</span>}
            </li>
          ))}
          {job.items.length > 3 && <li className="tw-more"><button className="linkbtn" onClick={() => setOpen((o) => !o)}>{open ? "Show less" : `Show all ${job.items.length}${job.mode !== "manual" ? " · choose" : ""}`}</button></li>}
        </ul>
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

      {!state && (
        <div className="tw-act">
          {job.mode === "manual" ? (
            <button className="btn" onClick={() => setHow((h) => !h)}>{how ? "Hide steps" : "Show me how"}</button>
          ) : (
            <button className="btn" disabled={anyBusy || !chosen.length} onClick={() => onApprove(chosen)}>{busy ? (direct ? (job.mode === "create" ? "Creating in Amazon…" : "Making it in Amazon…") : "…") : verb}</button>
          )}
          <button className="linkbtn muted" onClick={onSkip}>Skip</button>
          {job.mode === "create" && <span className="fine">New Sponsored Products campaign, $10–50/day, exact match. The searches stop in the old campaign.</span>}
        </div>
      )}
      {busy && <LoadingText steps={job.mode === "create"
        ? ["Finding the product these searches sell through…", "Creating the exact campaign in Amazon…", "Adding the ad group…", "Adding your product ad…", "Adding each search as an exact keyword…", "Blocking them in the old campaign so you don't pay twice…"]
        : direct ? ["Checking every change with Amazon first…", `Making ${chosen.length} change${chosen.length === 1 ? "" : "s"} in Amazon…`, "Logging them so I can check results in a week…"]
        : ["Saving your approval…", "Writing the exact steps…"]} every={job.mode === "create" ? 7000 : 2200} />}
      {how && !state && job.steps && <p className="tw-steps">{job.steps}</p>}
    </li>
  );
}
