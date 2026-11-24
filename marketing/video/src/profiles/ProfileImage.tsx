import React from "react";
import { AbsoluteFill } from "remotion";
import { MorningCard, MORNING_WIDTH } from "../../../brand/components/MorningListCard";
import { SampleChip } from "../../../brand/components/SampleChip";
import { COLORS, FONTS, RADII } from "../../../brand/tokens";
import { OFFER } from "../config";
import "../fonts";
import "../generated/site.css";
import { Fit } from "../ui/Fit";
import { RoccoHead } from "../ui/Mascot";
import "../video.css";

/**
 * Profile images for every account (X, Instagram, LinkedIn, YouTube), drawn with the same tokens, fonts,
 * raccoon and morning-list card as everything else. Rendered as stills by scripts/profiles.mjs into
 * marketing/brand/profiles/<account>/. Sizes and the areas each platform covers are in PROFILE_IMAGES.
 */
export type ProfileKind = "avatar" | "banner" | "strip" | "youtube" | "highlight" | "cover";
export type ProfileProps = {
  kind: ProfileKind;
  width: number;
  height: number;
  /** banner / youtube / cover: the big line(s). */
  headline?: string[];
  kicker?: string;
  sub?: string;
  /** banner: px to keep empty on the left, where the platform puts the profile picture. */
  clearLeft?: number;
  /** banner: show the morning-list card (sample account, so the chip comes with it). */
  card?: boolean;
  /** highlight: the emoji in the circle. */
  icon?: string;
  /** avatar: background colour. */
  bg?: string;
};

const display = { fontFamily: FONTS.display.stack, fontWeight: FONTS.display.weight, letterSpacing: FONTS.display.letterSpacing, lineHeight: 1.04, color: COLORS.ink } as const;
const Head: React.FC<{ size: number; id: string }> = ({ size, id }) => <svg width={size * (170 / 140)} height={size} viewBox="15 5 170 140"><RoccoHead mood="smirk" id={id} /></svg>;
const Lockup: React.FC<{ size: number; id: string; domain?: boolean }> = ({ size, id, domain }) => (
  <div style={{ display: "flex", alignItems: "center", gap: size * 0.16 }}>
    <Head size={size * 0.92} id={id} />
    <span style={{ fontFamily: FONTS.display.stack, fontWeight: FONTS.wordmark.weight, letterSpacing: FONTS.wordmark.letterSpacing, fontSize: size, lineHeight: 1, color: COLORS.ink }}>rocco{domain && <span style={{ color: COLORS.muted }}>.works</span>}</span>
  </div>
);
const Glow: React.FC<{ w: number; h: number }> = ({ w, h }) => <div style={{ position: "absolute", right: -w * 0.05, top: -h * 0.3, width: w * 0.6, height: h * 1.6, background: "radial-gradient(closest-side, rgba(31,111,235,.14), transparent)", filter: "blur(30px)" }} />;
const disclaimer = (size: number): React.CSSProperties => ({ fontSize: size, color: COLORS.muted });

