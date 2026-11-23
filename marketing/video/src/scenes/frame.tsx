import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { enter } from "../anim";
import { TYPE } from "../../../brand/tokens";
import { useAreas } from "../layout";
import { displayStyle, kickerStyle, T } from "../theme";
import { Cursor, type Tap } from "../ui/Cursor";
import { Fit } from "../ui/Fit";
import { SampleChip } from "../ui/SampleChip";

/** Page background (the site's --bg) with the soft blue glow the homepage puts behind its hero visual. */
export const SceneFrame: React.FC<{ children: React.ReactNode; glow?: boolean; overlay?: React.ReactNode }> = ({ children, glow = true, overlay }) => {
  const { content, width, height } = useAreas();
  return (
    <AbsoluteFill style={{ background: T.bg, fontFamily: T.body, color: T.ink }}>
      {glow && <div style={{ position: "absolute", left: width * 0.18, top: height * 0.22, width: width * 0.8, height: height * 0.6, background: "radial-gradient(closest-side, rgba(31,111,235,.16), transparent)", filter: "blur(40px)" }} />}
      <div style={{ position: "absolute", left: content.x, top: content.y, width: content.w, height: content.h, display: "flex", flexDirection: "column", minHeight: 0 }}>{children}</div>
      {overlay}
    </AbsoluteFill>
  );
};

export interface HeadingProps {
  kicker?: string;
  title?: string | string[];
  /** Index of the title line to print in the site's blue. */
  blueLine?: number;
  /** "wide" keeps the heading for 16:9 only, so a tall piece (the morning card) gets the whole frame in 9:16 and 4:5. */
  headingIn?: "all" | "wide";
}

export const Heading: React.FC<HeadingProps & { size?: number; align?: "left" | "center"; delay?: number }> = ({ kicker, title, blueLine, size, align = "left", delay = 0 }) => {
  const frame = useCurrentFrame();
  const { layout } = useAreas();
  const lines = title === undefined ? [] : Array.isArray(title) ? title : [title];
  const fs = size ?? TYPE[layout].title;
  if (!kicker && !lines.length) return null;
  return (
    <div style={{ textAlign: align, ...enter(frame, delay, 9) }}>
      {kicker && <div style={{ ...kickerStyle, fontSize: Math.max(22, fs * 0.36), marginBottom: fs * 0.26 }}>{kicker}</div>}
      {lines.length > 0 && <div style={{ ...displayStyle, fontSize: fs, textWrap: "balance" } as React.CSSProperties}>{lines.map((l, i) => <div key={i} style={i === blueLine ? { color: T.accent } : undefined}>{l}</div>)}</div>}
    </div>
  );
};

/**
 * The shared shape of every "site UI" scene: optional heading, the sample chip when the piece shows the sample
 * account, and the piece itself scaled to fit. Stacked in 9:16 and 4:5, side by side in 16:9.
 */
export const VisualScene: React.FC<HeadingProps & { sample: boolean; width: number; taps?: Tap[]; children: React.ReactNode }> = ({ kicker, title, blueLine, headingIn = "all", sample, width, taps, children }) => {
  const { wide, u } = useAreas();
  const hasHead = Boolean(kicker || (Array.isArray(title) ? title.length : title)) && (wide || headingIn === "all");
  const chipInText = wide && hasHead; // in 16:9 the chip sits under the heading, so the piece gets the full height
  const visual = (
    <div style={{ flex: 1, minHeight: 0, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 22 * u }}>
      {sample && !chipInText && <SampleChip style={{ flex: "none" }} />}
      <div style={{ flex: 1, minHeight: 0, width: "100%" }}><Fit width={width}>{children}</Fit></div>
    </div>
  );
  return (
    <SceneFrame overlay={taps?.length ? <Cursor taps={taps} /> : null}>
      {wide ? (
        <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: hasHead ? "minmax(0, .72fr) minmax(0, 1.28fr)" : "minmax(0, 1fr)", gap: 70, alignItems: "center" }}>
          {hasHead && (
            <div style={{ display: "grid", gap: 34, justifyItems: "start" }}>
              <Heading kicker={kicker} title={title} blueLine={blueLine} />
              {sample && <SampleChip />}
            </div>
          )}
          <div style={{ height: "100%", minHeight: 0, display: "flex" }}>{visual}</div>
        </div>
      ) : (
        <>
          {hasHead && <div style={{ flex: "none", marginBottom: 26 * u }}><Heading kicker={kicker} title={title} blueLine={blueLine} align="center" /></div>}
          {visual}
        </>
      )}
    </SceneFrame>
  );
};
