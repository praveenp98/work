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
import "./globals.css";
import "./connect.css";

const display = Raleway({ subsets: ["latin"], variable: "--font-display", weight: ["400", "500", "600"], display: "swap" });
const body = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name}: ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  openGraph: { siteName: SITE.name, type: "website", images: [{ url: "/og-v2.png", width: 1200, height: 630, alt: "Rocco: I can run your Amazon business. Connect once, approve on iMessage, WhatsApp or Slack, Rocco makes the change." }] },
  twitter: { card: "summary_large_image", site: "@roccoworks", images: ["/og-v2.png"] },
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
        <footer className="foot foot-min">
          <p className="foot-human">💬 Questions? Talk to a human: <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a> · usually answered the same day.</p>
          <Link href="/" className="brand foot-brand"><Raccoon size={40} /> <span>Rocco</span></Link>
          <p className="foot-tag">Your AI Amazon manager: you approve, I do the rest. <b>Real work without the fluff.</b></p>
          <nav>
            <Link href="/answers">Answers</Link>
            <Link href="/#how">How it works</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/tools">Free tools</Link>
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
