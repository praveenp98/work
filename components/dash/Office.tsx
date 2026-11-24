"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Rocco, type Pose } from "@/components/Rocco";
import { Raccoon } from "@/components/Raccoon";
import type { OfficeEvent, OfficeState, Station } from "@/lib/office";

const STATIONS: { id: Station; ic: string; label: string; x: number }[] = [
  { id: "dock", ic: "📦", label: "Amazon dock", x: 7 },
  { id: "desk", ic: "🧮", label: "Number desk", x: 24 },
  { id: "board", ic: "📌", label: "Job board", x: 41 },
  { id: "lab", ic: "🔬", label: "Results lab", x: 58 },
  { id: "bell", ic: "🛎️", label: "Your bell", x: 75 },
  { id: "bed", ic: "🛋️", label: "Nap corner", x: 92 },
];
const POSE: Record<Station, Pose> = { dock: "hero", desk: "judge", board: "hero", lab: "hero", bell: "wave", bed: "judge" };
const DOING: Record<Station, string> = { dock: "hauling", desk: "crunching", board: "pinning", lab: "checking", bell: "waiting", bed: "resting" };
const STEP_MS = 2600;
const x = (s: Station) => STATIONS.find((v) => v.id === s)!.x;
const time = (iso: string) => new Date(iso).toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" });

/**
 * Rocco's office: Rocco walks between stations replaying what he really did (lib/office.ts), then settles where he
 * is now. Approve / undo / check on this page send live events (lib/client/office.ts). Desktop gets the stage; phones
 * get the one-line status. Reduced motion: no replay, no walking.
 */
export function Office({ events, state, compact }: { events: OfficeEvent[]; state: OfficeState; compact?: boolean }) {
  const [pos, setPos] = useState<Station>(state.station);
  const [say, setSay] = useState(state.text);
  const [log, setLog] = useState<OfficeEvent[]>(events);
  const [shown, setShown] = useState(events.length);
  const [walking, setWalking] = useState(false);
  const [left, setLeft] = useState(false);
  const [hour, setHour] = useState(12);
  const [open, setOpen] = useState(true);
  const [still, setStill] = useState(false);
  const [mounted, setMounted] = useState(false);
  const timers = useRef<number[]>([]);
  const here = useRef<Station>(state.station);

  const go = useCallback((to: Station, text: string) => {
    setLeft(x(to) < x(here.current));
    if (to !== here.current) { setWalking(true); timers.current.push(window.setTimeout(() => setWalking(false), 1100)); }
    here.current = to;
    setPos(to); setSay(text);
  }, []);
  const settle = useCallback(() => {
    const next = state.nextRunAt ? ` · next rounds ${new Date(state.nextRunAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}` : "";
    go(state.station, state.text + next);
  }, [go, state]);

  const replay = useCallback(() => {
    timers.current.forEach(clearTimeout); timers.current = [];
    if (!events.length) { settle(); return; }
    setShown(0);
    events.forEach((e, i) => timers.current.push(window.setTimeout(() => { go(e.station, e.text); setShown(i + 1); }, 400 + i * STEP_MS)));
    timers.current.push(window.setTimeout(settle, 400 + events.length * STEP_MS));
  }, [events, go, settle]);

  useEffect(() => {
    setHour(new Date().getHours()); setMounted(true);
    try { if (localStorage.getItem("rocco_office") === "closed") setOpen(false); } catch {}
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    setStill(reduce);
    if (reduce) settle(); else replay();
    const onAct = (e: Event) => {
      const d = (e as CustomEvent<{ station: Station; text: string }>).detail;
      timers.current.forEach(clearTimeout); timers.current = [];
      const ev = { at: new Date().toISOString(), station: d.station, text: d.text };
      setLog((l) => [...l, ev].slice(-20)); setShown((n) => n + 1);
      go(d.station, d.text);
      timers.current.push(window.setTimeout(settle, 7000));
    };
    window.addEventListener("rocco:act", onAct);
    return () => { window.removeEventListener("rocco:act", onAct); timers.current.forEach(clearTimeout); };
  }, [go, replay, settle]);

  const toggle = () => { setOpen((o) => { try { localStorage.setItem("rocco_office", o ? "closed" : "open"); } catch {} return !o; }); };
  const sky = hour < 6 || hour >= 20 ? "night" : hour < 11 ? "morning" : hour < 17 ? "day" : "dusk";
  const visible = log.slice(0, shown).slice(-6).reverse();

  return (
    <section className={`of of-${sky}${compact ? " of-compact" : ""}`} aria-label="What Rocco is doing">
      <div className="of-bar">
        <span className={`of-live${pos === "bed" ? " idle" : ""}`} aria-hidden />
        <span className="of-mini" aria-hidden><Raccoon size={22} /></span>
        <b>Rocco is {DOING[pos]}</b>
        <span className="of-say" aria-live="polite">{say}</span>
        <span className="of-btns">
          {open && events.length > 0 && !still && <button className="linkbtn" onClick={replay}>Replay</button>}
          <button className="linkbtn" onClick={toggle} aria-expanded={open}>{open ? "Hide office" : "Show office"}</button>
        </span>
      </div>
      {open && (
        <div className="of-room">
          <div className="of-stage">
            <div className="of-window" aria-hidden><span className="of-sun" /></div>
            {STATIONS.map((s) => (
              <div key={s.id} className={`of-st st-${s.id}${pos === s.id ? " on" : ""}`} style={{ left: `${s.x}%` }}>
                <span className="of-ic">{s.ic}</span>
                {pos === s.id && s.id === "desk" && <span className="of-fx fx-num" aria-hidden><i>$</i><i>%</i><i>÷</i></span>}
                {pos === s.id && s.id === "dock" && <span className="of-fx fx-box" aria-hidden>📦</span>}
                {pos === s.id && s.id === "board" && <span className="of-fx fx-pin" aria-hidden><i /><i /><i /></span>}
                {pos === s.id && s.id === "bed" && <span className="of-fx fx-z" aria-hidden><i>z</i><i>z</i><i>z</i></span>}
                <small>{s.label}</small>
              </div>
            ))}
            <div className={`of-rocco${walking ? " walk" : ""}${left ? " left" : ""}${pos === "bed" ? " sleepy" : ""}`} style={{ left: `${x(pos)}%` }}>
              <div className="of-bubble" key={say}>{say}</div>
              <div className="of-body"><Rocco pose={POSE[pos]} size={96} /></div>
            </div>
            <div className="of-floor" aria-hidden />
          </div>
          <ol className="of-log" aria-label="Rocco's recent work">
            {visible.length ? visible.map((e, i) => <li key={`${e.at}${e.text}`} className={i === 0 ? "new" : ""}><time suppressHydrationWarning>{mounted ? time(e.at) : ""}</time><span>{e.text}</span></li>) : <li><span>Nothing yet in the last 3 days. My first rounds start after Amazon sends your data.</span></li>}
          </ol>
        </div>
      )}
    </section>
  );
}
