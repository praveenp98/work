import Link from "next/link";
import { ChatDemo } from "@/components/connect/ChatDemo";
import { ConnectBox } from "@/components/connect/ConnectBox";
import { Playground } from "@/components/connect/Playground";
import { JsonLd } from "@/components/JsonLd";
import { Rocco } from "@/components/Rocco";
import { SITE } from "@/lib/site";

export const revalidate = 3600;

const JOBS = [
  { icon: "☀️", title: "Morning brief", text: "What changed, what's due, what to do today. Ask “Rocco, brief me.”", reads: "Memory" },
  { icon: "🧹", title: "Search term cleanup", text: "Negatives, winners to harvest, bid changes capped at ±20%.", reads: "Search term report" },
  { icon: "💸", title: "Budget moves", text: "Finds profitable campaigns that run out of money, and the ones burning it.", reads: "Campaign report" },
  { icon: "📦", title: "Stockout guard", text: "Eases off ads before a SKU runs dry. Flags dead and overstocked SKUs.", reads: "Restock report" },
  { icon: "🛒", title: "Listing & buy box check", text: "ASINs with traffic but no conversions, lost buy box, TACoS.", reads: "Business Report" },
  { icon: "🏗️", title: "Structure audit", text: "Auto campaigns with no negatives, keywords bidding against each other, crazy bids.", reads: "Bulk file" },
  { icon: "📒", title: "Change log + results", text: "Every approved change is logged, re-checked a week later, and undoable.", reads: "Memory" },
  { icon: "🦃", title: "Black Friday plan", text: "Day-by-day budgets and bids for Nov 19 – Dec 2, with guardrails.", reads: "Your numbers" },
];

export default function Home() {
  return (
    <>
      <section className="hero hero-mcp">
        <div>
          <span className="pill"><span className="dot" />New · works inside Claude and ChatGPT</span>
          <h1>Meet Rocco, your new <span className="hl">AI Amazon teammate.</span></h1>
          <p className="lede">He reads your Seller Central and Ads reports, decides what to change, drafts every change, remembers what you did and checks if it worked. You approve. Rocco does the rest.</p>
          <ConnectBox />
          <p className="fine" style={{ marginTop: 10 }}>No AI assistant? <Link href="/tools/ad-roast">Use Rocco on the web →</Link></p>
        </div>
        <div className="hero-chat">
          <ChatDemo />
          <p className="fine" style={{ textAlign: "center", marginTop: 8 }}>Example conversation with sample numbers.</p>
        </div>
      </section>

      <section>
        <div className="section-head">
          <span className="eyebrow">What Rocco does</span>
          <h2>Most of the Amazon work, minus the spreadsheets.</h2>
          <p>Drop any of these reports into your chat. Rocco works out which one it is and gets to work.</p>
        </div>
        <div className="jobs">
          {JOBS.map((j) => (
            <div className="job" key={j.title}>
              <span className="job-icon" aria-hidden>{j.icon}</span>
              <h3>{j.title}</h3>
              <p className="muted">{j.text}</p>
              <span className="tag">{j.reads}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="section-head">
          <span className="eyebrow">Try it now · no install</span>
          <h2>See exactly what your AI gets back.</h2>
          <p>These buttons call Rocco&apos;s real connector with sample reports. Or drop in one of yours.</p>
        </div>
        <Playground />
      </section>

      <section className="split">
        <div className="section-head">
          <span className="eyebrow">Rocco remembers</span>
          <h2>A teammate, not a one-off audit.</h2>
          <p>With your personal connector, every change you approve goes into Rocco&apos;s log with the numbers from before. When the next report comes in, he checks whether it worked, flags anything that got worse, and tells you how to undo it.</p>
        </div>
        <ol className="loop">
          <li><b>Analyze</b><span>any report you drop in</span></li>
          <li><b>Approve</b><span>by code: “N1–N4, G2”</span></li>
          <li><b>Apply</b><span>in Ads, by bulk file, or via Amazon&apos;s own connector</span></li>
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
          <div className="card"><h3>Reports, not passwords</h3><p className="muted">Rocco works from reports you share. No Seller Central login, no API keys needed.</p></div>
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
