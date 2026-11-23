import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { COLORS, RADII } from "../marketing/brand/tokens";

/** The site's stylesheet is where the look comes from. marketing/brand/tokens.ts must say the same thing. */
describe("brand tokens match the site's CSS variables", () => {
  const css = fs.readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");
  // The last value of each variable wins, as it does in the browser.
  const cssVar = (name: string) => [...css.matchAll(new RegExp(`--${name}:\\s*([^;]+);`, "g"))].pop()?.[1].trim().toLowerCase();
  const pairs: [string, string][] = [["bg", COLORS.bg], ["bg2", COLORS.bg2], ["card", COLORS.card], ["ink", COLORS.ink], ["muted", COLORS.muted], ["line", COLORS.line], ["accent", COLORS.accent], ["accent-deep", COLORS.accentDeep]];
  it.each(pairs)("--%s", (name, hex) => expect(cssVar(name)).toBe(hex));
  it("--radius", () => expect(cssVar("radius")).toBe(`${RADII.lg}px`));
});
