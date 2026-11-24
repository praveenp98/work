import React from "react";
import { FONTS, ROLES } from "../tokens";

/**
 * Signature element: the "YES" reply bubble, the moment the seller approves. On the site it is the primary blue
 * (.hmsg-b.me in app/page.tsx, .hf-bub in the hero flow); the colour comes from ROLES.yesBubble, so one token
 * changes it everywhere. Self-contained (inline styles): no site CSS needed.
 * `size` is the font size in px on your canvas.
 */
export const YesBubble: React.FC<{ text?: string; size?: number; style?: React.CSSProperties }> = ({ text = "YES", size = 16, style }) => (
  <span data-yes-bubble style={{ display: "inline-block", padding: `${size * 0.62}px ${size * 0.95}px`, borderRadius: `${size * 1.2}px ${size * 1.2}px ${size * 0.4}px ${size * 1.2}px`, background: ROLES.yesBubble.fill, color: ROLES.yesBubble.text, fontFamily: FONTS.body.stack, fontWeight: 600, fontSize: size, lineHeight: 1.3, whiteSpace: "nowrap", ...style }}>{text}</span>
);

/** Rocco's side of the thread, for building a short exchange around the YES. */
export const RoccoBubble: React.FC<{ children: React.ReactNode; size?: number; style?: React.CSSProperties }> = ({ children, size = 16, style }) => (
  <span style={{ display: "inline-block", maxWidth: "85%", padding: `${size * 0.62}px ${size * 0.9}px`, borderRadius: `${size * 1.2}px ${size * 1.2}px ${size * 1.2}px ${size * 0.4}px`, background: ROLES.roccoBubble.fill, color: ROLES.roccoBubble.text, fontFamily: FONTS.body.stack, fontSize: size, lineHeight: 1.42, ...style }}>{children}</span>
);
