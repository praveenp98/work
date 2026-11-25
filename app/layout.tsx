import { Notice } from "@/components/Notice";
import type { Metadata } from "next";
import { Inter, Raleway } from "next/font/google";
import Link from "next/link";
import { AccountLink } from "@/components/AccountLink";
import { googleOn } from "@/lib/google";
import { Raccoon } from "@/components/Raccoon";
import { Tracker } from "@/components/Tracker";
import { SITE } from "@/lib/site";
import { TopNav } from "@/components/TopNav";
import { HumanContact } from "@/components/HumanContact";
import { Analytics } from "@/components/Analytics";
import { FunnelEvents } from "@/components/FunnelEvents";
import "./globals.css";
import "./magnets.css";
import "./wrapped.css";
import "./connect.css";

const display = Raleway({ subsets: ["latin"], variable: "--font-display", weight: ["400", "500", "600"], display: "swap" });
const body = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  // Search engine ownership checks (Bing Webmaster; Google Search Console token goes in google when you have it).
  verification: { google: "hI1rV0UuJIBGhkQtDmgvpFXAyaIkruIVtMler9gJ01s", other: { "msvalidate.01": "59B39C17F429E8B4901324D49607D7FC" } },
  title: { default: `${SITE.name}: ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  // Share images are made in code: app/opengraph-image.tsx + app/twitter-image.tsx (lib/og.tsx), with their own alt text.
  openGraph: { siteName: SITE.name, type: "website" },
  twitter: { card: "summary_large_image", site: "@roccoworks" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <head>
        <Tracker />
      </head>
      <body>
        <header className="top top-b">
          <div className="top-in">
            <TopNav />
            <Link href="/" className="brand">
              <Raccoon size={34} /> <span>Rocco</span>
            </Link>
            <div className="top-right">
              <AccountLink google={googleOn()} />
            </div>
          </div>
        </header>
        <Notice />
        <main>{children}</main>
        <HumanContact />
        <Analytics apiKey={process.env.POSTHOG_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY} uiHost={process.env.POSTHOG_UI_HOST} />
        <FunnelEvents />
        <footer className="foot foot-min">
          <p className="foot-human">💬 Questions? Talk to a human: <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a> · usually answered the same day.</p>
          <Link href="/" className="brand foot-brand"><Raccoon size={40} /> <span>Rocco</span></Link>
          <p className="foot-tag">Your AI Amazon manager: you approve, I do the rest. <b>Real work without the fluff.</b></p>
          <nav>
            <Link href="/answers">Answers</Link>
            <Link href="/#how">How it works</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/free">Free tools</Link>
            <Link href="/compare">Compare</Link>
            <Link href="/connector">Rocco in Claude &amp; ChatGPT</Link>
            <Link href="/guides">Guides</Link>
            <Link href="/press">Press</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/help">Help</Link>
            <a href={`mailto:${SITE.contactEmail}`}>Contact</a>
          </nav>
          <p className="fine">© 2026 Rocco Works · {SITE.disclaimer}</p>
        </footer>
      </body>
    </html>
  );
}
