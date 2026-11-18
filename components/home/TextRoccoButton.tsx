"use client";
import { useState } from "react";
import { startText } from "@/lib/client/startText";

/**
 * The main "Text Rocco" button. Tapping makes a fresh iMessage link (never in the page, so bots can't burn
 * LoopMessage contacts). If texting isn't open, it collects a phone or email instead.
 */
export function TextRoccoButton({ q, label = "💬 Text Rocco" }: { q?: string; label?: string }) {
  const [mode, setMode] = useState<"idle" | "busy" | "form" | "done" | "error">("idle");
  const [contact, setContact] = useState("");
  if (mode === "done") return <p className="ok" style={{ margin: 0 }}>You&apos;re on the list. Rocco will text you first 🦝</p>;
  if (mode === "form" || mode === "error") {
    return (
      <form className="waitlist" style={{ margin: 0 }} onSubmit={async (e) => {
        e.preventDefault();
        const res = await fetch("/api/waitlist", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ contact, source: "text-rocco" }) }).catch(() => null);
        setMode(res?.ok ? "done" : "error");
      }}>
        <input autoFocus required placeholder="Your iPhone number or email" value={contact} onChange={(e) => setContact(e.target.value)} aria-label="Phone or email" />
        <button>Text me</button>
        <p className="fine" style={{ width: "100%", margin: "4px 0 0" }}>Rocco will text you first. {mode === "error" && <span className="err">Couldn&apos;t save, try again.</span>}</p>
      </form>
    );
  }
  return (
    <button className="btn imsg-btn" disabled={mode === "busy"} onClick={async () => {
      setMode("busy");
      if (!(await startText({ q }))) setMode("form");
    }}>{mode === "busy" ? "Opening Messages…" : label}</button>
  );
}
