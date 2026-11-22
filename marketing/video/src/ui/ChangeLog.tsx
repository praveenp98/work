import React from "react";
import { SAMPLE } from "../config";

/**
 * Port of components/home/LogDemo.tsx (.ld). Same markup and copy. The site reveals rows with CSS animations;
 * here each row takes `shown` (0 to 1) and `flipped` (0 to 1) from the scene.
 */
export const LOG_WIDTH = 470;
export interface LogRow { icon: string; title: string; detail: string; wait: string; done?: string }
export const DEFAULT_ROWS: LogRow[] = SAMPLE.changeLog.map((r) => ({ ...r }));

const tone = (text: string) => (text.includes("↩") ? "#9a5b00" : "#1f7a4f");

export const ChangeLog: React.FC<{ rows?: LogRow[]; shown: number[]; flipped: number[]; past?: string | false; pastShown?: number; headRight?: string }> = ({ rows = DEFAULT_ROWS, shown, flipped, past = SAMPLE.beforeRocco, pastShown = 1, headRight = `${SAMPLE.brand} · example` }) => (
  <div className="ld" aria-label="Example change log">
    <div className="ld-head"><b>Change log</b><span>{headRight}</span></div>
    {rows.length > 0 && (
      <ul>
        {rows.map((r, i) => {
          const s = shown[i] ?? 1, f = r.done ? flipped[i] ?? 0 : 0;
          const pulse = Math.sin(Math.PI * Math.min(1, f * 1.4)) * (f < 0.72 ? 1 : 0);
          return (
            <li key={r.title} style={{ opacity: s, transform: `translateY(${(1 - s) * 10}px)` }}>
              <span className="ld-ic" aria-hidden>{r.icon}</span>
              <div><b>{r.title}</b><small>{r.detail}</small></div>
              <em className={`ld-st${r.done ? " flip" : ""}`} style={r.done ? { background: `color-mix(in srgb, ${tone(r.done)} ${Math.round(pulse * 12)}%, #fff)` } : undefined}>
                {r.done ? <><span className="a" style={{ opacity: 1 - f }}>{r.wait}</span><span className="b" style={{ opacity: f, color: tone(r.done) }}>{r.done}</span></> : r.wait}
              </em>
            </li>
          );
        })}
      </ul>
    )}
    {past && <p className="ld-past" style={{ opacity: pastShown, transform: `translateY(${(1 - pastShown) * 10}px)` }}>🧠 <b>{past.split(":")[0]}:</b>{past.slice(past.indexOf(":") + 1)}</p>}
  </div>
);
