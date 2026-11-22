import React from "react";
import { SAMPLE } from "../config";
import { useAreas } from "../layout";
import { T } from "../theme";

/**
 * Hard rule: any frame that shows the sample account (Bamboo & Co) or its numbers carries this chip. Scenes place it; it never
 * animates out and never fades below full opacity.
 */
export const SampleChip: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  const { u } = useAreas();
  return (
    <span data-sample-chip style={{ display: "inline-flex", alignItems: "center", gap: 12 * u, padding: `${10 * u}px ${22 * u}px ${10 * u}px ${18 * u}px`, borderRadius: 999, background: T.white, border: `2px solid ${T.ink}`, color: T.ink, fontFamily: T.body, fontWeight: 700, fontSize: 26 * u, letterSpacing: ".04em", textTransform: "uppercase", lineHeight: 1.2, whiteSpace: "nowrap", ...style }}>
      <i style={{ width: 14 * u, height: 14 * u, borderRadius: "50%", background: "#e8a33d", flex: "none" }} />
      {SAMPLE.label}
    </span>
  );
};
