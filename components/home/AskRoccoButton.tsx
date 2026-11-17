"use client";
import { useState } from "react";

/** Opens Messages with "Hey Rocco 👋 Help me with <ask>" ready to send (LoopMessage opt-in link). */
export function AskRoccoButton({ ask, label = "Ask Rocco about my account" }: { ask: string; label?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button className="btn imsg-btn" disabled={busy} onClick={async () => {
      setBusy(true);
      const d = await fetch("/api/text/start", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ q: ask }) }).then((r) => r.json()).catch(() => null);
      window.location.href = d?.url || "/#text";
    }}>💬 {busy ? "Opening Messages…" : label}</button>
  );
}
