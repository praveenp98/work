import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { LeakEstimator } from "@/components/home/LeakEstimator";
import { LiveRoastDemo } from "@/components/home/LiveRoastDemo";
import { RoastTicker } from "@/components/home/RoastTicker";
import { Rocco } from "@/components/Rocco";
import { WaitlistForm } from "@/components/WaitlistForm";
import { SITE } from "@/lib/site";
import { liveTools } from "@/lib/tools";

const daysToBF = () => {
  const ms = new Date("2026-11-27T00:00:00-05:00").getTime() - Date.now();
  return Math.ceil(ms / 86400000);
};

export const revalidate = 3600;

export default function Home() {
  const d = daysToBF();
  return (
    <>
      <section className="hero">
        <div>
          <span className="pill"><span className="dot" />{d > 0 ? `Black Friday in ${d} day${d === 1 ? "" : "s"}. Your ads are already bidding.` : "Peak season is live. Your ads are bidding right now."}</span>
          <h1>Your Amazon ads are <span className="hl">leaking money.</span> Rocco finds it.</h1>
          <p className="lede">Drop in one report. A very blunt raccoon digs through every search term, shows you exactly where the money goes, and hands you the fixes as a file you upload in minutes.</p>
          <div className="ctas">
            <Link href="/tools/ad-roast?utm_source=home&utm_medium=hero" className="btn">Roast my ads, free →</Link>
            <Link href="#estimate" className="btn ghost">What could I be losing?</Link>
          </div>
          <div className="trust"><span>2 minutes</span><span>No login</span><span>Your file never leaves your browser</span><span>Pay once, no subscription</span></div>
        </div>
        <div className="hero-art">
          <RoastTicker />
          <Rocco pose="hero" size={340} className="rocco" />
        </div>
      </section>

      <section id="estimate">
        <div className="section-head">
          <span className="eyebrow">Aha #1 · 10 seconds</span>
          <h2>How much is a &ldquo;little&rdquo; ad waste, really?</h2>
          <p>Slide it. Most sellers never do this math, which is exactly why the leak keeps running.</p>
        </div>
        <LeakEstimator />
      </section>

      <section className="split">
        <div className="section-head">
          <span className="eyebrow">Aha #2 · watch it work</span>
          <h2>Rocco judges every search term. Out loud.</h2>
          <p>Cut the junk. Harvest the winners hiding in auto campaigns. Lower bids that buy customers at a loss. Every verdict comes with the reason and the dollar amount.</p>
          <p className="muted">Then you get it all as a fix list and an upload-ready bulk file. You review it, you upload it. Rocco never logs into your account.</p>
          <Link href="/tools/ad-roast?utm_source=home&utm_medium=demo" className="btn">Roast my real account →</Link>
        </div>
        <LiveRoastDemo />
      </section>

      <section>
        <div className="section-head">
          <span className="eyebrow">How it works</span>
          <h2>Three steps. Two minutes. One honest raccoon.</h2>
        </div>
        <div className="howto">
          <div className="card lift"><Rocco pose="wave" size={120} /><div className="num">STEP 1</div><h3>Download one report</h3><p className="muted">Your Sponsored Products search term report. Two clicks in Amazon Ads; we show you where.</p></div>
          <div className="card lift"><Rocco pose="judge" size={120} /><div className="num">STEP 2</div><h3>Get roasted</h3><p className="muted">A–F Leak Score, dollars leaking per month and per year, and the exact search terms eating your budget.</p></div>
          <div className="card lift"><Rocco pose="party" size={120} /><div className="num">STEP 3</div><h3>Upload the fixes</h3><p className="muted">Negatives, harvested winners and bid changes capped at ±20%, in a bulk file. You stay in control.</p></div>
        </div>
      </section>

      <section>
        <div className="section-head">
          <span className="eyebrow">Rocco&apos;s greatest hits</span>
          <h2>He&apos;s on your side. He&apos;s just not nice about it.</h2>
        </div>
        <div className="quotes">
          <div className="quote">&ldquo;You bid on &lsquo;how to clean a cutting board&rsquo;. They wanted a sponge.&rdquo;<span className="fine">on junk-intent search terms</span></div>
          <div className="quote">&ldquo;Your auto campaign found a winner three weeks ago. You never noticed. I did.&rdquo;<span className="fine">on missed keyword harvesting</span></div>
          <div className="quote">&ldquo;52% ACoS isn&apos;t growth. It&apos;s a very expensive hobby.&rdquo;<span className="fine">on over-target search terms</span></div>
          <div className="quote">&ldquo;Black Friday doubles your clicks. It also doubles your mistakes. Let&apos;s fix them first.&rdquo;<span className="fine">on peak season</span></div>
        </div>
      </section>

      <section>
        <div className="section-head">
          <span className="eyebrow">Free tools</span>
          <h2>Start with whatever hurts most</h2>
        </div>
        <div className="grid">
          {liveTools().map((t) => (
            <Link className="card" href={`/tools/${t.slug}`} key={t.slug}>
              <span className="tag live">Free</span>
              <h3>{t.name}</h3>
              <p className="muted">{t.short}</p>
              <span className="more">Open →</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="section-head">
          <span className="eyebrow">Two ways to use Rocco</span>
          <h2>No setup, or right inside your AI</h2>
        </div>
        <div className="grid">
          <div className="card"><span className="tag live">Live</span><h3>On this site</h3><p className="muted">Drop a report, get the roast. No API keys, no account access, nothing to install.</p><Link className="more" href="/tools/ad-roast">Roast my ads →</Link></div>
          <div className="card"><span className="tag live">Live</span><h3>Inside Claude and ChatGPT</h3><p className="muted">Add Rocco as a connector. Your AI gets Rocco&apos;s roast, calculators and operator playbook, and works beside Amazon&apos;s own Ads connector if you have one.</p><Link className="more" href="/connect">Connect Rocco →</Link></div>
          <div className="card"><span className="tag">Pay once</span><h3>Founding lifetime deal</h3><p className="muted">No monthly bill, ever. Founding prices step up on Nov 27, Dec 1 and Dec 16.</p><Link className="more" href="/pricing">See prices →</Link></div>
        </div>
      </section>

      <section className="band">
        <Rocco pose="party" size={170} />
        <div>
          <h2>Find your leak before Black Friday does.</h2>
          <p>Free roast. Two minutes. The worst that happens is Rocco says something rude about your keywords.</p>
          <Link href="/tools/ad-roast?utm_source=home&utm_medium=band" className="btn">Roast my ads →</Link>
        </div>
      </section>

      <section>
        <h2>Rocco&apos;s Monday brief</h2>
        <p className="muted">One email a week: the biggest Amazon ads leak Rocco saw, and how to fix it in 5 minutes. Unsubscribe anytime.</p>
        <WaitlistForm source="home" />
      </section>

      <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: SITE.name, url: SITE.url, logo: `${SITE.url}/icon.svg`, sameAs: [SITE.x] }} />
    </>
  );
}
