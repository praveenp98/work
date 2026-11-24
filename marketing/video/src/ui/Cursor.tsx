import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { EASE } from "../anim";
import { useAreas } from "../layout";

export interface Tap { target: string; at: number } // target = a data-tap value, at = frame of the tap

/**
 * A touch dot that travels to each [data-tap] target and taps it. Positions are read from the real DOM every
 * frame, so it lands on the button wherever the layout put it, in every format.
 */
export const Cursor: React.FC<{ taps: Tap[] }> = ({ taps }) => {
  const frame = useCurrentFrame();
  const { width, height, content, u } = useAreas();
  const root = useRef<HTMLDivElement>(null);
  const [pts, setPts] = useState<({ x: number; y: number } | null)[]>([]);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const k = r.width ? el.offsetWidth / r.width : 1; // the Studio preview is scaled; renders are 1:1
    const scope = el.parentElement ?? document;
    const next = taps.map((t) => {
      const n = scope.querySelector(`[data-tap="${t.target}"]`);
      if (!n) return null;
      const b = n.getBoundingClientRect();
      return { x: (b.left + b.width / 2 - r.left) * k, y: (b.top + b.height / 2 - r.top) * k };
    });
    if (JSON.stringify(next) !== JSON.stringify(pts)) setPts(next);
  });

  const TRAVEL = 13, LEAD = 5;
  let pos = { x: content.x + content.w * 0.82, y: Math.min(height, content.y + content.h + 60) };
  let opacity = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" });
  let press = 0, ripple = -1;
  taps.forEach((t, i) => {
    const p = pts[i];
    if (!p) return;
    const startMove = t.at - LEAD - TRAVEL;
    if (frame >= startMove) {
      const k = interpolate(frame, [startMove, t.at - LEAD], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });
      pos = { x: pos.x + (p.x - pos.x) * k, y: pos.y + (p.y - pos.y) * k };
    }
    if (frame >= t.at - 2 && frame < t.at + 5) press = interpolate(frame, [t.at - 2, t.at, t.at + 5], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    if (frame >= t.at && frame < t.at + 14) ripple = (frame - t.at) / 14;
  });
  // Once the last tap has landed, get out of the way so the result underneath can be read.
  const lastAt = taps.length ? taps[taps.length - 1].at : 0;
  opacity *= interpolate(frame, [lastAt + 10, lastAt + 18], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (!taps.length || pts.every((p) => !p)) opacity = 0;
  const d = 62 * u;

  return (
    <AbsoluteFill ref={root} style={{ pointerEvents: "none", zIndex: 5, width, height }}>
      {ripple >= 0 && <div style={{ position: "absolute", left: pos.x, top: pos.y, width: d, height: d, marginLeft: -d / 2, marginTop: -d / 2, borderRadius: "50%", border: "3px solid rgba(31,111,235,.75)", transform: `scale(${1 + ripple * 1.5})`, opacity: 1 - ripple }} />}
      <div style={{ position: "absolute", left: pos.x, top: pos.y, width: d, height: d, marginLeft: -d / 2, marginTop: -d / 2, borderRadius: "50%", background: "rgba(28,36,51,.34)", border: "3px solid rgba(255,255,255,.95)", boxShadow: "0 6px 18px rgba(28,36,51,.35)", transform: `scale(${1 - press * 0.2})`, opacity }} />
    </AbsoluteFill>
  );
};
