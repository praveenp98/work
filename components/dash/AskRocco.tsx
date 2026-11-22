"use client";
import { useState } from "react";
import { LoadingText } from "@/components/LoadingText";

/** "Ask Rocco": one question, one short answer from this account's own data. */
export function AskRocco({ token, brand, examples }: { token: string; brand: string; examples: string[] }) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [a, setA] = useState<{ q: string; text: string; err?: boolean } | null>(null);
  async function ask(question: string) {
    const text = question.trim();
    if (text.length < 2 || busy) return;
    setBusy(true);
    const d = (await fetch("/api/w/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ t: token, brand, q: text }) }).then((r) => r.json()).catch(() => null)) as { answer?: string; error?: string } | null;
    setBusy(false);
    setA(d?.answer ? { q: text, text: d.answer } : { q: text, text: d?.error ?? "Couldn't reach Rocco. Try again.", err: true });
    if (d?.answer) setQ("");
  }
  return (
    <section className="rd-card rd-ask">
      <h3>Ask Rocco</h3>
      <form onSubmit={(e) => { e.preventDefault(); ask(q); }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} maxLength={500} placeholder="Why is ACoS up this week?" aria-label="Ask Rocco about your account" disabled={busy} />
        <button className="btn small" disabled={busy || q.trim().length < 2}>{busy ? "…" : "Ask"}</button>
      </form>
      {!a && !busy && <div className="rd-ask-ex">{examples.map((x) => <button key={x} type="button" className="linkbtn" onClick={() => ask(x)}>{x}</button>)}</div>}
      {busy && <LoadingText steps={["Reading your numbers…", "Looking at today's jobs and past results…", "Writing you a straight answer…"]} every={2500} />}
      {a && !busy && <div className={`rd-ask-a${a.err ? " err" : ""}`} role="status"><small>{a.q}</small><p>{a.text}</p></div>}
    </section>
  );
}
