"use client";
import { useState } from "react";
import { startText } from "@/lib/client/startText";

/**
 * A "text Rocco" button. The real iMessage link is created only when someone taps (bots and link previews never
 * see one). Falls back to the /text page if JavaScript is off or texting isn't open yet.
 */
export function TextLink({ q, t, join, className = "btn imsg-btn", children }: { q?: string; t?: string; join?: string; className?: string; children: React.ReactNode }) {
  const [busy, setBusy] = useState(false);
  const fallback = `/text${join ? `?join=${join}` : ""}`;
  return (
    <a href={fallback} rel="nofollow" className={className} aria-busy={busy} onClick={async (e) => {
      e.preventDefault();
      if (busy) return;
      setBusy(true);
      const ok = await startText({ q, t, join });
      if (!ok) { setBusy(false); window.location.href = `${fallback}${fallback.includes("?") ? "&" : "?"}closed=1`; }
    }}>{busy ? "Opening Messages…" : children}</a>
  );
}
