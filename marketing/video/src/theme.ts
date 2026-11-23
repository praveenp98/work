/**
 * Video-level tokens. Nothing is defined here: every value comes from marketing/brand/tokens.ts (which mirrors
 * the site). UI pieces don't use these: they wear the real site CSS (src/generated/site.css).
 */
import { COLORS, FONTS, RADII, SHADOWS } from "../../brand/tokens";

export const T = {
  bg: COLORS.bg,
  soft: COLORS.bgSoft,
  card: COLORS.card,
  white: COLORS.white,
  ink: COLORS.ink,
  muted: COLORS.muted,
  line: COLORS.line,
  accent: COLORS.accent,
  accentDeep: COLORS.accentDeep,
  green: COLORS.green,
  greenDeep: COLORS.greenDeep,
  radius: RADII.lg,
  radiusLg: RADII.card,
  shadow: SHADOWS.card,
  shadowCard: SHADOWS.float,
  display: FONTS.display.stack,
  body: FONTS.body.stack,
} as const;

/** .big-h on the site: Raleway 500, tight. */
export const displayStyle = { fontFamily: T.display, fontWeight: FONTS.display.weight, letterSpacing: FONTS.display.letterSpacing, lineHeight: FONTS.display.lineHeight, color: T.ink } as const;
/** .kicker on the site. */
export const kickerStyle = { fontFamily: T.body, fontWeight: FONTS.kicker.weight, letterSpacing: FONTS.kicker.letterSpacing, textTransform: FONTS.kicker.transform, color: T.accent } as const;