export const ProfileImage: React.FC<ProfileProps> = ({ kind, width: w, height: h, headline = [], kicker, sub, clearLeft = 0, card, icon, bg = COLORS.green }) => {
  const base: React.CSSProperties = { background: COLORS.bg, color: COLORS.ink, fontFamily: FONTS.body.stack, width: w, height: h };

  if (kind === "avatar") {
    return <AbsoluteFill className="rv" style={{ ...base, background: bg, alignItems: "center", justifyContent: "center" }}><div style={{ marginTop: h * 0.03 }}><Head size={h * 0.62} id="av" /></div></AbsoluteFill>;
  }

  if (kind === "highlight") {
    // Instagram shows the centre of the cover in a small circle: one emoji on a white disc, nothing near the edges.
    const d = w * 0.5;
    return (
      <AbsoluteFill className="rv" style={{ ...base, alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: d, height: d, borderRadius: "50%", background: COLORS.white, border: `${w * 0.006}px solid ${COLORS.line}`, display: "grid", placeItems: "center", fontSize: d * 0.46, lineHeight: 1 }}>{icon}</div>
      </AbsoluteFill>
    );
  }

  if (kind === "cover") {
    // The one template for every grid cover (posts, reels, carousels): kicker, headline, the same footer.
    const m = w * 0.075;
    return (
      <AbsoluteFill className="rv" style={{ ...base, padding: m, justifyContent: "space-between" }}>
        <Glow w={w} h={h} />
        <div style={{ position: "relative", fontSize: w * 0.026, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: COLORS.accent }}>{kicker}</div>
        <div style={{ position: "relative", ...display, whiteSpace: "nowrap", fontSize: Math.min(w * 0.108, (w - m * 2) / (Math.max(...headline.map((l) => l.length), 1) * 0.5)) }}>{headline.map((l, i) => <div key={i} style={i === headline.length - 1 ? { color: COLORS.accent } : undefined}>{l}</div>)}</div>
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Lockup size={w * 0.06} id="cv" domain />
          <span style={{ fontSize: w * 0.026, color: COLORS.muted }}>{sub}</span>
        </div>
      </AbsoluteFill>
    );
  }

  if (kind === "strip") {
    // LinkedIn company cover: very wide and short. One line, nothing in the bottom-left where the logo sits.
    return (
      <AbsoluteFill className="rv" style={{ ...base, flexDirection: "row", alignItems: "center", paddingLeft: clearLeft, paddingRight: w * 0.035, gap: w * 0.03 }}>
        <Glow w={w} h={h} />
        <div style={{ position: "relative", flex: "none" }}><Lockup size={h * 0.3} id="st" /></div>
        <div style={{ position: "relative", display: "grid", gap: h * 0.04 }}>
          <div style={{ ...display, fontSize: h * 0.19, whiteSpace: "nowrap" }}>{headline.join(" ")}</div>
          <div style={{ fontSize: h * 0.082, color: COLORS.muted, whiteSpace: "nowrap" }}>{sub}</div>
        </div>
      </AbsoluteFill>
    );
  }

  if (kind === "youtube") {
    // Only the centre 1546x423 shows on every device. Everything that matters stays inside it; the rest is background.
    const sw = 1546 * (w / 2560), sh = 423 * (h / 1440);
    return (
      <AbsoluteFill className="rv" style={{ ...base, alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", left: w * 0.2, top: h * 0.1, width: w * 0.6, height: h * 0.8, background: "radial-gradient(closest-side, rgba(31,111,235,.13), transparent)", filter: "blur(60px)" }} />
        <div data-safe style={{ position: "relative", width: sw, height: sh, display: "flex", alignItems: "center", justifyContent: "space-between", gap: sw * 0.03, padding: `0 ${sw * 0.03}px` }}>
          <div style={{ display: "grid", gap: sh * 0.05 }}>
            <Lockup size={sh * 0.17} id="yt" />
            <div style={{ ...display, fontSize: sh * 0.2 }}>{headline.map((l, i) => <div key={i} style={i === headline.length - 1 ? { color: COLORS.accent } : undefined}>{l}</div>)}</div>
            <div style={{ fontSize: sh * 0.062, color: COLORS.muted, whiteSpace: "nowrap" }}>{sub} · <span style={{ color: COLORS.ink, fontWeight: 600 }}>rocco.works</span> · {OFFER.disclaimer}</div>
          </div>
          <Head size={sh * 0.78} id="yth" />
        </div>
      </AbsoluteFill>
    );
  }

  // banner: X header, LinkedIn personal banner.
  const pad = h * 0.11, cardW = card ? Math.min(w * 0.27, h * 0.86) : 0;
  const textW = w - clearLeft - pad - cardW - (card ? pad : 0);
  // Lines never wrap: the size comes down until the longest one fits the space between the photo zone and the card.
  const hl = Math.min(h * 0.15, textW / (Math.max(...headline.map((l) => l.length), 1) * 0.5));
  return (
    <AbsoluteFill className="rv" style={{ ...base }}>
      <Glow w={w} h={h} />
      <div style={{ position: "absolute", left: clearLeft, right: pad + cardW + (card ? pad : 0), top: pad, bottom: pad, display: "flex", flexDirection: "column", justifyContent: "center", gap: h * 0.045 }}>
        {kicker && <div style={{ fontSize: h * 0.042, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: COLORS.accent }}>{kicker}</div>}
        <div style={{ ...display, fontSize: hl, whiteSpace: "nowrap" }}>{headline.map((l, i) => <div key={i} style={i === headline.length - 1 ? { color: COLORS.accent } : undefined}>{l}</div>)}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: h * 0.04, flexWrap: "wrap" }}>
          <span style={{ fontSize: h * 0.046, fontWeight: 600, whiteSpace: "nowrap" }}>{sub}</span>
          <span style={disclaimer(h * 0.036)}>{OFFER.disclaimer}</span>
        </div>
      </div>
      {card && (
        <div style={{ position: "absolute", right: pad, top: h * 0.05, bottom: h * 0.05, width: cardW, display: "flex", flexDirection: "column", alignItems: "center", gap: h * 0.02 }}>
          <SampleChip size={h * 0.034} style={{ flex: "none" }} />
          <div style={{ flex: 1, minHeight: 0, width: "100%", borderRadius: RADII.md }}><Fit width={MORNING_WIDTH}><MorningCard states={["open", "open", "open"]} /></Fit></div>
        </div>
      )}
    </AbsoluteFill>
  );
};

