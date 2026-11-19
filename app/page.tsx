import { googleOn } from "@/lib/google";
import { TextRoccoButton } from "@/components/home/TextRoccoButton";
import { HireButton } from "@/components/home/HireButton";
import { ApprovalFeed } from "@/components/home/ApprovalFeed";
import { JsonLd } from "@/components/JsonLd";
import { AppIcon, RoccoStage } from "@/components/home/RoccoStage";
import { getPriceState } from "@/lib/payments";
import { dollars } from "@/lib/pricing";
import { SITE } from "@/lib/site";

export const revalidate = 60;

/** Boardy-style: Rocco introduces himself, one action, nothing else. */
export default async function Home() {
  const price = await getPriceState();
  const apps: { label: string; href: string; app: "imessage" | "claude" | "openai" | "slack" | "claudecode" | "cursor" }[] = [
    { label: "iMessage", href: "/text", app: "imessage" },
    { label: "Claude", href: "/setup", app: "claude" },
    { label: "Slack", href: "/setup", app: "slack" },
    { label: "Claude Code", href: "/setup", app: "claudecode" },
  ];
  const jobs = [
    { t: "Ads", d: "Negatives, harvests, bids, budgets and placements, every day. Capped, logged, reversible." },
    { t: "Seller Central", d: "Sales, conversion, TACoS, Buy Box and suppressed listings, before they cost you." },
    { t: "Inventory", d: "Stockout warnings, restock quantities, and ads eased off SKUs about to run dry." },
    { t: "Listings", d: "Keywords your best search terms prove you're missing from titles and bullets." },
    { t: "Results", d: "Every change checked a week later: what worked, what to undo, what you saved." },
    { t: "Your team", d: "Everyone texts the same Rocco. Morning numbers, approvals with a YES, client reports." },
  ];
  return (
    <section className="home">
      <div className="home-hero">
        <h1>I can run your Amazon<br />business, try me.</h1>
        <RoccoStage google={googleOn()} price={dollars(price.priceCents)} next={price.nextPriceCents ? dollars(price.nextPriceCents) : undefined} />
      </div>

      <div className="home-feed">
        <h2>Watch me work.</h2>
        <p className="home-lede">Stock, ads, listings, budgets, reports. Your team approves with a reply; I do the rest.</p>
        <ApprovalFeed />
        <HireButton google={googleOn()} price={dollars(price.priceCents)} next={price.nextPriceCents ? dollars(price.nextPriceCents) : undefined} label={`Hire Rocco · ${dollars(price.priceCents)}/year`} />
      </div>

      <div className="home-flow">
        <h2>How it fits together.</h2>
        <ol className="flow">
          <li><span className="flow-k">Your data</span><b>Amazon&apos;s own connectors</b><small>Seller Central and Amazon Ads, signed in with your Amazon login. No scraping, no passwords shared.</small></li>
          <li><span className="flow-k">The manager</span><b>Rocco</b><small>Decides what to change, remembers every change, checks a week later if it worked.</small></li>
          <li><span className="flow-k">Where you talk</span><b>iMessage, Slack, Claude</b><small>Same Rocco, same memory, whole team. You reply YES, nothing changes without it.</small></li>
        </ol>
      </div>

      <div className="home-sec">
        <h2>Everything your Amazon needs, one teammate.</h2>
        <p className="home-lede">Ads, Seller Central, stock, listings and reports. I do the work a senior Amazon manager does, from iMessage, Slack or Claude.</p>
        <ul className="home-jobs">{jobs.map((j) => <li key={j.t}><b>{j.t}</b><span>{j.d}</span></li>)}</ul>
      </div>

      <div className="home-how">
        <h2>How I work.</h2>
        <ol>
          <li><b>You ask</b><span>Text me the way you&apos;d text your best Amazon manager. Or just wait for my morning numbers.</span></li>
          <li><b>I dig in</b><span>I pull your numbers through Amazon&apos;s own connectors and find the wasted spend, stockouts and missed keywords.</span></li>
          <li><b>You say yes</b><span>Reply YES and the change is made, logged, and checked a week later. Undo anytime.</span></li>
        </ol>
      </div>

      <div className="home-msg" id="text">
        <h2>Hire me.</h2>
        <p className="home-lede">One plan for your whole team. Or text me first and I&apos;ll show you a sample brand&apos;s morning.</p>
        <HireButton google={googleOn()} price={dollars(price.priceCents)} next={price.nextPriceCents ? dollars(price.nextPriceCents) : undefined} label={`Hire Rocco · ${dollars(price.priceCents)}/year`} />
        <TextRoccoButton label="💬 Or text me first" />
        <p className="home-apps-label">Or find me in your favorite app.</p>
        <div className="home-apps">
          {apps.map((a) => <a key={a.label} href={a.href} rel={a.href === "/text" ? "nofollow" : undefined}><span className="app-tile"><AppIcon app={a.app} size={30} /></span>{a.label}</a>)}
        </div>
      </div>

      <div className="home-tools">
        <h2>I work the tools you already pay for.</h2>
        <p className="home-lede">I sit next to Amazon&apos;s official Seller Central and Ads connectors, and use Helium 10, SellerSprite or any other connector in the same chat.</p>
        <ul>{["Seller Central", "Amazon Ads", "Helium 10", "SellerSprite", "Any MCP connector"].map((t) => <li key={t}>{t}</li>)}</ul>
        <p className="fine">{dollars(price.priceCents)}/year for your whole team · the price goes up $10 with every hire · Not affiliated with Amazon or Helium 10</p>
      </div>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: SITE.name, url: SITE.url, logo: `${SITE.url}/icon.svg`, sameAs: [SITE.x] }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Rocco", applicationCategory: "BusinessApplication", operatingSystem: "iMessage, Slack, Claude, Web", url: SITE.url, description: SITE.description, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } }} />
    </section>
  );
}
