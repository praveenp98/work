"use client";
import { applyLink } from "@/lib/apply-link";
import { useState } from "react";

export interface FixCard { code: string; title: string; target: string; reason: string; value: number; how?: string; projected?: boolean }

const $ = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

/**
 * Fixes waiting, as big cards with Approve. Approving queues the code (same as texting YES N1); the team's AI
 * applies it through Amazon's connector on the next check, then Rocco checks the result a week later.
 */
export function FixCards({ token, brand, fixes, queued: initial, mode = "claude" }: { token: string; brand: string; fixes: FixCard[]; queued: string[]; mode?: "claude" | "reports" }) {
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
    setNote(d.approved?.length ? (mode === "reports" ? `Approved ${d.approved.join(", ")}. Make the change in the Ads console (steps on the card), then tap “I've made these changes”.` : `Approved ${d.approved.join(", ")}. Tap “Apply in Claude”: Amazon shows a preview, you confirm, I track the result.`) : d.cancelled?.length ? `Cancelled ${d.cancelled.join(", ")}.` : "");
  }
  const [done, setDone] = useState<Set<string>>(new Set());
  async function made(codes: string[]) {
    setBusy("made");
    const d = (await fetch("/api/w/applied", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ t: token, brand, codes }) }).then((r) => r.json()).catch(() => null)) as { ok?: boolean; logged?: string[] } | null;
    setBusy(null);
    if (!d?.ok) { setNote("Couldn't log that. Try again."); return; }
    setDone((x) => new Set([...x, ...(d.logged ?? codes)]));
    setNote(`Logged ${(d.logged ?? codes).join(", ")}. I'll check the results when your next reports arrive (about a week).`);
  }
  const open = fixes.filter((f) => !queued.has(f.code));
  const waiting = [...queued].filter((c) => !done.has(c));
  return (
    <div className="fixes-wrap">
      {waiting.length > 0 && (mode === "reports"
        ? <button className="btn fixes-apply" disabled={!!busy} onClick={() => made(waiting)}>{waiting.length === 1 ? "I've made this change ✓" : `I've made these ${waiting.length} changes ✓`}</button>
        : <a className="btn fixes-apply" href={applyLink(waiting)} target="_blank" rel="noreferrer">Apply {waiting.length} approved in Claude →</a>)}
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
              <div className="fix-top"><span className="fix-code">{f.code}</span><b>{f.title}</b>{f.value > 0 && <span className="fix-val" title="projected from the last report period">~{$(f.value)}/mo est.</span>}</div>
              <p className="fix-target">{f.target}</p>
              <p className="fix-why">{f.reason}</p>
              {on && mode === "reports" && f.how && !done.has(f.code) && <p className="fix-how"><b>How:</b> {f.how}</p>}
              {on
                ? <div className="fix-done"><span>{done.has(f.code) ? "✓ Made · I'll check it next week" : mode === "reports" ? "✓ Approved · make it in the Ads console" : "✓ Approved · waiting for you in Claude"}</span>{!done.has(f.code) && <button className="linkbtn" disabled={!!busy} onClick={() => send([f.code], true)}>Cancel</button>}</div>
                : <button className="btn small" disabled={!!busy} onClick={() => send([f.code])}>{busy === f.code ? "…" : "Approve"}</button>}
            </li>
          );
        })}
      </ul>
      {note && <p className="fine" role="status">{note}</p>}
    </div>
  );
}
