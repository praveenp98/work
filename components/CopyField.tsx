"use client";
import { useState } from "react";

/** A labeled block of text with a copy button and a character count (directories have limits). */
export function CopyField({ label, text }: { label: string; text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="copyfield">
      <div className="copyfield-head">
        <b>{label}</b>
        <span className="fine">{text.length} chars</span>
        <button className="btn small" onClick={async () => { try { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1400); } catch { /* blocked */ } }}>{ok ? "Copied ✓" : "Copy"}</button>
      </div>
      <pre className="copyfield-text">{text}</pre>
    </div>
  );
}
