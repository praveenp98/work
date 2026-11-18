"use client";
import { useState } from "react";

export interface FixCard { code: string; title: string; target: string; reason: string; value: number }

const $ = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

/**
 * Fixes waiting, as big cards with Approve. Approving queues the code (same as texting YES N1); the team's AI
 * applies it through Amazon's connector on the next check, then Rocco checks the result a week later.
 */
export function FixCards({ token, brand, fixes, queued: initial }: { token: string; brand: string; fixes: FixCard[]; queued: string[] }) {
  const [queued, setQueued] = useState<Set<string>>(new Set(initial));
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState("");
  async function send(codes: string[], cancel = false) {
    setBusy(codes.join(","));
    const d = (await fetch("/api/w/approve", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ t: token, brand, codes, cancel }) }).then((r) => r.json()).catch(() => null)) as { approved?: string[]; cancelled?: string[] } | null;
    setBusy(null);
    if (!d) { setNote("Couldn't reach Rocco. Try again."); return; }
    setQueued((q) => {
      const n = new Set(q);
      d.approved?.forEach((c) => n.add(c));
      d.cancelled?.forEach((c) => n.delete(c));
      return n;
    });
    setNote(d.approved?.length ? `Approved ${d.approved.join(", ")}. Your AI applies ${d.approved.length === 1 ? "it" : "them"} on the next check, then I track the result.` : d.cancelled?.length ? `Cancelled ${d.cancelled.join(", ")}.` : "");
  }
  const open = fixes.filter((f) => !queued.has(f.code));
  return (
    <div className="fixes-wrap">
      {open.length > 1 && (
        <button className="btn small fixes-all" disabled={!!busy} onClick={() => send(open.map((f) => f.code))}>
          Approve all {open.length} · ~{$(open.reduce((t, f) => t + f.value, 0))}/mo
        </button>
      )}
      <ul className="fixcards">
        {fixes.map((f) => {
          const on = queued.has(f.code);
          return (
            <li key={f.code} className={on ? "on" : ""}>
              <div className="fix-top"><span className="fix-code">{f.code}</span><b>{f.title}</b>{f.value > 0 && <span className="fix-val">~{$(f.value)}/mo</span>}</div>
              <p className="fix-target">{f.target}</p>
              <p className="fix-why">{f.reason}</p>
              {on
                ? <div className="fix-done"><span>✓ Approved · applies on the next check</span><button className="linkbtn" disabled={!!busy} onClick={() => send([f.code], true)}>Cancel</button></div>
                : <button className="btn small" disabled={!!busy} onClick={() => send([f.code])}>{busy === f.code ? "…" : "Approve"}</button>}
            </li>
          );
        })}
      </ul>
      {note && <p className="fine" role="status">{note}</p>}
    </div>
  );
}
