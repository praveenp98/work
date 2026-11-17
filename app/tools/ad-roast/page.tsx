import type { Metadata } from "next";
import Link from "next/link";
import { AdRoastTool } from "@/components/AdRoastTool";
import { LeakEstimator } from "@/components/home/LeakEstimator";
import { Faq } from "@/components/Faq";
import { ToolJsonLd } from "@/components/ToolJsonLd";
import { toolBySlug } from "@/lib/tools";

const tool = toolBySlug("ad-roast")!;

export const metadata: Metadata = {
  title: "Free Amazon PPC Audit: Roast My Amazon Ads",
  description: tool.description,
  alternates: { canonical: "/tools/ad-roast" },
};

export default function Page() {
  return (
    <>
      <span className="tag">Free · no login · file stays in your browser</span>
      <h1>Roast my Amazon ads</h1>
      <p className="lede muted" style={{ fontSize: 18, maxWidth: 680 }}>
        Upload one Sponsored Products search term report. Rocco digs through every search term and tells you how much money is leaking, where, and exactly what to change.
      </p>
      <AdRoastTool />

      <section style={{ marginTop: 48 }}>
        <h2>No report handy? Estimate the leak.</h2>
        <LeakEstimator />
      </section>

      <section className="prose">
        <h2>How to download your search term report</h2>
        <ol className="steps">
          <li>In Amazon Ads (advertising.amazon.com), open <b>Measurement &amp; Reporting → Sponsored ads reports</b>.</li>
          <li>Click <b>Create report</b>. Pick <b>Sponsored Products</b>, report type <b>Search term</b>, time unit <b>Summary</b>.</li>
          <li>Choose the <b>last 30 or 60 days</b>, run it, and download the .xlsx. Drop it above.</li>
        </ol>

        <h2>What Rocco checks</h2>
        <ul>
          <li><b>Zero-sale search terms:</b> terms with 10+ clicks (you can change this) and no orders. Fix: add as negative exact in that ad group.</li>
          <li><b>Junk intent:</b> shoppers searching &ldquo;free&rdquo;, &ldquo;how to&rdquo;, &ldquo;used&rdquo;, &ldquo;DIY&rdquo; and similar. They click, they don&apos;t buy.</li>
          <li><b>Over-target ACoS:</b> terms that sell but cost more than 1.5× your target ACoS. Rocco counts only the spend above your target as the leak.</li>
          <li><b>Missed harvest:</b> search terms converting in auto, broad or phrase campaigns that you don&apos;t target as exact yet.</li>
          <li><b>Bids:</b> new bid = current CPC × (target ACoS ÷ actual ACoS), never more than ±20% in one step, so nothing swings wildly in peak season.</li>
        </ul>
        <p>Rocco never logs into or changes your account. You get a fix list and, if you add your bulk file, an upload-ready bulk sheet you review and upload yourself.</p>
        <p>Next: <Link href="/tools/breakeven-acos">find your breakeven ACoS</Link> so your target is right, or <Link href="/tools/coupon-calculator">check your Black Friday coupon margin</Link>.</p>
      </section>

      <Faq
        items={[
          { q: "Is the Amazon ad roast really free?", a: "Yes. The Leak Score, your monthly leak estimate, the top 3 leaks and the share card are free with no login. The full list of fixes and the bulk file are part of a paid plan." },
          { q: "Do you upload or store my report?", a: "No. The file is read inside your browser and is never sent to our servers. Close the tab and it's gone." },
          { q: "Do I need Amazon Ads API access or to connect my account?", a: "No. Rocco works from the standard search term report any seller can download. No API keys, no login, no account access." },
          { q: "How is the money 'leaking' calculated?", a: "Leak = spend on search terms with enough clicks and zero orders, plus, for terms that do sell, the spend above what your target ACoS allows. It's scaled to a 30-day month using the report's dates." },
          { q: "What click threshold should I use for negatives?", a: "10 clicks is a safe default for most categories. If your conversion rate is below 5% or your price is high, raise it to 15–20 so you don't cut terms too early." },
          { q: "Will the bid changes hurt my Black Friday sales?", a: "Every bid move is capped at ±20% per step, and terms with fewer clicks than your threshold aren't touched. Re-run the roast weekly and adjust gradually." },
        ]}
      />
      <ToolJsonLd tool={tool} />
    </>
  );
}
