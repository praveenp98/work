import Link from "next/link";
import { ChatDemo } from "@/components/connect/ChatDemo";
import { ConnectBox } from "@/components/connect/ConnectBox";
import { Playground } from "@/components/connect/Playground";
import { JsonLd } from "@/components/JsonLd";
import { Rocco } from "@/components/Rocco";
import { SITE } from "@/lib/site";

export const revalidate = 3600;

const JOBS = [
  { icon: "☀️", title: "Morning check", say: "“Rocco, morning check.”", text: "Pulls yesterday's numbers, judges last week's changes, and hands you today's approval list." },
  { icon: "🧹", title: "Search term cleanup", say: "“Clean up my search terms.”", text: "Junk searches to negate, hidden winners to harvest, bids to move (±20% max)." },
  { icon: "💸", title: "Budget moves", say: "“Who's running out of budget?”", text: "Funds profitable campaigns that run dry by noon, cuts the ones above breakeven." },
  { icon: "🎯", title: "Placements", say: "“Fix my placements.”", text: "Top of search, rest of search, product pages: raise what works, zero what doesn't." },
  { icon: "📦", title: "Stockout guard", say: "“Am I running out of anything?”", text: "Eases off ads before a SKU runs dry. Flags dead and overstocked stock." },
  { icon: "🛒", title: "Listings & buy box", say: "“Why isn't this ASIN converting?”", text: "Traffic without sales, lost buy box, TACoS, and converting keywords missing from your listing." },
  { icon: "📒", title: "Change log + results", say: "“Did last week's changes work?”", text: "Every approved change is logged with before-numbers, re-checked, and undoable." },
  { icon: "📄", title: "Client reports", say: "“Make the Acme report.”", text: "White-label PDF for agencies: what changed, what it saved, what's next." },
];

export default function Home() {
  return (
    <>
      <section className="hero hero-mcp">
        <div>
          <span className="pill"><span className="dot" />New · works inside Claude and ChatGPT</span>
          <h1>Meet Rocco, your new <span className="hl">AI Amazon teammate.</span></h1>
          <p className="lede">Connect Amazon&apos;s official Ads connector and Rocco in Claude or ChatGPT, then just ask. Rocco pulls the data, decides what to change, applies what you approve, remembers it, and checks if it worked.</p>
          <ConnectBox />
          <p className="fine" style={{ marginTop: 10 }}>No Amazon Ads API access yet? Rocco also reads exported reports. <Link href="/tools/account-check">Or try the web account check →</Link></p>
        </div>
        <div className="hero-chat">
          <ChatDemo />
          <p className="fine" style={{ textAlign: "center", marginTop: 8 }}>Example conversation with sample numbers.</p>
        </div>
      </section>

      <section>
        <div className="section-head">
          <span className="eyebrow">What Rocco does</span>
          <h2>Most of the Amazon work. No spreadsheets.</h2>
          <p>Just ask. Rocco tells your AI what to pull from Amazon&apos;s connector, does the analysis, and queues the changes for your OK.</p>
        </div>
        <div className="jobs">
          {JOBS.map((j) => (
            <div className="job" key={j.title}>
              <span className="job-icon" aria-hidden>{j.icon}</span>
              <h3>{j.title}</h3>
              <p className="job-say">{j.say}</p>
              <p className="muted">{j.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="section-head">
          <span className="eyebrow">Try it now · no install</span>
          <h2>See exactly what Rocco hands your AI.</h2>
          <p>These buttons run Rocco&apos;s real connector on a sample account&apos;s data, the same way it runs on yours.</p>
        </div>
        <Playground />
      </section>

      <section className="split">
        <div className="section-head">
          <span className="eyebrow">Rocco remembers</span>
          <h2>A teammate, not a one-off audit.</h2>
          <p>With your personal connector, every change you approve goes into Rocco&apos;s log with the numbers from before. Next time he pulls the data, he checks whether it worked, flags anything that got worse, and tells you how to undo it.</p>
        </div>
        <ol className="loop">
          <li><b>Pull</b><span>fresh data through Amazon&apos;s connector</span></li>
          <li><b>Approve</b><span>by code: “N1–N4, G2”</span></li>
          <li><b>Apply</b><span>your AI makes the approved changes via Amazon&apos;s connector</span></li>
          <li><b>Check</b><span>results vs. before, a week later</span></li>
          <li><b>Brief</b><span>every morning: what&apos;s next</span></li>
        </ol>
      </section>

      <section>
        <div className="section-head">
          <span className="eyebrow">You stay in charge</span>
          <h2>Rocco never touches your account on his own.</h2>
        </div>
        <div className="grid">
          <div className="card"><h3>Approval by code</h3><p className="muted">Nothing is applied until you approve specific changes.</p></div>
          <div className="card"><h3>Safe steps</h3><p className="muted">Bids move ±20% max per step. Brand terms you protect are never negated.</p></div>
          <div className="card"><h3>Undo for everything</h3><p className="muted">Each logged change comes with the exact steps to reverse it.</p></div>
          <div className="card"><h3>Official connectors only</h3><p className="muted">Data and changes go through Amazon&apos;s own connector in your AI. Rocco never sees your passwords.</p></div>
        </div>
      </section>

      <section className="band">
        <Rocco pose="party" size={170} />
        <div>
          <h2>Free to add. Pay once when he earns it.</h2>
          <p>The brief, findings and top fixes are free. Every fix, full tracking and bulk files are a one-time founding price. No subscription.</p>
          <div className="row">
            <Link href="/pricing" className="btn">See founding prices →</Link>
            <Link href="/connect" className="btn ghost" style={{ background: "transparent", color: "#fff", borderColor: "rgba(255,255,255,.5)" }}>Connector guide</Link>
          </div>
        </div>
      </section>

      <section>
        <div className="section-head">
          <span className="eyebrow">Prefer the web?</span>
          <h2>Free tools, no AI needed</h2>
        </div>
        <div className="grid">
          <Link className="card" href="/tools/ad-roast"><h3>Ad Roast</h3><p className="muted">Grade your search terms A–F in your browser.</p><span className="more">Open →</span></Link>
          <Link className="card" href="/tools/bfcm-surge-plan"><h3>BFCM Surge Plan</h3><p className="muted">Black Friday budgets and bids, day by day.</p><span className="more">Open →</span></Link>
          <Link className="card" href="/tools/coupon-calculator"><h3>Coupon Profit Calculator</h3><p className="muted">What a coupon really leaves you after fees.</p><span className="more">Open →</span></Link>
          <Link className="card" href="/tools/breakeven-acos"><h3>Breakeven ACoS</h3><p className="muted">The ACoS where ads stop making money.</p><span className="more">Open →</span></Link>
        </div>
      </section>

      <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: SITE.name, url: SITE.url, logo: `${SITE.url}/icon.svg`, sameAs: [SITE.x] }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Rocco", applicationCategory: "BusinessApplication", operatingSystem: "Claude, ChatGPT, Web", url: SITE.url, description: SITE.description, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } }} />
    </>
  );
}
