import React from "react";
import { useCurrentFrame } from "remotion";
import { enter, pop } from "../anim";
import { OFFER, PRICE_RISE, SITE_URL } from "../config";
import { useAreas } from "../layout";
import { displayStyle, T } from "../theme";
import { Rocco } from "../ui/Mascot";
import { SceneFrame } from "./frame";

export interface EndCardProps {
  /** What you want the viewer to do: "comment rocco", "link in bio", "rocco.works/x". */
  cta: string;
  mascot?: "hero" | "judge" | "party" | "wave";
}

const site = SITE_URL.replace(/^https?:\/\//, "");

/** Scene 9. Where to go, what it costs (from offer.ts), the guarantee, the price rise, one CTA, and Rocco. */
export const EndCard: React.FC<EndCardProps> = ({ cta, mascot = "wave" }) => {
  const frame = useCurrentFrame();
  const { wide, u, content } = useAreas();
  const k = wide ? 1 : u;
  const pill: React.CSSProperties = { padding: `${12 * k}px ${26 * k}px`, borderRadius: 999, background: T.white, border: `1px solid ${T.line}`, fontSize: 32 * k, fontWeight: 600, color: T.ink, whiteSpace: "nowrap" };
  const text = (
    <div style={{ display: "grid", gap: 26 * k, justifyItems: wide ? "start" : "center", textAlign: wide ? "left" : "center" }}>
      <div style={{ ...displayStyle, fontSize: Math.min(150 * k, content.w / (site.length * 0.56)), ...enter(frame, 0, 9) }}>{site}</div>
      <div style={{ fontSize: 50 * k, fontWeight: 600, color: T.ink, ...enter(frame, 2, 9) }}>{OFFER.price.from}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14 * k, justifyContent: wide ? "flex-start" : "center", ...enter(frame, 4, 9) }}>
        <span style={pill}>🛡️ {OFFER.guarantee.days}-day money-back</span>
        <span style={pill}>📈 price goes up every {PRICE_RISE.everyHires} hires</span>
      </div>
      <div style={{ marginTop: 10 * k, padding: `${24 * k}px ${54 * k}px`, borderRadius: 999, background: T.accent, color: "#fff", fontSize: 50 * k, fontWeight: 600, boxShadow: "0 10px 26px rgba(31,111,235,.35)", ...pop(frame, 6, 9, 0.9) }}>{cta}</div>
      <div style={{ fontSize: 24 * k, color: T.muted, ...enter(frame, 8, 9, 10) }}>{OFFER.disclaimer}</div>
    </div>
  );
  const rocco = <div style={{ flex: "none", ...enter(frame, 1, 9, 30) }}><Rocco pose={mascot} size={wide ? 430 : 340 * u} /></div>;
  return (
    <SceneFrame>
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: wide ? "row" : "column", alignItems: "center", justifyContent: "center", gap: wide ? 90 : 30 * u }}>
        {!wide && rocco}{text}{wide && rocco}
      </div>
    </SceneFrame>
  );
};
