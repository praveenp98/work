"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { RoccoHead } from "@/components/Rocco";

/**
 * Boardy-style hero: one card that cycles through every place Rocco works (iMessage, Claude, ChatGPT,
 * Amazon's own connectors, Helium 10), each showing one real senior-manager move. Below it, a box that
 * types what people ask Rocco for; sending it opens Messages with that first text.
 */
type Tile = { id: string; label: string; glyph: React.ReactNode; bg?: string };
type Scene = { tile: string; head: string; sub: string; lines: { who: "me" | "rocco" | "note"; text: string }[]; pill: string; href?: string };

const BUBBLE = <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden><path fill="#0a84ff" d="M12 3C6.5 3 2 6.8 2 11.5c0 2.6 1.4 4.9 3.6 6.5L5 21.5l4-2.1c.9.2 1.9.3 3 .3 5.5 0 10-3.8 10-8.5S17.5 3 12 3z" /></svg>;
const mono = (t: string, color: string) => <span className="tile-mono" style={{ color }}>{t}</span>;

const TILES: Tile[] = [
  { id: "imessage", label: "iMessage", glyph: BUBBLE },
  { id: "claude", label: "Claude", glyph: <span className="tile-mono" style={{ color: "#d97757", fontSize: 34 }}>✻</span> },
  { id: "ads", label: "Amazon Ads", glyph: mono("Ads", "#e47911") },
  { id: "h10", label: "Helium 10", glyph: mono("H10", "#2563eb") },
  { id: "sc", label: "Seller Central", glyph: mono("SC", "#232f3e") },
  { id: "chatgpt", label: "ChatGPT", glyph: mono("GPT", "#10a37f") },
];

const SCENES: Scene[] = [
  { tile: "imessage", head: "Rocco", sub: "online", pill: "Text me on iMessage",
    lines: [{ who: "me", text: "how'd we do yesterday?" }, { who: "rocco", text: "$4,120 sales, ACoS 24%. 2 search terms burned $63 with no sales. Reply YES N1 N2 to cut them." }] },
  { tile: "claude", head: "Claude", sub: "with Rocco + Seller Central", pill: "Use me in Claude",
    lines: [{ who: "me", text: "Rocco, morning check" }, { who: "rocco", text: "Pulled Ads + Seller Central. 7 fixes worth ~$1,240/mo. Nothing changes until you approve." }] },
  { tile: "ads", head: "Amazon Ads", sub: "change applied", pill: "I make the changes you approve",
    lines: [{ who: "note", text: "✅ B3 · bid $1.20 → $0.96 on “bamboo cutting board”" }, { who: "rocco", text: "Done. I'll check Monday if it worked, and undo it if it didn't." }] },
  { tile: "h10", head: "Helium 10", sub: "checked before cutting", pill: "I work the tools you pay for",
    lines: [{ who: "me", text: "cut “cutting board set”?" }, { who: "rocco", text: "Not that one: you rank #4 organically and it's 38K searches/mo. Cutting “plastic chopping mat” instead." }] },
  { tile: "sc", head: "Seller Central", sub: "stock watch", pill: "I watch stock while you sleep",
    lines: [{ who: "rocco", text: "📦 Kitchen Set Blue runs out in 9 days. Send 340 units this week to stay in stock for Black Friday." }, { who: "me", text: "do it" }] },
  { tile: "chatgpt", head: "ChatGPT", sub: "with Rocco", pill: "Use me in ChatGPT",
    lines: [{ who: "me", text: "why did ACoS jump on Tuesday?" }, { who: "rocco", text: "Top-of-search went +50% Tuesday and doubled CPC. Undo P2?" }] },
];

const ASKS = ["my wasted ad spend", "restock before Q4", "my Black Friday plan", "why ACoS jumped", "all 5 of my brands", "my weekly client report"];

