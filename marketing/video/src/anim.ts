import { Easing, interpolate } from "remotion";

export const EASE = Easing.bezier(0.2, 0.9, 0.2, 1);
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0 to 1 between start and start + dur (frames), eased. */
export const prog = (frame: number, start: number, dur: number) => interpolate(frame, [start, start + Math.max(1, dur)], [0, 1], { ...CLAMP, easing: EASE });
export const lin = (frame: number, start: number, dur: number) => interpolate(frame, [start, start + Math.max(1, dur)], [0, 1], CLAMP);

/** Fade up. Default 9 frames = 0.3s at 30fps, under the 0.4s entrance budget. */
export const enter = (frame: number, start = 0, dur = 9, dy = 26) => {
  const p = prog(frame, start, dur);
  return { opacity: p, transform: `translateY(${(1 - p) * dy}px)` } as const;
};
export const pop = (frame: number, start = 0, dur = 8, from = 0.9) => {
  const p = prog(frame, start, dur);
  return { opacity: p, transform: `scale(${from + (1 - from) * p})` } as const;
};

import type { TapState } from "../../brand/components/MorningListCard";
export type { TapState };
/** What a tapped button shows at this frame: the site's Approve, then "Making it in Amazon…", then "✓ Done". */
export function tapState(frame: number, tapFrame: number | undefined, fps: number, makingSec = 0.85): TapState {
  if (tapFrame === undefined || frame < tapFrame) return "open";
  if (frame < tapFrame + 4) return "press";
  if (frame < tapFrame + 4 + Math.round(makingSec * fps)) return "making";
  return "done";
}
