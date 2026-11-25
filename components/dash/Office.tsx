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
export function Office({ events, state, variant, holdMs = 7000, scope, onRocco }: { events: OfficeEvent[]; state: OfficeState; variant?: "hero"; holdMs?: number; /** Only react to events sent with this scope (several offices on one page). */ scope?: string; /** Clicking Rocco (people do). */ onRocco?: () => void }) {
  const stateRef = useRef(state); stateRef.current = state;
  const eventsRef = useRef(events); eventsRef.current = events;
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
  const [logOpen, setLogOpen] = useState(false);
  const poke = () => { if (onRocco) onRocco(); else setSay(pos === "bed" ? "I'm up! Everything's done for now. I'll do my next rounds in the morning." : `I'm ${DOING[pos]}. ${say}`.slice(0, 160)); };
  const timers = useRef<number[]>([]);
  const bubble = useRef<HTMLDivElement>(null);
  // Keep the speech bubble inside the room, every frame (Rocco walks and the bubble moves with him).
  useEffect(() => {
    let raf = 0;
    const fit = () => {
      const b = bubble.current, room = b?.closest(".of-stage");
      if (b && room) {
        const cur = parseFloat(b.style.getPropertyValue("--nudge")) || 0;
        const r = b.getBoundingClientRect(), o = room.getBoundingClientRect();
        const left = r.left - cur, right = r.right - cur;
        const d = left < o.left + 6 ? o.left + 6 - left : right > o.right - 6 ? o.right - 6 - right : 0;
        if (Math.abs(d - cur) > 0.5) b.style.setProperty("--nudge", `${Math.round(d)}px`);
      }
      raf = requestAnimationFrame(fit);
    };
    raf = requestAnimationFrame(fit);
    return () => cancelAnimationFrame(raf);
  }, []);
  const here = useRef<Station>(state.station);

  const go = useCallback((to: Station, text: string) => {
    setLeft(x(to) < x(here.current));
    if (to !== here.current) { setWalking(true); timers.current.push(window.setTimeout(() => setWalking(false), 1100)); }
    here.current = to;
    setPos(to); setSay(text);
  }, []);
  const settle = useCallback(() => {
    const st = stateRef.current;
    const next = st.nextRunAt ? ` · next rounds ${new Date(st.nextRunAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}` : "";
    go(st.station, st.text + next);
  }, [go]);

  const replay = useCallback(() => {
    timers.current.forEach(clearTimeout); timers.current = [];
    const events = eventsRef.current;
    if (!events.length) { settle(); return; }
    setShown(0);
    events.forEach((e, i) => timers.current.push(window.setTimeout(() => { go(e.station, e.text); setShown(i + 1); }, 400 + i * STEP_MS)));
    timers.current.push(window.setTimeout(settle, 400 + events.length * STEP_MS));
  }, [go, settle]);

  useEffect(() => {
    setHour(new Date().getHours()); setMounted(true);
    if (!variant) { try { if (localStorage.getItem("rocco_office") === "closed") setOpen(false); } catch {} }
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    setStill(reduce);
    if (reduce) settle(); else replay();
    const onAct = (e: Event) => {
      const d = (e as CustomEvent<{ station: Station; text: string; scope?: string }>).detail;
      if ((d.scope ?? undefined) !== scope) return;
      timers.current.forEach(clearTimeout); timers.current = [];
      const ev = { at: new Date().toISOString(), station: d.station, text: d.text };
      setLog((l) => [...l, ev].slice(-20)); setShown((n) => n + 1);
      go(d.station, d.text);
      if (holdMs > 0) timers.current.push(window.setTimeout(settle, holdMs));
    };
    window.addEventListener("rocco:act", onAct);
    return () => { window.removeEventListener("rocco:act", onAct); timers.current.forEach(clearTimeout); };
  }, [go, replay, settle, holdMs, scope]);

  const toggle = () => { setOpen((o) => { try { localStorage.setItem("rocco_office", o ? "closed" : "open"); } catch {} return !o; }); };
  const sky = hour < 6 || hour >= 20 ? "night" : hour < 11 ? "morning" : hour < 17 ? "day" : "dusk";
  const visible = log.slice(0, shown).slice(-6).reverse();

  return (
    <section className={`of of-${sky}${variant ? ` of-${variant}` : ""}${logOpen ? " log-open" : ""}`} aria-label="What Rocco is doing">
      <div className="of-bar" onClick={(e) => { if (!(e.target as HTMLElement).closest("button")) setLogOpen((v) => !v); }} title="What Rocco did lately">
        <span className={`of-live${pos === "bed" ? " idle" : ""}`} aria-hidden />
        <span className="of-mini" aria-hidden><Raccoon size={22} /></span>
        <b>Rocco is {DOING[pos]}</b>
        <span className="of-say" aria-live="polite">{say}</span>
        <span className="of-btns">
          {!variant && open && events.length > 0 && !still && <button className="linkbtn" onClick={replay}>Replay</button>}
          {!variant && <button className="linkbtn" onClick={toggle} aria-expanded={open}>{open ? "Hide office" : "Show office"}</button>}
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
            <div className={`of-rocco${walking ? " walk" : ""}${left ? " left" : ""}${pos === "bed" ? " sleepy" : ""}${x(pos) < 20 ? " edge-l" : x(pos) > 80 ? " edge-r" : ""}`} style={{ ["--x" as string]: `${x(pos)}%` }}>
              <div className="of-bubble" key={say} ref={bubble}>{say}</div>
              <button type="button" className="of-body" onClick={poke} aria-label={onRocco ? "Try Rocco's demo account" : "Ask Rocco what he's doing"}><Rocco pose={POSE[pos]} size={96} /></button>
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
