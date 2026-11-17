import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import Link from "next/link";
import { Raccoon } from "@/components/Raccoon";
import { Tracker } from "@/components/Tracker";
import { SITE } from "@/lib/site";
import "./globals.css";
import "./connect.css";

const display = Inter_Tight({ subsets: ["latin"], variable: "--font-display", weight: ["400", "500", "600", "700"], display: "swap" });
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
              <Link href="/setup">Setup</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/answers">Answers</Link>
            </nav>
            <Link href="/" className="brand">
              <Raccoon size={34} /> <span>Rocco</span>
            </Link>
            <div className="top-right">
              <Link href="/#text" className="chat-fab" aria-label="Text Rocco">
                <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" d="M12 3.5c-4.8 0-8.5 3.2-8.5 7.2 0 2.2 1.1 4.1 2.9 5.4l-.6 3.4 3.4-1.8c.9.2 1.8.3 2.8.3 4.8 0 8.5-3.2 8.5-7.3S16.8 3.5 12 3.5z" /></svg>
              </Link>
            </div>
          </div>
        </header>
        <main>{children}</main>
        <footer className="foot foot-min">
          <Link href="/" className="brand foot-brand"><Raccoon size={40} /> <span>Rocco</span></Link>
          <p className="foot-tag">The AI Amazon manager in your iMessages.</p>
          <nav>
            <Link href="/answers">Answers</Link>
            <Link href="/setup">Setup</Link>
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
