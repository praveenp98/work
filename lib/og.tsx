import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { OFFER, SITE_URL } from "@/marketing/config/offer";

/**
 * Share images (Open Graph / X cards), made in code so they never drift from the positioning again.
 * One look for every page: the site's page colour, Raleway headline, the raccoon, and the same footer.
 * A page gets its own image with a two-line file next to it:
 *
 *   // app/<route>/opengraph-image.tsx
 *   export { alt, contentType, size } from "@/lib/og";
 *   export default () => ogImage({ kicker: "Guide", title: "…" });
 *
 * and the same in twitter-image.tsx (X reads its own tag). Fonts are the site's (Raleway 500, Inter 400/600),
 * kept as files in lib/og-fonts because the image renderer can't use next/font.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
/** Default alt text. Pages with their own image export their own `alt`. */
export const alt = `Rocco: your AI Amazon manager. Every morning I find what to fix. You approve, I make the change in Amazon.`;

export const OG_FOOTER = `${SITE_URL.replace(/^https?:\/\//, "")} · ${OFFER.guarantee.days}-day money-back`;

const C = { bg: "#f4f2ee", ink: "#1c2433", muted: "#5d6676", line: "#e2ddd5", accent: "#1f6feb", green: "#1f9d63", greenDeep: "#157a4b" };
const file = (rel: string) => readFile(path.join(process.cwd(), rel));
const dataUri = async (rel: string) => `data:image/png;base64,${(await file(rel)).toString("base64")}`;

export interface OgProps {
  /** Small caps line above the headline. */
  kicker?: string;
  title: string;
  sub?: string;
  /** Green pill above the footer, e.g. "Free, no login". */
  chip?: string;
  /** Which raccoon (public/brand/rocco-<pose>.png). */
  pose?: "hero" | "wave" | "judge" | "party";
}

export async function ogImage({ kicker = "Real work without the fluff", title, sub, chip, pose = "hero" }: OgProps) {
  const [raleway, inter, interBold, rocco, logo] = await Promise.all([
    file("lib/og-fonts/raleway-500.woff"), file("lib/og-fonts/inter-400.woff"), file("lib/og-fonts/inter-600.woff"),
    dataUri(`public/brand/rocco-${pose}.png`), dataUri("public/brand/rocco-logo-240.png"),
  ]);
  const titleSize = title.length > 58 ? 56 : title.length > 40 ? 66 : title.length > 18 ? 78 : 92;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: C.bg, color: C.ink, fontFamily: "Inter", position: "relative" }}>
        <div style={{ position: "absolute", right: -70, top: 70, width: 600, height: 600, borderRadius: 600, background: "#e2eee5", display: "flex" }} />
        <div style={{ position: "absolute", left: 0, top: 0, width: 14, height: "100%", background: C.green, display: "flex" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 790, padding: "54px 0 50px 72px" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <img src={logo} width={56} height={56} style={{ borderRadius: 14 }} />
            <span style={{ marginLeft: 14, fontFamily: "Raleway", fontSize: 38, letterSpacing: -1 }}>Rocco</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 22, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", color: C.greenDeep }}>{kicker}</span>
            <span style={{ marginTop: 16, fontFamily: "Raleway", fontSize: titleSize, lineHeight: 1.04, letterSpacing: -titleSize * 0.035 }}>{title}</span>
            {sub ? <span style={{ marginTop: 22, fontSize: 31, lineHeight: 1.35, color: C.muted }}>{sub}</span> : null}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {chip ? (
              <div style={{ display: "flex", marginBottom: 18 }}>
                <span style={{ padding: "8px 20px", borderRadius: 999, background: C.green, color: "#fff", fontSize: 24, fontWeight: 600 }}>{chip}</span>
              </div>
            ) : null}
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ width: 12, height: 12, borderRadius: 12, background: C.green, display: "flex" }} />
              <span style={{ marginLeft: 12, fontSize: 27, fontWeight: 600 }}>{OG_FOOTER}</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flex: 1, alignItems: "flex-end", justifyContent: "center", paddingBottom: 46 }}>
          <img src={rocco} width={400} height={480} />
        </div>
        <span style={{ position: "absolute", right: 40, bottom: 22, fontSize: 17, color: C.muted }}>{OFFER.disclaimer}</span>
      </div>
    ),
    { ...size, fonts: [{ name: "Raleway", data: raleway, weight: 500, style: "normal" }, { name: "Inter", data: inter, weight: 400, style: "normal" }, { name: "Inter", data: interBold, weight: 600, style: "normal" }] },
  );
}
