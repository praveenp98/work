import React from "react";
import { SAMPLE } from "../../config/sample";
import { FONTS, RADII, ROLES } from "../tokens";

/**
 * Signature element: the "Sample account" chip. Hard rule: any frame, image or page that shows Bamboo & Co or
 * its numbers carries it, fully visible, for as long as the numbers are on screen.
 * `size` is the font size in px on the canvas you are drawing on (see TYPE[format].chip in tokens.ts).
 */
export const SampleChip: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 14, style }) => (
  <span data-sample-chip style={{ display: "inline-flex", alignItems: "center", gap: size * 0.46, padding: `${size * 0.38}px ${size * 0.85}px ${size * 0.38}px ${size * 0.7}px`, borderRadius: RADII.pill, background: ROLES.sampleChip.fill, border: `${Math.max(1.5, size / 13)}px solid ${ROLES.sampleChip.border}`, color: ROLES.sampleChip.text, fontFamily: FONTS.body.stack, fontWeight: 700, fontSize: size, letterSpacing: ".04em", textTransform: "uppercase", lineHeight: 1.2, whiteSpace: "nowrap", ...style }}>
    <i style={{ width: size * 0.54, height: size * 0.54, borderRadius: "50%", background: ROLES.sampleChip.dot, flex: "none" }} />
    {SAMPLE.label}
  </span>
);
