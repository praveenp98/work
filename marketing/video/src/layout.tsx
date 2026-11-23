import React, { createContext, useContext } from "react";
import { FORMATS } from "../../brand/tokens";

/** One source, three sizes. Scenes read their geometry from here and never hardcode a canvas size. */
export type Layout = "9x16" | "4x5" | "16x9";
export const LAYOUTS: Layout[] = ["9x16", "4x5", "16x9"];

export interface Box { x: number; y: number; w: number; h: number }
export interface Areas {
  layout: Layout;
  width: number;
  height: number;
  /** True for 16:9: scenes go side by side instead of stacked. */
  wide: boolean;
  /** Platform UI covers the frame outside this box. Nothing that matters goes there. */
  safe: Box;
  /** Where burned-in captions sit (inside the safe box, at its bottom). */
  caption: Box;
  /** Where a scene puts its content (safe box minus the caption band). */
  content: Box;
  /** Type scale: multiply video-level font sizes by this. */
  u: number;
}

const make = (layout: Layout, width: number, height: number, m: { top: number; bottom: number; side: number }, captionH: number, u: number): Areas => {
  const safe = { x: m.side, y: m.top, w: width - m.side * 2, h: height - m.top - m.bottom };
  const gap = 20;
  const caption = { x: safe.x, y: safe.y + safe.h - captionH, w: safe.w, h: captionH };
  const content = { x: safe.x, y: safe.y, w: safe.w, h: safe.h - captionH - gap };
  return { layout, width, height, wide: width > height, safe, caption, content, u };
};

// Canvas sizes and safe zones come from marketing/brand/tokens.ts (FORMATS), the same numbers image templates use.
const area = (layout: Layout, captionH: number, u: number): Areas => { const f = FORMATS[layout]; return make(layout, f.width, f.height, f.safe, captionH, u); };
export const AREAS: Record<Layout, Areas> = {
  // Reels / Shorts / TikTok: nothing important in the top 250px or the bottom 400px.
  "9x16": area("9x16", 190, 1),
  // Feed / LinkedIn.
  "4x5": area("4x5", 170, 0.94),
  // X / YouTube.
  "16x9": area("16x9", 150, 1),
};

const Ctx = createContext<Areas>(AREAS["9x16"]);
export const LayoutProvider: React.FC<{ layout: Layout; children: React.ReactNode }> = ({ layout, children }) => <Ctx.Provider value={AREAS[layout]}>{children}</Ctx.Provider>;
export const useAreas = () => useContext(Ctx);
