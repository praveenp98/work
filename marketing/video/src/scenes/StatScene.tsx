import React from "react";
import { useCurrentFrame } from "remotion";
import { enter, pop } from "../anim";
import { usesSample } from "../config";
import { useAreas } from "../layout";
import { displayStyle, kickerStyle, T } from "../theme";
import { SampleChip } from "../ui/SampleChip";
import { SceneFrame } from "./frame";

export interface StatSceneProps {
  /** The number, exactly as printed: "$770/mo". */
  value: string;
  /** Where the number comes from, printed under it: "1 hr/day at $35/hr". Required. */
  source: string;
  kicker?: string;
  /** One line above or beside the number: what it measures. */
  label?: string;
}

/**
 * Scene 6. One number with its source line. A number without a source does not render: that is the rule that
 * keeps made-up stats out of the videos. The value never counts up, so no frame shows a number that isn't real.
 */
export const StatScene: React.FC<StatSceneProps> = ({ value, source, kicker, label }) => {
  if (!source || !source.trim()) throw new Error(`StatScene: "${value}" has no source. Every number needs its source line (e.g. "1 hr/day at $35/hr").`);
  const frame = useCurrentFrame();
  const { content, wide, u } = useAreas();
  const sample = usesSample(`${value} ${label ?? ""} ${source}`);
  const size = Math.floor(Math.min(wide ? 300 : 280 * u, content.w / (value.length * 0.56)));
  return (
    <SceneFrame>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 26 * u }}>
        {sample && <SampleChip />}
        {kicker && <div style={{ ...kickerStyle, fontSize: 30 * u, ...enter(frame, 0, 8, 14) }}>{kicker}</div>}
        {label && <div style={{ fontSize: 46 * u, color: T.muted, maxWidth: content.w * 0.9, lineHeight: 1.25, ...enter(frame, 1, 9) }}>{label}</div>}
        <div style={{ ...displayStyle, fontSize: size, lineHeight: 1, fontVariantNumeric: "tabular-nums", ...pop(frame, 2, 9, 0.86) }}>{value}</div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 14 * u, padding: `${14 * u}px ${28 * u}px`, borderRadius: 999, background: T.white, border: `1px solid ${T.line}`, boxShadow: T.shadow, fontSize: 36 * u, color: T.ink, fontWeight: 500, maxWidth: content.w, ...enter(frame, 6, 9) }}>
          <span style={{ color: T.muted, fontSize: 26 * u, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>Source</span>{source}
        </div>
      </div>
    </SceneFrame>
  );
};
