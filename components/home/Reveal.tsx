"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

/** Adds "in" when the element scrolls into view (once). Pair with .rv CSS; reduced motion shows it at once. */
export function useInView<T extends Element>(threshold = 0.25) {
  const ref = useRef<T>(null);
  const [inView, setIn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { setIn(true); return; }
    // Any part of it past the lower ~quarter of the screen counts, so tall blocks on phones still trigger.
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setIn(true); io.disconnect(); } }, { threshold: 0, rootMargin: `0px 0px -${Math.round(Math.min(0.5, threshold) * 50)}% 0px` });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

export function Reveal({ children, className = "", as: Tag = "div", delay = 0 }: { children: ReactNode; className?: string; as?: "div" | "li" | "section"; delay?: number }) {
  const [ref, inView] = useInView<HTMLDivElement>(0.15);
  return <Tag ref={ref as never} className={`rv${inView ? " in" : ""} ${className}`} style={{ ["--d" as string]: `${delay}ms` }}>{children}</Tag>;
}

/** A number that counts up from `from` when scrolled into view. */
export function CountUp({ to, from = 0, prefix = "", suffix = "", ms = 1200 }: { to: number; from?: number; prefix?: string; suffix?: string; ms?: number }) {
  const [ref, inView] = useInView<HTMLSpanElement>(0.5);
  const [v, setV] = useState(from);
  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setV(to); return; }
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => { const k = Math.min(1, (t - start) / ms); setV(Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, from, ms]);
  return <span ref={ref}>{prefix}{v.toLocaleString("en-US")}{suffix}</span>;
}

/** Chat bubbles that play in order (with a typing dot) once the thread scrolls into view. */
export function ChatPlay({ lines, className = "hmsg" }: { lines: { me?: boolean; text: ReactNode }[]; className?: string }) {
  const [ref, inView] = useInView<HTMLDivElement>(0.35);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setN(lines.length); return; }
    const ts = lines.map((_, i) => window.setTimeout(() => setN(i + 1), 500 + i * 1500));
    return () => ts.forEach(clearTimeout);
  }, [inView, lines]);
  const typing = inView && n < lines.length && !lines[n]?.me;
  return (
    <div ref={ref} className={className} aria-label="Example conversation with Rocco">
      {lines.slice(0, n).map((l, i) => <p key={i} className={`hmsg-b${l.me ? " me" : ""} pop`}>{l.text}</p>)}
      {typing && <p className="hmsg-b typing" aria-hidden><i /><i /><i /></p>}
      {/* Keeps the box its full height so the page doesn't jump. */}
      <div className="hmsg-ghost" aria-hidden>{lines.slice(n).map((l, i) => <p key={i} className={`hmsg-b${l.me ? " me" : ""}`}>{l.text}</p>)}</div>
    </div>
  );
}

/** Dr. PPC vs Rocco per year at $10k/mo ad spend: bars grow when in view. */
export function PriceBars({ rows }: { rows: { k: string; v: number; note: string; us?: boolean }[] }) {
  const [ref, inView] = useInView<HTMLDivElement>(0.4);
  const max = Math.max(...rows.map((r) => r.v));
  return (
    <div ref={ref} className={`pb${inView ? " in" : ""}`}>
      {rows.map((r) => (
        <div key={r.k} className={`pb-row${r.us ? " us" : ""}`}>
          <span>{r.k}<small>{r.note}</small></span>
          <i style={{ ["--w" as string]: `${(r.v / max) * 100}%` }} />
          <b>{inView ? <CountUp to={r.v} prefix="$" /> : "$0"}/yr</b>
        </div>
      ))}
    </div>
  );
}
