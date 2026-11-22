"use client";
import { useEffect, useState } from "react";

/**
 * Every wait says what's happening, step by step: the current step slides in with a pulsing dot, earlier steps tick
 * off above it. Steps advance on a timer and stop at the last one (the real work decides when the wait ends).
 */
export function LoadingText({ steps, every = 2600, className = "" }: { steps: string[]; every?: number; className?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    setI(0);
    const t = setInterval(() => setI((x) => Math.min(x + 1, steps.length - 1)), every);
    return () => clearInterval(t);
  }, [steps, every]);
  return (
    <ol className={`lt ${className}`} role="status" aria-live="polite">
      {steps.slice(0, i + 1).map((s, k) => (
        <li key={s} className={k < i ? "lt-done" : "lt-now"}>
          <span className="lt-mark" aria-hidden>{k < i ? "✓" : ""}</span>
          <span className="lt-txt">{s}</span>
        </li>
      ))}
    </ol>
  );
}
