"use client";
import { useEffect, useState } from "react";
import { RoccoHead } from "../Rocco";

type B = { from: "rocco" | "me" | "team"; who?: string; text: string };
const THREAD: B[] = [
  { from: "rocco", text: "☀️ Morning! Your numbers:\n📊 $1,570 spend · $5,307 sales · ACoS 30%\n🕳️ Leak $481/mo · 🔥 2 new money-burners\n📦 Bamboo Board L: 14 days of stock\n👉 Reply YES N1 N2 to cut the junk" },
  { from: "team", who: "Sam · ops", text: "how's stock on the set of 3?" },
  { from: "rocco", text: "Set of 3 has 420 days 😅 Overstocked. A small coupon would move it." },
  { from: "me", text: "yes N1 N2" },
  { from: "rocco", text: "Approved ✅ Cutting “plastic cutting board” and “free cutting board”. I'll check Monday if it worked." },
  { from: "rocco", text: "🏆 Last week: 11/14 changes worked, $1,240 saved." },
];

/** iMessage-style thread inside a phone frame, revealing one bubble at a time. */
export function PhoneThread() {
  const [n, setN] = useState(2);
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setN(THREAD.length); return; }
    const t = setTimeout(() => setN((x) => (x >= THREAD.length + 2 ? 2 : x + 1)), n >= THREAD.length ? 3500 : 1600);
    return () => clearTimeout(t);
  }, [n]);
  const shown = THREAD.slice(0, Math.min(n, THREAD.length));
  return (
    <div className="phone" aria-label="Example iMessage conversation with Rocco">
      <div className="phone-notch" />
      <div className="phone-head">
        <svg width="40" height="34" viewBox="15 5 170 140" aria-hidden><RoccoHead mood="smirk" id="ph" /></svg>
        <b>Rocco</b>
        <span>iMessage</span>
      </div>
      <div className="phone-body">
        {shown.map((m, i) => (
          <div key={i} className={`imsg ${m.from === "me" ? "out" : "in"}`}>
            {m.who && <span className="imsg-who">{m.who}</span>}
            <span className="imsg-bubble">{m.text}</span>
          </div>
        ))}
        {n < THREAD.length && <div className="imsg in"><span className="imsg-bubble typing"><i /><i /><i /></span></div>}
      </div>
    </div>
  );
}
