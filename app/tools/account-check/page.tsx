import type { Metadata } from "next";
import Link from "next/link";
import { AccountCheck } from "@/components/AccountCheck";
import { Faq } from "@/components/Faq";
import { ToolJsonLd } from "@/components/ToolJsonLd";
import { toolBySlug } from "@/lib/tools";

const tool = toolBySlug("account-check")!;
export const metadata: Metadata = { title: "Free Amazon Account Check: Ads, Budgets, Stock, Listings", description: tool.description, alternates: { canonical: "/tools/account-check" } };

export default function Page() {
  return (
    <>
      <span className="tag live">Free · no login · files stay in your browser</span>
      <h1>Your whole Amazon account, checked in 2 minutes.</h1>
      <p className="muted" style={{ fontSize: 18, maxWidth: 720 }}>Drop in the reports you already download. Rocco scores the account, finds the money at stake across ads, budgets, placements, listings, stock and structure, and tells you what to do first.</p>
      <AccountCheck />
      <section className="prose">
        <h2>What each report tells Rocco</h2>
        <ul>
          <li><b>Search term report:</b> junk searches to negate, hidden winners to harvest, bids to change.</li>
          <li><b>Campaign report:</b> profitable campaigns running out of budget, and campaigns above breakeven.</li>
          <li><b>Placement report:</b> whether Top of search, Rest of search or Product pages deserve more or less.</li>
          <li><b>Business Report:</b> ASINs with traffic but no sales, lost buy box, TACoS.</li>
          <li><b>Restock report:</b> SKUs about to run out (ease off ads), dead and overstocked stock.</li>
          <li><b>Bulk file:</b> auto campaigns with no negatives, keywords bidding against each other, outlier bids.</li>
        </ul>
        <p>Want Rocco to remember all this, track what you change, and re-check it weekly? <Link href="/">Hire Rocco</Link>: connect Amazon once and approve fixes in one tap.</p>
      </section>
      <Faq items={[
        { q: "Are my reports uploaded?", a: "No. Everything runs in your browser. Close the tab and it's gone." },
        { q: "Which reports do I need?", a: "Any of the six. More reports give a more complete score. The search term report alone already finds most ad waste." },
        { q: "How is the Rocco Score calculated?", a: "It starts at 100 and drops for each issue found: more for urgent ones (money-losing campaigns, stockouts, junk search terms), less for minor ones." },
      ]} />
      <ToolJsonLd tool={tool} />
    </>
  );
}
