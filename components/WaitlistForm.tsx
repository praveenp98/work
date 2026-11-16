"use client";
import { useState } from "react";

export function WaitlistForm({ source, cta = "Get Rocco's Monday brief" }: { source: string; cta?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  return (
    <form
      className="waitlist"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("sending");
        const res = await fetch("/api/waitlist", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, source }) }).catch(() => null);
        setState(res?.ok ? "done" : "error");
      }}
    >
      {state === "done" ? (
        <p className="ok">You're on the list. Rocco will be in touch (politely).</p>
      ) : (
        <>
          <input type="email" required placeholder="you@brand.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
          <button disabled={state === "sending"}>{state === "sending" ? "Adding…" : cta}</button>
          {state === "error" && <p className="err">Couldn't save that. Try again in a minute.</p>}
        </>
      )}
    </form>
  );
}
