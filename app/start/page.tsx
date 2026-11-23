import type { Metadata } from "next";
import Link from "next/link";
import { Rocco } from "@/components/Rocco";
import { SITE } from "@/lib/site";
import { isLive, LINKS, OFFER } from "@/marketing/config/offer";
import { StartLinks } from "./StartLinks";

export const metadata: Metadata = { title: "Start here", description: OFFER.oneLiner, robots: { index: false, follow: false }, alternates: { canonical: "/start" } };

/**
 * The link-in-bio page: where rocco.works/x, /ig, /yt and /linkedin land. Four big buttons, no third-party
 * link service. The two buttons whose links don't exist yet (setup call, latest video) stay hidden until their
 * URL is filled in marketing/config/offer.ts.
 */
export default function Page() {
  const links = [
    { id: "what-rocco-does", href: "/#how", title: "See what Rocco does", sub: "The morning list, approve, done. 2 minutes.", event: "link_click" as const },
    ...(isLive(LINKS.setupCall) ? [{ id: "setup-call", href: LINKS.setupCall, title: "Book a 15-min setup call", sub: "Bring your Seller Central login.", event: "call_click" as const }] : []),
    { id: "free-tools", href: "/tools", title: "Free Amazon tools", sub: "Ad audit, coupon and breakeven calculators. No login.", event: "link_click" as const },
    ...(isLive(LINKS.latestVideo) ? [{ id: "latest-video", href: LINKS.latestVideo, title: "Latest video", sub: "One Amazon ads problem and its fix.", event: "link_click" as const }] : []),
  ];
  return (
    <section style={{ maxWidth: 520, margin: "0 auto", padding: "8px 0 40px", display: "grid", gap: 18, justifyItems: "center", textAlign: "center" }}>
      <Rocco pose="wave" size={150} />
      <div>
        <span className="h5-kicker">{OFFER.tagline.replace(/\.$/, "")}</span>
        <h1 style={{ fontSize: "clamp(32px, 8vw, 44px)", margin: "0 0 8px" }}>Your AI Amazon manager.</h1>
        <p className="muted" style={{ fontSize: 18, margin: 0 }}>You approve, Rocco does the rest.</p>
      </div>
      <StartLinks links={links} />
      <p className="fine" style={{ margin: 0 }}>{OFFER.price.from} · {OFFER.guarantee.short} · <Link href="/pricing">Pricing</Link></p>
      <p className="fine" style={{ margin: 0 }}>{SITE.disclaimer}</p>
    </section>
  );
}
