"use client";
import { useEffect, useRef, useState } from "react";
import { Office } from "@/components/dash/Office";
import { officeAct } from "@/lib/client/office";

type JS = "hidden" | "open" | "making" | "done";
const JOBS = [
  { id: "N1", ic: "✂️", t: "Block 6 searches that waste money", s: "Clicks, no orders · ~$310/mo", v: 310 },
  { id: "H1", ic: "🌱", t: "Exact campaign for 4 searches that sell", s: "12 orders at 14% ACoS", v: 640 },
  { id: "S1", ic: "📦", t: "Restock Bamboo Board 3-pack", s: "Runs out in 9 days", v: 530 },
];

/**
 * The homepage hero, alive: Rocco's office runs a morning on an example account. He pulls data, runs the numbers,
 * pins jobs, a cursor taps Approve, the change lands in Amazon, and the saved counter ticks up. Loops every ~17s.
 * Reduced motion: the finished state, still.
 */
export function LiveHero() {
  const [jobs, setJobs] = useState<Record<string, JS>>({ N1: "hidden", H1: "hidden", S1: "hidden" });
  const [cursor, setCursor] = useState<"off" | "move" | "tap">("off");
  const [saved, setSaved] = useState(1284);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const T = (ms: number, f: () => void) => timers.current.push(window.setTimeout(f, ms));
    const show = (id: string, v: JS) => setJobs((j) => ({ ...j, [id]: v }));
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setJobs({ N1: "done", H1: "open", S1: "open" }); setSaved(1594); return; }
    const loop = () => {
      setJobs({ N1: "hidden", H1: "hidden", S1: "hidden" }); setCursor("off"); setSaved(1284);
      T(300, () => officeAct("dock", "Pulling yesterday's numbers from Amazon…", "hero"));
      T(2400, () => officeAct("desk", "Ran the numbers: 4,812 searches · 6 wasted $214", "hero"));
      T(4600, () => { officeAct("board", "Pinned 3 jobs, worth ~$1,480/mo", "hero"); show("N1", "open"); });
      T(5000, () => show("H1", "open"));
      T(5400, () => show("S1", "open"));
      T(6800, () => officeAct("bell", "3 jobs waiting for your OK", "hero"));
      T(7600, () => setCursor("move"));
      T(9000, () => { setCursor("tap"); show("N1", "making"); officeAct("dock", "Taking N1 to Amazon…", "hero"); });
      T(9600, () => setCursor("off"));
      T(11200, () => { show("N1", "done"); officeAct("lab", "Done in Amazon ✓ I'll check it in a week", "hero"); });
      T(11600, () => { const start = Date.now(); const id = window.setInterval(() => { const k = Math.min(1, (Date.now() - start) / 900); setSaved(Math.round(1284 + 310 * k)); if (k >= 1) clearInterval(id); }, 40); timers.current.push(id); });
      T(17000, loop);
    };
    T(200, loop);
    const t = timers.current;
    return () => t.forEach((x) => { clearTimeout(x); clearInterval(x); });
  }, []);

  return (
    <div className="lh" aria-label="Rocco at work on an example account">
      <div className="lh-chrome" aria-hidden><span /><span /><span /><em>rocco.works · Bamboo &amp; Co <small>example account</small></em></div>
      <Office variant="hero" scope="hero" events={[]} state={{ station: "bell", text: "3 jobs waiting for your OK" }} holdMs={0} />
      <div className="lh-jobs">
        {Object.values(jobs).every((v) => v === "hidden") && <p className="lh-wait"><span /> Getting today&apos;s work ready…</p>}
        <div className="lh-h"><b>Today&apos;s work</b><span className="lh-saved">Saved so far <b>${saved.toLocaleString("en-US")}</b></span></div>
        {JOBS.map((j, i) => (
          <div key={j.id} className={`lh-job s-${jobs[j.id]}`} style={{ ["--i" as string]: i }}>
            <span className="lh-ic" aria-hidden>{j.ic}</span>
            <div><b>{j.t}</b><small>{j.s}</small></div>
            <span className="lh-btn">{jobs[j.id] === "making" ? "Making it…" : jobs[j.id] === "done" ? "✓ Done in Amazon" : "Approve"}</span>
            {j.id === "N1" && cursor !== "off" && <span className={`lh-cursor c-${cursor}`} aria-hidden />}
          </div>
        ))}
      </div>
    </div>
  );
}
