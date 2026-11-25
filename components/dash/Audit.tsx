"use client";
import { useState } from "react";
import { track } from "@/lib/analytics";

/**
 * Free read-only audit UI (lib/free-audit.ts).
 *  - AuditStart: on the plan step, the secondary path "See my account free first".
 *  - AuditBanner: on the dashboard while on the audit: what this is, and Hire.
 */
export function AuditStart({ token }: { token: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <div className="rc-audit">
      <button className="linkbtn" disabled={busy} data-track="audit_started" onClick={async () => {
        setBusy(true); setErr(""); track("audit_clicked", { method: "dashboard" });
        const d = (await fetch("/api/w/audit", { method: "POST", headers: { "content-type": "application/json", "x-rocco-tap": "1" }, body: JSON.stringify({ t: token }) }).then((r) => r.json()).catch(() => null)) as { ok?: boolean; error?: string } | null;
        if (d?.ok) { window.location.reload(); return; }
        setBusy(false); setErr(d?.error ?? "Couldn't start your free audit. Try again.");
      }}>{busy ? "One moment…" : "Or see my account free first →"}</button>
      <small>Connect Amazon, see what I&apos;d do in your account. Read-only: nothing changes until you hire me.</small>
      {err && <p className="err" role="status">{err}</p>}
    </div>
  );
}

export function AuditBanner({ url, active, daysLeft }: { url: string; active: boolean; daysLeft: number }) {
  return (
    <div className="rd-offer rd-audit" role="note">
      <div>
        <b>Free audit: this is what I&apos;d do in your account.</b>
        <span>Hire me to make these changes (14-day money-back guarantee). {active ? `Read-only: nothing changes in Amazon. ${daysLeft} day${daysLeft === 1 ? "" : "s"} left on this free look.` : "Your free audit has ended: this view stays, but I've stopped reading new data."}</span>
      </div>
      <a className="btn" href={url} onClick={() => track("audit_hire_clicked", { from: "banner" })}>Hire Rocco</a>
    </div>
  );
}
