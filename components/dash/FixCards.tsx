"use client";
import { applyLink } from "@/lib/apply-link";
import { useState } from "react";

/** One card. `codes` groups related fixes (Rocco's manager pick): approve/skip act on all of them. */
export interface FixCard { code: string; codes?: string[]; title: string; target: string; reason: string; value: number; how?: string; kind?: string; pick?: boolean }
type Result = { status: "applied" | "manual" | "failed" | "queued"; how?: string; reason?: string };

const $ = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const ICON: Record<string, string> = { negative: "✂️", harvest: "🌱", bid: "📈", budget: "💰", placement: "🎯", ads_down: "📦", structure: "🧹" };
const sure = (reason: string) => Number(reason.match(/\((\d{1,2})% sure/)?.[1] ?? 0);
const all = (f: FixCard) => f.codes?.length ? f.codes : [f.code];
/** A group's state: done when every change is done; any failure or manual step shows. */
function groupResult(f: FixCard, res: Record<string, Result>): Result | undefined {
  const rs = all(f).map((c) => res[c]);
  if (!rs.some(Boolean)) return undefined;
  return rs.find((r) => r?.status === "failed") ?? rs.find((r) => r?.status === "manual") ?? rs.find((r) => r?.status === "queued") ?? rs.find(Boolean);
}

/**
 * Today's fixes. mode "direct": Approve → Rocco makes the change in Amazon (DataDoe), dry-run first; anything he
 * can't make yet shows exact steps. "claude": queued for Claude + Amazon's connectors. "reports": exact steps + "I made it".
 */
export function FixCards({ token, brand, fixes, queued, mode = "direct", heading = "Today's fixes", approveAll = true }: { token: string; brand: string; fixes: FixCard[]; queued: string[]; mode?: "direct" | "claude" | "reports"; heading?: string; approveAll?: boolean }) {
  const [res, setRes] = useState<Record<string, Result>>(() => Object.fromEntries(queued.map((c) => [c, { status: "queued" as const }])));
  const [busy, setBusy] = useState<string | null>(null);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [err, setErr] = useState("");

  async function approve(codes: string[]) {
    setBusy(codes.join(",")); setErr("");
    const d = (await fetch("/api/w/approve", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ t: token, brand, codes }) }).then((r) => r.json()).catch(() => null)) as
      { direct?: boolean; results?: { code: string; status: Result["status"]; how?: string; reason?: string }[]; approved?: string[]; locked?: string[] } | null;
    setBusy(null);
    if (!d) { setErr("Couldn't reach Rocco. Try again."); return; }
    setRes((r) => {
      const n = { ...r };
      for (const x of d.results ?? []) n[x.code] = { status: x.status, how: x.how, reason: x.reason };
      for (const c of d.approved ?? []) n[c] = { status: "queued" };
      return n;
    });
    if (d.locked?.length) setErr(`${d.locked.join(", ")} unlock${d.locked.length === 1 ? "s" : ""} when you hire Rocco.`);
  }
  async function made(codes: string[]) {
    setBusy("made");
    const d = (await fetch("/api/w/applied", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ t: token, brand, codes }) }).then((r) => r.json()).catch(() => null)) as { ok?: boolean; logged?: string[] } | null;
    setBusy(null);
    if (d?.ok) setRes((r) => ({ ...r, ...Object.fromEntries((d.logged ?? codes).map((c) => [c, { status: "applied" as const }])) }));
  }

  function skip(f: FixCard) {
    setSkipped((s) => new Set([...s, f.code]));
    fetch("/api/w/skip", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ t: token, brand, codes: all(f) }) }).catch(() => {});
  }

  const open = fixes.filter((f) => !groupResult(f, res) && !skipped.has(f.code));
  const waiting = Object.entries(res).filter(([, r]) => r.status === "queued").map(([c]) => c);
  return (
    <div className="rd-fixes">
      <div className="rd-fixes-head">
        <h2>{heading}</h2>
        {approveAll && open.length > 1 && <button className="btn small" disabled={!!busy} onClick={() => approve(open.flatMap(all))}>Approve all {open.length} · ~{$(open.reduce((t, f) => t + f.value, 0))}/mo</button>}
      </div>
      {mode === "claude" && waiting.length > 0 && <a className="btn rd-claude" href={applyLink(waiting)} target="_blank" rel="noreferrer">Apply {waiting.length} approved in Claude →</a>}
      <ul className="rd-list">
        {fixes.filter((f) => !skipped.has(f.code)).map((f) => {
          const r = groupResult(f, res);
          const n = all(f).length;
          const pct = sure(f.reason);
          return (
            <li key={f.code} className={`rd-fix${f.pick ? " is-pick" : ""}${r ? ` is-${r.status}` : ""}`}>
              <span className="rd-ic" aria-hidden>{ICON[f.kind ?? ""] ?? "🛠️"}</span>
              <div className="rd-body">
                <div className="rd-top"><b>{f.title}</b><span className="rd-code">{n > 1 ? `${n} changes` : f.code}</span>{f.value > 0 && <span className="rd-val" title="projected from the last 30 days">~{$(f.value)}/mo</span>}</div>
                <p className="rd-target">{f.target}</p>
                <p className="rd-why">{f.reason}</p>
                {pct > 0 && <div className="rd-sure" aria-label={`${pct}% confidence`}><i style={{ width: `${pct}%` }} /><span>{pct}% sure</span></div>}
                {r?.status === "applied" && <p className="rd-done"><span className="rd-tick" aria-hidden>✓</span> Done in Amazon. I&apos;ll check the result{n > 1 ? "s" : ""} in a week.{f.value > 0 && <span className="rd-gain" aria-hidden>+~{$(f.value)}/mo</span>}</p>}
                {r?.status === "queued" && <p className="rd-done">✓ Approved. {mode === "claude" ? "Waiting for you in Claude." : "Make it in the Ads console, then tap below."}</p>}
                {(r?.status === "manual" || (r?.status === "queued" && mode === "reports")) && (f.how || r?.how) && (
                  <div className="rd-how"><p>{r?.reason ? `${r.reason} ` : ""}<b>How:</b> {r?.how ?? f.how}</p><button className="btn ghost small" disabled={!!busy} onClick={() => made(all(f))}>I&apos;ve made this change</button></div>
                )}
                {r?.status === "failed" && <p className="rd-fail">⚠️ {r.reason}</p>}
              </div>
              {!r && (
                <div className="rd-actions">
                  <button className="btn" disabled={!!busy} onClick={() => approve(all(f))}>{busy === all(f).join(",") ? (mode === "direct" ? "Making it…" : "…") : "Approve"}</button>
                  <button className="linkbtn muted" onClick={() => skip(f)}>Skip</button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {err && <p className="err" role="status">{err}</p>}
      <p className="fine">{mode === "direct" ? "Approve and I make the change in Amazon right away: checked first, logged, and undoable. Nothing changes without you." : "Nothing changes without your approval. Every change is logged and checked a week later."}</p>
    </div>
  );
}
