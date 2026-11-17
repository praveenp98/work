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
        <header className="top top-min">
          <div className="top-in">
            <Link href="/" className="brand">
              <Raccoon size={32} /> <span>rocco</span>
            </Link>
            <nav>
              <Link href="/connect" className="lg-only">How it works</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/" className="btn small dark">Text Rocco</Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="foot foot-min">
          <nav>
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
