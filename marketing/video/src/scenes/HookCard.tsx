import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { enter, lin } from "../anim";
import { useAreas } from "../layout";
import { displayStyle, kickerStyle, T } from "../theme";
import { Rocco } from "../ui/Mascot";
import { SceneFrame } from "./frame";

export interface HookCardProps {
  /** One or two lines. Keep each under about 28 characters. */
  lines: string[];
  kicker?: string;
  /** Words (or short phrases) printed in the site's blue with a marker behind them. */
  highlight?: string[];
  /** Words light up one after another, like someone reading the hook out loud. */
  wordByWord?: boolean;
  /** Show Rocco next to the hook. */
  mascot?: "hero" | "judge" | "party" | "wave";
}

const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9$%]/g, "");

/** Scene 1. Big two-line hook. Everything is on screen within 0.3s; the word-by-word pass is emphasis, not entrance. */
export const HookCard: React.FC<HookCardProps> = ({ lines, kicker, highlight = [], wordByWord = false, mascot }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const { content, wide, u } = useAreas();

  const textW = wide && mascot ? content.w * 0.66 : content.w;
  const target = wide ? 24 : 13; // characters per printed row
  const longest = Math.max(...lines.map((l) => Math.min(l.length, Math.max(target, ...l.split(" ").map((w) => w.length)))));
  const rows = lines.reduce((n, l) => n + Math.ceil(l.length / Math.max(target, longest)), 0);
  const max = wide ? 150 : 150 * u;
  const size = Math.floor(Math.min(max, textW / (longest * 0.54), (content.h * (mascot && !wide ? 0.58 : 0.8)) / (rows * 1.06)));

  const hot = new Set(highlight.flatMap((h) => h.split(/\s+/)).map(norm));
  const words = lines.map((l) => l.split(/\s+/).filter(Boolean));
  const total = words.flat().length;
  const sweepStart = 10, sweepEnd = Math.min(durationInFrames * 0.7, sweepStart + total * fps * 0.22);
  let n = 0;

  const text = (
    <div>
      {kicker && <div style={{ ...kickerStyle, fontSize: Math.max(24, size * 0.2), marginBottom: size * 0.2, ...enter(frame, 0, 8, 16) }}>{kicker}</div>}
      <div style={{ ...displayStyle, fontSize: size, lineHeight: 1.06 }}>
        {words.map((ws, li) => (
          <div key={li} style={enter(frame, li * 2, 9, 30)}>
            {ws.map((w, wi) => {
              const idx = n++;
              const at = sweepStart + (idx / Math.max(1, total)) * (sweepEnd - sweepStart);
              const lit = wordByWord ? lin(frame, at, 4) : 1;
              const isHot = hot.has(norm(w));
              const mark = isHot ? lin(frame, wordByWord ? at : 8 + idx, 6) : 0;
              return (
                <React.Fragment key={wi}>
                  <span style={{ position: "relative", display: "inline-block", color: isHot ? T.accent : T.ink, opacity: 0.32 + 0.68 * lit }}>
                    {isHot && <i style={{ position: "absolute", left: "-0.08em", right: "-0.08em", bottom: "0.06em", height: "0.34em", borderRadius: "0.1em", background: "rgba(31,111,235,.16)", transform: `scaleX(${mark})`, transformOrigin: "0 50%" }} />}
                    <span style={{ position: "relative" }}>{w}</span>
                  </span>
                  {wi < ws.length - 1 ? " " : null}
                </React.Fragment>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
  const rocco = mascot ? <div style={{ flex: "none", ...enter(frame, 2, 9, 30) }}><Rocco pose={mascot} size={wide ? 400 : 330 * u} /></div> : null;

  return (
    <SceneFrame>
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: wide ? "row" : "column", alignItems: wide ? "center" : "flex-start", justifyContent: wide ? "space-between" : "center", gap: wide ? 60 : 40 * u }}>
        {!wide && rocco}
        <div style={{ maxWidth: textW }}>{text}</div>
        {wide && rocco}
      </div>
    </SceneFrame>
  );
};