export function RoccoStage({ optIn }: { optIn?: string }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [typed, setTyped] = useState("");
  const [own, setOwn] = useState(false);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((x) => (x + 1) % SCENES.length), 3800);
    return () => clearInterval(t);
  }, [paused]);

  // Typewriter for the ask box until the visitor types their own.
  useEffect(() => {
    if (own) return;
    let k = 0, pos = 0, dir = 1;
    const t = setInterval(() => {
      const w = ASKS[k];
      pos += dir;
      if (pos > w.length + 12) dir = -1;
      if (pos <= 0) { dir = 1; k = (k + 1) % ASKS.length; }
      setTyped(w.slice(0, Math.max(0, Math.min(pos, w.length))));
    }, 70);
    return () => clearInterval(t);
  }, [own]);

  const s = SCENES[i];
  const activeTile = TILES.findIndex((t) => t.id === s.tile);
  const href = (sc: Scene) => (sc.tile === "imessage" ? optIn : "/setup");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const q = own ? typed : ASKS[0];
    setBusy(true);
    const d = await fetch("/api/text/start", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ q }) }).then((r) => r.json()).catch(() => null);
    setBusy(false);
    const url = d?.url || optIn;
    if (url) window.location.href = url; else window.location.href = "/setup";
  }

  return (
    <div className="stage">
      <div className="stage-card" key={i} aria-live="polite">
        <div className="stage-head">
          {s.tile === "imessage" || s.tile === "sc" || s.tile === "ads"
            ? <span className="stage-av"><svg width="30" height="25" viewBox="15 5 170 140" aria-hidden><RoccoHead mood="smirk" id={`st${i}`} /></svg></span>
            : <span className="stage-av tile-sm">{TILES[activeTile].glyph}</span>}
          <div><b>{s.head}</b><span className={s.sub === "online" ? "on" : ""}>{s.sub}</span></div>
          <span className="stage-badge">{TILES[activeTile].glyph}</span>
        </div>
        <div className="stage-body">
          {s.lines.map((l, k) => (
            <div key={k} className={`stage-line ${l.who}`} style={{ animationDelay: `${0.25 + k * 0.7}s` }}><span>{l.text}</span></div>
          ))}
        </div>
      </div>

      <div className="orbit" aria-hidden>
        {TILES.map((t, k) => {
          const off = ((k - activeTile + TILES.length + 2) % TILES.length) - 2; // -2..3, active at 0
          const x = off * 70, y = Math.abs(off) * 14 - (off === 0 ? 8 : 0);
          return (
            <button key={t.id} tabIndex={-1} className={`orbit-tile${off === 0 ? " on" : ""}`} style={{ transform: `translate(${x}px, ${y}px) scale(${off === 0 ? 1.18 : 0.86})`, opacity: Math.abs(off) > 2 ? 0 : 1 }}
              onClick={() => { const n = SCENES.findIndex((sc) => sc.tile === t.id); if (n >= 0) { setI(n); setPaused(true); } }}>
              {t.glyph}
            </button>
          );
        })}
      </div>

      <div className="stage-pillrow">
        {href(s) ? (s.tile === "imessage" ? <a className="stage-pill" href={href(s)}><span className="tile-sm">{TILES[activeTile].glyph}</span>{s.pill}</a>
          : <Link className="stage-pill" href="/setup"><span className="tile-sm">{TILES[activeTile].glyph}</span>{s.pill}</Link>)
          : <span className="stage-pill"><span className="tile-sm">{TILES[activeTile].glyph}</span>{s.pill}</span>}
        <button className="stage-pause" onClick={() => setPaused((p) => !p)} aria-label={paused ? "Play" : "Pause"}>{paused ? "▷" : "❚❚"}</button>
      </div>

      <form className="askbox" onSubmit={send}>
        <label htmlFor="ask">Rocco, help me with</label>
        <input id="ask" ref={input} value={typed} onFocus={() => { if (!own) { setOwn(true); setTyped(""); } }} onChange={(e) => { setOwn(true); setTyped(e.target.value); }} placeholder="my wasted ad spend" autoComplete="off" />
        <button aria-label="Text Rocco" disabled={busy}>{busy ? "…" : "↑"}</button>
      </form>
    </div>
  );
}
