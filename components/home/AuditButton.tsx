"use client";
import { useState } from "react";
import { track } from "@/lib/analytics";

/**
 * Secondary path next to "Hire Rocco": "See my account free first" (the free read-only audit, lib/free-audit.ts).
 * Google on: sign in with intent=audit. Otherwise: create this browser's Rocco on the audit (/api/hire intent=audit),
 * then the Rocco page asks to connect Amazon. data-track sends the first-party funnel event (/admin/funnel "Audits").
 */
export function AuditButton({ google, label = "See my account free first", className = "linkbtn h5-audit" }: { google?: boolean; label?: string; className?: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  if (google) {
    return <a className={className} href="/api/auth/google?intent=audit" rel="nofollow" data-track="audit_started" onClick={() => track("audit_clicked", { method: "google" })}>{label} →</a>;
  }
  return (
    <>
      <button className={className} disabled={busy} data-track="audit_started" onClick={async () => {
        setBusy(true); setErr(""); track("audit_clicked", { method: "email" });
        const d = (await fetch("/api/hire", { method: "POST", headers: { "content-type": "application/json", "x-rocco-tap": "1" }, body: JSON.stringify({ intent: "audit" }) }).then((r) => r.json()).catch(() => null)) as { url?: string; error?: string } | null;
        if (d?.url) { window.location.href = d.url; return; }
        setBusy(false); setErr(d?.error ?? "Couldn't start your free audit. Try again.");
      }}>{busy ? "One moment…" : `${label} →`}</button>
      {err && <span className="err" role="status">{err}</span>}
    </>
  );
}
