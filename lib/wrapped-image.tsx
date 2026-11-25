import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { everyFromShare, PERSONAS, type Share } from "./wrapped";

/** Seller Wrapped share images from the short share code: "story" 1080×1920 (Instagram/LinkedIn stories) or "post" 1200×630 (X, LinkedIn link preview). */
const file = (rel: string) => readFile(path.join(process.cwd(), rel));
export const periodLabel = (days: number) => (days >= 360 && days <= 366 ? "last 12 months" : [30, 60, 90].includes(days) ? `last ${days} days` : "this year");

export async function wrappedImage(s: Share | null, f: "story" | "post") {
  const [raleway, inter, interBold, rocco] = await Promise.all([
    file("lib/og-fonts/raleway-500.woff"), file("lib/og-fonts/inter-400.woff"), file("lib/og-fonts/inter-600.woff"),
    file("public/brand/rocco-party.png").then((b) => `data:image/png;base64,${b.toString("base64")}`),
  ]);
  const P = s ? PERSONAS[s.persona] : null;
  const story = f === "story";
  const W = story ? 1080 : 1200, H = story ? 1920 : 630;
  const stats: [string, string][] = s ? ([
    ["Units sold", s.units.toLocaleString("en-US")],
    ["Pace", everyFromShare(s)],
    ["From the top product", `${s.topShare}%`],
    ["Conversion", `${s.conv}%`],
    ...(s.sales !== undefined ? [["Sales", `$${s.sales.toLocaleString("en-US")}`] as [string, string]] : []),
    ...(s.waste !== undefined ? [["Ad spend wasted", `${s.waste}%`] as [string, string]] : []),
    ...(s.adShare !== undefined && s.sales === undefined ? [["Sales from ads", `${s.adShare}%`] as [string, string]] : []),
  ] as [string, string][]).slice(0, story ? 6 : 4) : [];
  const k = story ? 1.6 : 1;
  const bg = "linear-gradient(155deg, #ff3d77 0%, #9333ea 45%, #1e1b4b 100%)";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", backgroundImage: bg, color: "#fff", fontFamily: "Inter", padding: story ? "110px 84px 90px" : "48px 60px", position: "relative" }}>
        <div style={{ position: "absolute", right: -160, top: -160, width: 620, height: 620, borderRadius: 620, background: "rgba(255,255,255,0.10)", display: "flex" }} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 22 * k, fontWeight: 600, letterSpacing: 5, opacity: 0.85 }}>{`AMAZON SELLER WRAPPED · ${s ? periodLabel(s.days).toUpperCase() : ""}`}</span>
          <span style={{ marginTop: 18 * k, fontSize: 34 * k, opacity: 0.85 }}>I&apos;m</span>
          <span style={{ fontFamily: "Raleway", fontSize: (story ? 118 : 78), lineHeight: 1, letterSpacing: -3, maxWidth: story ? 920 : 760 }}>{P?.name ?? "Amazon Seller Wrapped"}</span>
          <span style={{ marginTop: 14 * k, fontSize: 30 * k, opacity: 0.9, maxWidth: story ? 900 : 720 }}>{P?.line ?? "Your year on Amazon, in one card."}</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14 * k, maxWidth: story ? 920 : 820 }}>
          {stats.map(([a, b]) => (
            <div key={a} style={{ display: "flex", flexDirection: "column", width: story ? 440 : 395, padding: `${14 * k}px ${20 * k}px`, borderRadius: 20 * k, background: "rgba(255,255,255,0.13)" }}>
              <span style={{ fontSize: 20 * k, opacity: 0.8 }}>{a}</span>
              <span style={{ fontSize: (b.length > 16 ? 30 : 40) * k, fontWeight: 600, marginTop: 4 }}>{b}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 26 * k, fontWeight: 600 }}>Get yours free</span>
            <span style={{ fontSize: 24 * k, opacity: 0.85 }}>rocco.works/free/amazon-seller-wrapped</span>
          </div>
        </div>
        <img src={rocco} width={story ? 290 : 250} height={story ? 348 : 300} style={story ? { position: "absolute", right: 70, top: 560 } : { position: "absolute", right: 30, bottom: 0 }} />
      </div>
    ),
    { width: W, height: H, fonts: [{ name: "Raleway", data: raleway, weight: 500, style: "normal" }, { name: "Inter", data: inter, weight: 400, style: "normal" }, { name: "Inter", data: interBold, weight: 600, style: "normal" }] },
  );
}
