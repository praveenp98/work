/**
 * Video-level tokens. Values are the site's own (app/globals.css :root at line 252 and the home classes in
 * app/connect.css). UI pieces don't use these: they wear the real site CSS (src/generated/site.css).
 */
export const T = {
  bg: "#f4f2ee",
  soft: "#f8f6f2",
  card: "#fcfbf9",
  white: "#ffffff",
  ink: "#1c2433",
  muted: "#5d6676",
  line: "#e2ddd5",
  accent: "#1f6feb",
  accentDeep: "#1559c7",
  green: "#1f9d63",
  greenDeep: "#1f7a4f",
  radius: 22,
  radiusLg: 30,
  shadow: "0 1px 2px rgba(28, 36, 51, .04), 0 12px 32px rgba(28, 36, 51, .07)",
  shadowCard: "0 40px 90px -40px rgba(28, 36, 51, .45)",
  display: '"Raleway", ui-sans-serif, system-ui, sans-serif',
  body: '"Inter Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
} as const;

/** .big-h on the site: Raleway 500, tight. */
export const displayStyle = { fontFamily: T.display, fontWeight: 500, letterSpacing: "-0.035em", lineHeight: 1.04, color: T.ink } as const;
/** .kicker on the site. */
export const kickerStyle = { fontFamily: T.body, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: T.accent } as const;
