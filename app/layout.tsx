import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import Link from "next/link";
import { Raccoon } from "@/components/Raccoon";
import { Tracker } from "@/components/Tracker";
import { SITE } from "@/lib/site";
import "./globals.css";
import "./connect.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", weight: ["600", "700", "800"], display: "swap" });
const body = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name}: ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  openGraph: { siteName: SITE.name, type: "website", images: [{ url: "/og.png", width: 1200, height: 630, alt: "Rocco: your AI Amazon teammate" }] },
  twitter: { card: "summary_large_image", site: "@roccoworks", images: ["/og.png"] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <head>
        <Tracker />
      </head>
      <body>
        <header className="top">
          <div className="top-in">
            <Link href="/" className="brand">
              <Raccoon size={34} /> <span>rocco<b>.works</b></span>
            </Link>
            <nav>
              <Link href="/connect">How it works</Link>
              <Link href="/tools">Free tools</Link>
              <Link href="/guides">Guides</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/setup" className="btn small"><span className="lg-only">Set up in 3 min</span><span className="sm-only">Set up</span></Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="foot">
          <div className="foot-in">
            <div>
              <Raccoon size={26} /> Rocco: your AI Amazon teammate.
            </div>
            <nav>
              <Link href="/tools">Tools</Link>
              <Link href="/guides">Guides</Link>
              <Link href="/setup">Setup: Amazon + Rocco</Link>
              <Link href="/connect">Connect to Claude / ChatGPT</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/rocco">Meet Rocco</Link>
              <Link href="/press">Press kit</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/refunds">Refunds</Link>
              <a href={`mailto:${SITE.contactEmail}`}>Contact</a>
            </nav>
            <p className="fine">{SITE.disclaimer}</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