/** Every profile image: where it goes, its exact size, and what it says. scripts/profiles.mjs renders this list. */
export const PROFILE_IMAGES: { file: string; props: ProfileProps }[] = [
  { file: "x/avatar-400x400.png", props: { kind: "avatar", width: 400, height: 400 } },
  { file: "x/header-1500x500.png", props: { kind: "banner", width: 1500, height: 500, clearLeft: 430, card: true, kicker: OFFER.tagline.replace(/\.$/, ""), headline: ["You approve.", "Rocco does the rest."], sub: "Your AI Amazon manager · rocco.works" } },
  { file: "instagram/avatar-320x320.png", props: { kind: "avatar", width: 320, height: 320 } },
  { file: "instagram/highlight-how-it-works-1080x1920.png", props: { kind: "highlight", width: 1080, height: 1920, icon: "☀️" } },
  { file: "instagram/highlight-fixes-1080x1920.png", props: { kind: "highlight", width: 1080, height: 1920, icon: "✂️" } },
  { file: "instagram/highlight-approve-by-text-1080x1920.png", props: { kind: "highlight", width: 1080, height: 1920, icon: "💬" } },
  { file: "instagram/highlight-pricing-1080x1920.png", props: { kind: "highlight", width: 1080, height: 1920, icon: "🏷️" } },
  { file: "instagram/highlight-india-1080x1920.png", props: { kind: "highlight", width: 1080, height: 1920, icon: "🇮🇳" } },
  { file: "instagram/grid-cover-1-what-rocco-is-1080x1350.png", props: { kind: "cover", width: 1080, height: 1350, kicker: "Start here", headline: ["Your AI", "Amazon manager."], sub: OFFER.disclaimer } },
  { file: "instagram/grid-cover-2-one-job-1080x1350.png", props: { kind: "cover", width: 1080, height: 1350, kicker: "One job", headline: ["One tap", "to approve."], sub: OFFER.disclaimer } },
  { file: "instagram/grid-cover-3-pricing-1080x1350.png", props: { kind: "cover", width: 1080, height: 1350, kicker: "Pricing", headline: [OFFER.price.from.replace(" billed yearly", ""), "billed yearly.", `${OFFER.guarantee.days}-day money-back.`], sub: OFFER.disclaimer } },
  { file: "linkedin-company/logo-400x400.png", props: { kind: "avatar", width: 400, height: 400 } },
  { file: "linkedin-company/cover-1128x191.png", props: { kind: "strip", width: 1128, height: 191, clearLeft: 250, headline: ["You approve. Rocco does the rest."], sub: `Your AI Amazon manager · rocco.works · ${OFFER.disclaimer}` } },
  { file: "linkedin-praveen/banner-1584x396.png", props: { kind: "banner", width: 1584, height: 396, clearLeft: 440, card: true, kicker: "Building Rocco in public", headline: ["Your AI Amazon manager.", "You approve, it does the rest."], sub: "rocco.works" } },
  { file: "youtube/banner-2560x1440.png", props: { kind: "youtube", width: 2560, height: 1440, headline: ["Fix one Amazon ads", "problem at a time."], sub: "Your AI Amazon manager" } },
  { file: "youtube/watermark-150x150.png", props: { kind: "avatar", width: 150, height: 150 } },
];
