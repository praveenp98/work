"use client";
import { useEffect, useRef, useState } from "react";
import { RoccoHead } from "../Rocco";

type Msg =
  | { who: "you"; text: string; file?: string }
  | { who: "tool"; name: string }
  | { who: "rocco"; text: string; bullets?: string[] }
  | { who: "time"; text: string };

const SCRIPT: Msg[] = [
  { who: "you", text: "Rocco, morning check." },
  { who: "tool", name: "rocco_plan" },
  { who: "tool", name: "Amazon Ads · search terms, campaigns" },
  { who: "tool", name: "Seller Central · restock" },
  { who: "tool", name: "analyze_report ×3" },
  { who: "rocco", text: "Black Friday in 10 days. $481/month leaking. Today's list:", bullets: ["N1 negate “plastic cutting board dishwasher safe” (64 clicks, 0 orders)", "N2 negate “free cutting board”. They wanted it free. You paid.", "G2 Exact campaign runs dry by 2 p.m. at 25% ACoS: budget $12 → $15", "S1 Bamboo Board Large has 14 days of stock: ease off its ads"] },
  { who: "you", text: "Approve N1, N2, G2, S1." },
  { who: "tool", name: "Amazon Ads · apply 4 changes" },
  { who: "tool", name: "apply_changes" },
  { who: "rocco", text: "Done in Amazon Ads and logged. I'll check them on Nov 24. Undo steps saved." },
  { who: "time", text: "One week later" },
  { who: "you", text: "Rocco, how did last week's changes do?" },
  { who: "tool", name: "Amazon Ads · daily search terms" },
  { who: "rocco", text: "Since you hired me: ~$212 saved.", bullets: ["✅ N1 blocked. $0 spent since (was $3/day).", "✅ G2 Exact sales $48 → $70/day at 21% ACoS.", "✅ S1 stock lasted until the inbound shipment landed."] },
];

/** Self-playing chat: what a week with Rocco in Claude/ChatGPT looks like. */
export function ChatDemo() {
  const [n, setN] = useState(3);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setN(SCRIPT.length); return; }
    const t = setTimeout(() => setN((x) => (x >= SCRIPT.length + 2 ? 1 : x + 1)), n >= SCRIPT.length ? 4000 : SCRIPT[n - 1]?.who === "tool" ? 900 : 1700);
    return () => clearTimeout(t);
  }, [n]);
  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight, behavior: "smooth" }); }, [n]);
  return (
    <div className="chat" aria-label="Example conversation with Rocco">
      <div className="chat-bar"><span className="dot r" /><span className="dot y" /><span className="dot g" /><span className="fine">Claude · Rocco connected</span></div>
      <div className="chat-body" ref={box}>
        {SCRIPT.slice(0, Math.min(n, SCRIPT.length)).map((m, i) => {
          if (m.who === "time") return <div key={i} className="chat-time">— {m.text} —</div>;
          if (m.who === "tool") return <div key={i} className="chat-tool"><span>⚙︎</span> {m.name.includes("·") ? <code>{m.name}</code> : <>Rocco · <code>{m.name}</code></>}</div>;
          if (m.who === "you") return (
            <div key={i} className="chat-you">
              {m.file && <div className="chat-file">📎 {m.file}</div>}
              {m.text}
            </div>
          );
          return (
            <div key={i} className="chat-rocco">
              <svg width="28" height="24" viewBox="15 5 170 140" aria-hidden><RoccoHead mood="smirk" id={`c${i}`} /></svg>
              <div>
                <p>{m.text}</p>
                {m.bullets && <ul>{m.bullets.map((b) => <li key={b}>{b}</li>)}</ul>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
