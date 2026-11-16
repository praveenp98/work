"use client";
import { useEffect, useState } from "react";

const LINES = [
  "You paid $412 for people searching “free”. I ate it. You’re welcome.",
  "“cutting board” sells at 52% ACoS. You’re buying customers at a loss and calling it growth.",
  "Your auto campaign found a winner 3 weeks ago. You never noticed. I did.",
  "64 clicks, $91, zero orders. That’s not a keyword. That’s a donation.",
  "You bid on “how to clean a cutting board”. They wanted a sponge.",
  "Your best search term is starving on a $0.80 bid. Feed it.",
];

/** Typewriter speech bubble that cycles Rocco's greatest hits. */
export function RoastTicker() {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(LINES[0]);
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const line = LINES[i];
    if (reduce) {
      setShown(line);
      const t = setTimeout(() => setI((x) => (x + 1) % LINES.length), 5000);
      return () => clearTimeout(t);
    }
    let c = 0;
    setShown("");
    const type = setInterval(() => {
      c++;
      setShown(line.slice(0, c));
      if (c >= line.length) clearInterval(type);
    }, 28);
    const next = setTimeout(() => setI((x) => (x + 1) % LINES.length), line.length * 28 + 2600);
    return () => { clearInterval(type); clearTimeout(next); };
  }, [i]);
  return (
    <div className="speech" aria-live="polite">
      <span className="speech-name">Rocco</span>
      <p>{shown}<span className="caret" aria-hidden /></p>
    </div>
  );
}
