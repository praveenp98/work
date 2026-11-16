import type { Metadata } from "next";
import Link from "next/link";
import { Raccoon } from "@/components/Raccoon";
import { Tracker } from "@/components/Tracker";
import { SITE } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name}: ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  openGraph: { siteName: SITE.name, type: "website" },
  twitter: { card: "summary_large_image", site: "@roccoworks" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="top">
          <Link href="/" className="brand">
            <Raccoon size={30} /> <span>rocco<b>.works</b></span>
          </Link>
          <nav>
            <Link href="/tools">Free tools</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/tools/ad-roast" className="btn small">Roast my ads</Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="foot">
          <div>
            <Raccoon size={22} /> Rocco works the night shift on your Amazon ads.
          </div>
          <nav>
            <Link href="/tools">Tools</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/refunds">Refunds</Link>
            <a href={`mailto:${SITE.contactEmail}`}>Contact</a>
          </nav>
          <p className="fine">{SITE.disclaimer}</p>
        </footer>
        <Tracker />
      </body>
    </html>
  );
}
