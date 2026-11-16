import Link from "next/link";
import { Raccoon } from "@/components/Raccoon";
import { JsonLd } from "@/components/JsonLd";
import { WaitlistForm } from "@/components/WaitlistForm";
import { SITE } from "@/lib/site";
import { liveTools } from "@/lib/tools";

export default function Home() {
  return (
    <>
      <section className="hero">
        <div>
          <span className="tag">Black Friday is Nov 27. Your ads are already bidding.</span>
          <h1>Rocco works your Amazon ads.<br />You approve.</h1>
          <p className="lede">Upload one report. Rocco, a very blunt raccoon, digs through every search term, finds the money your ads are wasting, and hands you the exact fixes as a file you can upload in minutes.</p>
          <div className="ctas">
            <Link href="/tools/ad-roast?utm_source=home&utm_medium=hero" className="btn">Roast my ads, free</Link>
            <Link href="/pricing" className="btn ghost">See founding prices</Link>
          </div>
          <p className="fine">2 minutes · no login · your file never leaves your browser</p>
        </div>
        <div className="bubble">
          <div className="who"><Raccoon size={44} mood="judging" /> Rocco</div>
          <q>You paid $412 for people searching &ldquo;free&rdquo;. I ate it. You&apos;re welcome.</q>
          <p className="fine" style={{ marginTop: 10 }}>Sample roast: grade D · $481/month leaking · 6 negatives · 3 winners to harvest · 9 bid fixes</p>
        </div>
      </section>

      <h2>How it works</h2>
      <ol className="steps">
        <li><b>Download your search term report</b> from Amazon Ads (2 clicks; we show you where).</li>
        <li><b>Drop it in.</b> Rocco scores your account A–F and shows the top 3 leaks with dollar amounts.</li>
        <li><b>Get the fixes:</b> negatives, winning terms to harvest, and bid changes capped at ±20%, plus an upload-ready bulk file. You review and upload it; Rocco never touches your account.</li>
      </ol>

      <h2>Free tools</h2>
      <div className="grid">
        {liveTools().map((t) => (
          <div className="card" key={t.slug}>
            <h3>{t.name}</h3>
            <p className="muted">{t.short}</p>
            <Link className="more" href={`/tools/${t.slug}`}>Open →</Link>
          </div>
        ))}
      </div>

      <h2>Works with your AI, or with no setup at all</h2>
      <div className="grid">
        <div className="card"><span className="tag">Available now</span><h3>No setup</h3><p className="muted">Upload a report on this site. First result in under 2 minutes. No API keys, no account access.</p></div>
        <div className="card"><span className="tag">Coming soon</span><h3>Inside Claude and ChatGPT</h3><p className="muted">Add Rocco as a connector so your AI knows how to judge Amazon ads: what to check, what to cut, safe limits, and an approval list.</p></div>
        <div className="card"><span className="tag">Pay once</span><h3>Founding lifetime deal</h3><p className="muted">No monthly bill. Prices step up on Nov 27, Dec 1 and Dec 16.</p></div>
      </div>

      <h2>Rocco&apos;s Monday brief</h2>
      <p className="muted">One email a week: the biggest Amazon ads leak Rocco saw, and how to fix it in 5 minutes. No spam. Unsubscribe anytime.</p>
      <WaitlistForm source="home" />

      <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: SITE.name, url: SITE.url, logo: `${SITE.url}/icon.svg`, sameAs: [SITE.x] }} />
    </>
  );
}
