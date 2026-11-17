"use client";
import { useState } from "react";

/**
 * The one action on the homepage. With LoopMessage's opt-in link configured it opens Messages with a
 * first text (incl. the opt-in code) ready to send; until then it collects a phone/email for launch.
 */
export function TextRoccoButton({ href }: { href?: string }) {
  const [open, setOpen] = useState(false);
  const [contact, setContact] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  if (href) return <a className="btn imsg-btn" href={href}>💬 Text Rocco</a>;
  return (
    <div className="textcta">
      {!open ? (
        <button className="btn imsg-btn" onClick={() => setOpen(true)}>💬 Text Rocco</button>
      ) : state === "done" ? (
        <p className="ok" style={{ margin: 0 }}>You&apos;re on the list. Rocco will text you first 🦝</p>
      ) : (
        <form className="waitlist" style={{ margin: 0 }} onSubmit={async (e) => {
          e.preventDefault(); setState("busy");
          const res = await fetch("/api/waitlist", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ contact, source: "text-rocco" }) }).catch(() => null);
          setState(res?.ok ? "done" : "error");
        }}>
          <input autoFocus required placeholder="Your iPhone number or email" value={contact} onChange={(e) => setContact(e.target.value)} aria-label="Phone or email" />
          <button disabled={state === "busy"}>{state === "busy" ? "…" : "Text me"}</button>
          <p className="fine" style={{ width: "100%", margin: "4px 0 0" }}>Rocco&apos;s iMessage line opens this week. He&apos;ll text you first. {state === "error" && <span className="err">Couldn&apos;t save, try again.</span>}</p>
        </form>
      )}
    </div>
  );
}
