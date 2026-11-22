import type { Metadata } from "next";
import { Inter, Raleway } from "next/font/google";
import Link from "next/link";
import { AccountLink } from "@/components/AccountLink";
import { googleOn } from "@/lib/google";
import { Raccoon } from "@/components/Raccoon";
import { Tracker } from "@/components/Tracker";
import { SITE } from "@/lib/site";
import "./globals.css";
import "./connect.css";

const display = Raleway({ subsets: ["latin"], variable: "--font-display", weight: ["400", "500", "600"], display: "swap" });
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
        <header className="top top-b">
          <div className="top-in">
            <nav className="top-left" aria-label="Main">
              <Link href="/pricing">Pricing</Link>
              <Link href="/answers">Answers</Link>
            </nav>
            <Link href="/" className="brand">
              <Raccoon size={34} /> <span>Rocco</span>
            </Link>
            <div className="top-right">
              <AccountLink google={googleOn()} />
            </div>
          </div>
        </header>
        <main>{children}</main>
        <footer className="foot foot-min">
          <Link href="/" className="brand foot-brand"><Raccoon size={40} /> <span>Rocco</span></Link>
          <p className="foot-tag">Your AI Amazon manager. You approve, I do the rest.</p>
          <nav>
            <Link href="/answers">Answers</Link>
            <Link href="/connect">How it works</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/tools">Free tools</Link>
            <Link href="/guides">Guides</Link>
            <Link href="/press">Press</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <a href={`mailto:${SITE.contactEmail}`}>Contact</a>
          </nav>
          <p className="fine">© 2026 Rocco Works · {SITE.disclaimer}</p>
        </footer>
      </body>
    </html>
  );
}
