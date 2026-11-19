"use client";
import { useState } from "react";

/** "Using Claude instead?" / "No Claude? Email me your reports": switch how this team feeds Rocco. */
export function ModeSwitch({ token, mode }: { token: string; mode: "claude" | "reports" }) {
  const [busy, setBusy] = useState(false);
  const other = mode === "reports" ? "claude" : "reports";
  async function go() {
    setBusy(true);
    await fetch("/api/w/mode", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ t: token, mode: other }) }).catch(() => null);
    window.location.reload();
  }
  return (
    <p className="fine mode-switch">
      <button className="linkbtn" disabled={busy} onClick={go}>
        {mode === "reports" ? "Have Claude with Amazon's connectors (US)? Use Claude instead →" : "No Claude, or outside the US? Have Amazon email me your reports instead →"}
      </button>
    </p>
  );
}
