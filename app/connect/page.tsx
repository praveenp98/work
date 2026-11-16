import type { Metadata } from "next";
import Link from "next/link";
import { Faq } from "@/components/Faq";
import { Rocco } from "@/components/Rocco";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Add Rocco to Claude or ChatGPT (Amazon Ads MCP connector)",
  description: "Connect Rocco's Amazon ads MCP server to Claude or ChatGPT: roast search term reports, get fixes, plan Black Friday budgets, and use Rocco's operator playbook beside Amazon's own Ads connector.",
  alternates: { canonical: "/connect" },
};

const URL = `${SITE.url}/mcp`;

export default function Page() {
  return (
    <>
      <div className="split" style={{ alignItems: "center" }}>
        <div>
          <span className="tag live">MCP connector · free to add</span>
          <h1>Give your AI an Amazon operator&apos;s instinct</h1>
          <p className="muted" style={{ fontSize: 18 }}>Add Rocco to Claude or ChatGPT. Attach your search term report and ask &ldquo;roast my ads&rdquo;. Your AI gets Rocco&apos;s audit, calculators and playbook: what to check, what to cut, safe limits, and an approval list.</p>
          <p><span className="code">{URL}</span></p>
        </div>
        <div style={{ justifySelf: "center" }}><Rocco pose="wave" size={220} /></div>
      </div>

      <section className="grid" style={{ marginTop: 28 }}>
        <div className="card">
          <h3>Claude</h3>
          <ol className="steps" style={{ marginTop: 12 }}>
            <li>Open <b>Settings → Connectors</b> (claude.ai or the desktop app).</li>
            <li>Click <b>Add custom connector</b>. Name: <b>Rocco</b>. URL: <span className="code">{URL}</span></li>
            <li>In a chat, enable Rocco from the tools menu, attach your report and say &ldquo;Roast my Amazon ads&rdquo;.</li>
          </ol>
        </div>
        <div className="card">
          <h3>ChatGPT</h3>
          <ol className="steps" style={{ marginTop: 12 }}>
            <li>Open <b>Settings → Apps &amp; Connectors → Advanced</b> and turn on <b>Developer mode</b>.</li>
            <li>Create a connector. Name: <b>Rocco</b>. URL: <span className="code">{URL}</span>. Authentication: none.</li>
            <li>In a chat, pick Rocco from the tools, attach your report and ask for the roast.</li>
          </ol>
        </div>
      </section>
      <p className="fine">Menu names change from time to time. Look for &ldquo;connectors&rdquo; or &ldquo;MCP&rdquo; in your AI&apos;s settings.</p>

      <section className="prose">
        <h2>What your AI can do with Rocco</h2>
        <ul>
          <li><b>roast_ads_report</b>: Leak Score, monthly and yearly leak, top leaks, projected ACoS after fixes. Add your license key to get every fix.</li>
          <li><b>amazon_ads_playbook</b>: Rocco&apos;s rules for negatives, harvesting, bids (±20% cap), budgets, Black Friday and guardrails.</li>
          <li><b>bfcm_surge_plan</b>: day-by-day budget plan for Nov 19 – Dec 2.</li>
          <li><b>breakeven_acos</b> and <b>coupon_profit</b>: the math, done right.</li>
        </ul>
        <h2>Prompts to try</h2>
        <pre className="code">Roast my Amazon ads. My target ACoS is 25%. (attach search term report)</pre>
        <pre className="code">Using Rocco&apos;s playbook, give me an approval list of changes for this week. Nothing gets applied until I say yes.</pre>
        <pre className="code">My daily budget is $200, breakeven ACoS 42%, target 28%. Build my Black Friday surge plan.</pre>
        <h2>Already using Amazon&apos;s own Ads connector?</h2>
        <p>Amazon&apos;s Ads MCP server gives your AI hands: it can pull data and make changes if you have Amazon Ads API access. Rocco gives it judgment. Use both: Amazon&apos;s connector pulls the report, Rocco decides what&apos;s wasting money and drafts an approval list, and nothing is changed until you approve it.</p>
        <p>No API access? No problem. Download the report and attach it. <Link href="/tools/ad-roast">Or just use the website.</Link></p>
      </section>
      <Faq items={[
        { q: "Is the Rocco connector free?", a: "Adding it is free, and so are the Leak Score, top leaks, playbook, surge plan and calculators. The full fix list needs a Rocco license key." },
        { q: "Does Rocco change my Amazon account?", a: "No. Rocco's tools only read the report you give them and return recommendations. Changes only happen if you approve them and apply them yourself or through another connector." },
        { q: "Does Rocco store my report?", a: "No. The report is processed for that request and not stored." },
        { q: "Do I need Amazon Ads API access?", a: "No. Rocco works from the standard search term report any seller can download." },
      ]} />
    </>
  );
}
