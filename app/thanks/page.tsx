import type { Metadata } from "next";
import Link from "next/link";
import { Rocco } from "@/components/Rocco";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Thanks for hiring Rocco", robots: { index: false } };

export default function Page() {
  return (
    <section style={{ textAlign: "center", maxWidth: 640, margin: "0 auto" }}>
      <Rocco pose="party" size={220} />
      <h1>You hired a raccoon. Excellent decision.</h1>
      <p className="muted" style={{ fontSize: 18 }}>Your license key is in your Dodo Payments receipt email. It can take a minute to arrive.</p>
      <ol className="steps" style={{ textAlign: "left", margin: "24px auto", maxWidth: 480 }}>
        <li>Open the <Link href="/tools/ad-roast">Ad Roast</Link> and drop in your search term report.</li>
        <li>Paste your license key in the unlock box. Every fix and the bulk file unlock on this browser.</li>
        <li>Using Claude or ChatGPT? <Link href="/connect">Add the Rocco connector</Link> and tell Rocco: <b>&ldquo;activate my license&rdquo;</b>.</li>
      </ol>
      <p><Link className="btn" href="/tools/ad-roast?utm_source=thanks">Roast my ads now →</Link></p>
      <p className="fine" style={{ marginTop: 18 }}>No email? Check spam, or write to <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a> with your order email.</p>
    </section>
  );
}
