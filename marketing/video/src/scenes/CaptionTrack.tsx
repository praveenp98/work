import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Line } from "../captions";
import { TYPE } from "../../../brand/tokens";
import { useAreas } from "../layout";
import { T } from "../theme";

/**
 * Scene 8 (an overlay, not a scene of its own). Burned-in captions: one line of 3 to 5 words at a time, the word
 * being spoken highlighted in the site's blue. Lives in the caption band of the safe area in every format.
 */
export const CaptionTrack: React.FC<{ lines: Line[] }> = ({ lines }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { caption, layout } = useAreas();
  const t = frame / fps;
  const line = lines.find((l) => t >= l.start && t < l.end + 0.12);
  if (!line) return null;
  const since = (t - line.start) * fps;
  const k = interpolate(since, [0, 4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fs = TYPE[layout].caption;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 10 }}>
      <div style={{ position: "absolute", left: caption.x, top: caption.y, width: caption.w, height: caption.h, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ maxWidth: "100%", padding: `${fs * 0.24}px ${fs * 0.5}px`, borderRadius: fs * 0.5, background: "rgba(255,255,255,.96)", border: `1px solid ${T.line}`, boxShadow: "0 14px 34px -14px rgba(28,36,51,.4)", fontFamily: T.body, fontWeight: 700, fontSize: fs, lineHeight: 1.22, letterSpacing: "-0.01em", color: T.ink, textAlign: "center", textWrap: "balance", opacity: k, transform: `translateY(${(1 - k) * 10}px) scale(${0.97 + 0.03 * k})` } as React.CSSProperties}>
          {line.words.map((w, i) => {
            const on = t >= w.start && t < w.end;
            const said = t >= w.end;
            return (
              <React.Fragment key={i}>
                <span style={{ display: "inline-block", padding: "0 .16em", margin: "0 -.04em", borderRadius: ".22em", background: on ? T.accent : "transparent", color: on ? "#fff" : said ? T.ink : T.muted }}>{w.text}</span>
                {i < line.words.length - 1 ? " " : null}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
