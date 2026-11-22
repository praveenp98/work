import React, { createContext, useContext } from "react";
import { AbsoluteFill, interpolate, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { enter } from "../anim";
import { useAreas } from "../layout";
import { T } from "../theme";

export type Shot = "A" | "B" | "C";
export interface FootageSceneProps {
  /** A file in marketing/video/footage/, e.g. "footage/day7-face.mp4". */
  src: string;
  /** A = face cam (phone propped up), B = screen recording, C = static desk clip. Sets the crop defaults. */
  shot: Shot;
  /** Seconds into the clip to start from. */
  startFrom?: number;
  /** "cover" fills the frame and crops; "contain" shows the whole clip on the page background. Default: A and C cover, B contain. */
  fit?: "cover" | "contain";
  /** Where the crop holds on to, 0 to 1 on each axis. Default: A keeps the upper third (your face), C the centre. */
  focus?: { x: number; y: number };
  /** Clip audio, 0 to 1. Default 1 for A (you talking), 0 for B and C. */
  volume?: number;
  /** Small label in the top corner of the safe area, e.g. "day 7". */
  label?: string;
  /** Boxes to blur, in fractions of the output frame. Use on any screen recording that shows a real account. */
  blur?: { x: number; y: number; w: number; h: number }[];
  /** Slow push-in so a static clip doesn't feel frozen. Default on for C. */
  pushIn?: boolean;
}

/** Files the spec asks for that are not on disk. Filled in by the Video composition before rendering. */
export const MissingFiles = createContext<Set<string>>(new Set());

const NAMES: Record<Shot, string> = { A: "face cam", B: "screen recording", C: "desk clip" };

/** Scene 7. Praveen's own clip, cropped for the format, captions on top. A missing file renders a labelled slot, not an error. */
export const FootageScene: React.FC<FootageSceneProps> = ({ src, shot, startFrom = 0, fit, focus, volume, label, blur = [], pushIn }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const { content, safe, width, height, u } = useAreas();
  const missing = useContext(MissingFiles).has(src);
  const mode = fit ?? (shot === "B" ? "contain" : "cover");
  const f = focus ?? (shot === "A" ? { x: 0.5, y: 0.3 } : { x: 0.5, y: 0.5 });
  const zoom = pushIn ?? shot === "C" ? interpolate(frame, [0, durationInFrames], [1, 1.05]) : 1;
  const tag = label ? <div style={{ position: "absolute", left: safe.x, top: safe.y, padding: `${10 * u}px ${22 * u}px`, borderRadius: 999, background: "rgba(255,255,255,.94)", border: `1px solid ${T.line}`, fontFamily: T.body, fontWeight: 700, fontSize: 28 * u, color: T.ink, ...enter(frame, 2, 8, 12) }}>{label}</div> : null;

  if (missing) {
    return (
      <AbsoluteFill style={{ background: T.bg, fontFamily: T.body, color: T.ink }}>
        <div style={{ position: "absolute", left: content.x, top: content.y, width: content.w, height: content.h, borderRadius: 36, border: `4px dashed ${T.muted}`, display: "grid", placeContent: "center", justifyItems: "center", gap: 18 * u, textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 34 * u, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: T.accent }}>Your clip goes here</div>
          <div style={{ fontSize: 54 * u, fontWeight: 600 }}>Shot {shot}: {NAMES[shot]}</div>
          <div style={{ fontSize: 32 * u, color: T.muted, fontFamily: "ui-monospace, Menlo, monospace" }}>marketing/video/{src}</div>
        </div>
        {tag}
      </AbsoluteFill>
    );
  }

  const common = { src: staticFile(src), startFrom: Math.round(startFrom * fps), volume: volume ?? (shot === "A" ? 1 : 0) };
  return (
    <AbsoluteFill style={{ background: mode === "cover" ? "#000" : T.bg }}>
      {mode === "cover" ? (
        <AbsoluteFill><OffthreadVideo {...common} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${f.x * 100}% ${f.y * 100}%`, transform: `scale(${zoom})`, transformOrigin: `${f.x * 100}% ${f.y * 100}%` }} /></AbsoluteFill>
      ) : (
        // The whole clip, as large as the content box allows, as a rounded card on the page background.
        <div style={{ position: "absolute", left: content.x, top: content.y, width: content.w, height: content.h, display: "grid", placeItems: "center" }}>
          <OffthreadVideo {...common} style={{ maxWidth: "100%", maxHeight: "100%", width: "auto", height: "auto", borderRadius: 28, border: `1px solid ${T.line}`, boxShadow: T.shadowCard, transform: `scale(${zoom})` }} />
        </div>
      )}
      {blur.map((b, i) => <div key={i} style={{ position: "absolute", left: b.x * width, top: b.y * height, width: b.w * width, height: b.h * height, backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", background: "rgba(244,242,238,.35)", borderRadius: 12 }} />)}
      {tag}
    </AbsoluteFill>
  );
};
