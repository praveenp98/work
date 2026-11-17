import type { Metadata } from "next";
import Link from "next/link";
import { ChatDemo } from "@/components/connect/ChatDemo";
import { ConnectBox } from "@/components/connect/ConnectBox";
import { Playground } from "@/components/connect/Playground";
import { Faq } from "@/components/Faq";
import { REPORT_HELP } from "@/lib/analyze";

export const metadata: Metadata = {
  title: "Add Rocco to Claude or ChatGPT: Amazon Seller MCP Connector",
  description: "Rocco is an MCP connector that turns Claude or ChatGPT into an Amazon teammate: analyzes Ads and Seller Central reports, proposes changes, remembers what you applied and checks results.",
  alternates: { canonical: "/connect" },
};

const TOOLS = [
  { name: "rocco_plan", say: "“Rocco, morning check.”", does: "Tells your AI exactly which reports and columns to pull from Amazon's Ads connector and your Seller Central connector for the job." },
  { name: "analyze_report", say: "(called for you after the pull)", does: "Reads the pulled data (any of six types), finds problems, flags what's new since last time, queues coded changes, and judges earlier changes." },
  { name: "rocco_brief", say: "“What should I do today?”", does: "Results of past changes, what's due, open fixes ranked by $, seasonal reminders.", memory: true },
  { name: "export_changes", say: "“Approve N1–N4 and G2.”", does: "Exact change list for Amazon's Ads connector (IDs included), so your AI applies only what you approved.", memory: true },
  { name: "apply_changes", say: "(called after the changes go through)", does: "Logs each change with before-numbers, undo steps and a follow-up date.", memory: true },
  { name: "list_changes · revert_changes", say: "“Did last week's changes work?” · “Undo B3.”", does: "Change log with measured results; exact steps to reverse anything.", memory: true },
  { name: "listing_gaps", say: "“What keywords is my listing missing?”", does: "Converting search terms whose words aren't in your title, bullets or backend keywords.", memory: true },
  { name: "set_brand_settings", say: "“Target ACoS 25%, never negate ‘acme’.”", does: "Per-brand targets, click threshold and protected brand terms.", memory: true },
  { name: "bfcm_surge_plan · amazon_ads_playbook", say: "“Plan my Black Friday budgets.”", does: "Day-by-day peak-season plan; Rocco's operator rules and guardrails." },
];

export default function Page() {
  return (
    <>
      <section className="hero hero-mcp">
        <div>
          <span className="eyebrow">MCP connector · Claude &amp; ChatGPT</span>
          <h1>Add Rocco in 60 seconds.</h1>
          <p className="lede">Amazon&apos;s official connector gives your AI hands. Rocco gives it the judgment and memory of a senior Amazon manager: what to pull, what to cut, what to fund, and what you changed last week.</p>
          <ConnectBox />
        </div>
        <div className="hero-chat"><ChatDemo /></div>
      </section>

      <section>
        <div className="section-head">
          <span className="eyebrow">Try before you add</span>
          <h2>Run the real tools here</h2>
        </div>
        <Playground />
      </section>

      <section>
        <div className="section-head">
          <span className="eyebrow">What to say</span>
          <h2>Every tool, in plain English</h2>
          <p>You don&apos;t call tools by name. Just talk; your AI picks the right one. Tools marked memory need your personal connector.</p>
        </div>
        <div className="tools-ref">
          {TOOLS.map((t) => (
            <div className="card" key={t.name}>
              <code>{t.name}</code>{t.memory && <span className="tag" style={{ marginLeft: 8, marginBottom: 0 }}>memory</span>}
              <p style={{ margin: "8px 0 4px", fontWeight: 600 }}>{t.say}</p>
              <p className="muted" style={{ margin: 0 }}>{t.does}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="section-head">
          <span className="eyebrow">Where Rocco gets data</span>
          <h2>From the connectors you already use</h2>
          <p>Rocco doesn&apos;t log in anywhere. He tells your AI what to pull from your connected Amazon tools, then does the thinking.</p>
        </div>
        <div className="tablewrap">
          <table className="fixes">
            <thead><tr><th>Job</th><th>Pulled from</th><th>No API access?</th></tr></thead>
            <tbody>
              <tr><td><b>Search terms, bids, harvests</b></td><td>Amazon&apos;s official Ads connector (search term report)</td><td>{REPORT_HELP.sp_search_term.where}</td></tr>
              <tr><td><b>Budgets</b></td><td>Amazon Ads connector (campaign report)</td><td>{REPORT_HELP.sp_campaign.where}</td></tr>
              <tr><td><b>Placements</b></td><td>Amazon Ads connector (campaign × placement)</td><td>{REPORT_HELP.sp_placement.where}</td></tr>
              <tr><td><b>Conversion, buy box, TACoS</b></td><td>Selling Partner API connector (Sales &amp; Traffic)</td><td>{REPORT_HELP.business_report.where}</td></tr>
              <tr><td><b>Stockout guard</b></td><td>Selling Partner API connector (Restock report)</td><td>{REPORT_HELP.inventory.where}</td></tr>
              <tr><td><b>Keyword research</b></td><td>Any keyword tool you&apos;ve connected (e.g. Helium 10, if you use it)</td><td>Optional</td></tr>
            </tbody>
          </table>
        </div>
        <p className="fine" style={{ marginTop: 8 }}>Amazon&apos;s Ads connector needs Amazon Ads API access. Without it, attach an exported report and Rocco reads that instead.</p>
      </section>

      <section className="prose">
        <h2>Already using Amazon&apos;s own Ads connector?</h2>
        <p>Amazon&apos;s Ads MCP server gives your AI hands: it can pull data and make changes if you have Amazon Ads API access. Rocco gives it judgment and memory. Let Amazon&apos;s connector pull the reports, Rocco decide and log, and apply only the codes you approve.</p>
        <p>No API access? Download the reports and attach them. Or <Link href="/tools/ad-roast">use the web roast</Link>.</p>
      </section>

      <Faq items={[
        { q: "Is Rocco free to add?", a: "Yes. The brief, findings, and the top 3 fixes per report are free, including tracking those changes. A one-time license unlocks every fix, full tracking and bulk files." },
        { q: "What's the difference between the shared URL and my personal URL?", a: "rocco.works/mcp works for anyone, with no memory. Your personal URL (rocco.works/mcp/your-key) adds memory: change log, result checks, brand settings and the daily brief. Keep it private." },
        { q: "Does Rocco change my Amazon account?", a: "Rocco never touches it directly. Your AI applies only the codes you approve, through Amazon's own connector, and Rocco logs them with undo steps." },
        { q: "Do I need Amazon's Ads connector?", a: "It's the best way: Rocco plans the pull, your AI fetches the data and applies approved changes through it. Without API access, Rocco reads exported reports instead." },
        { q: "What does Rocco store?", a: "With a personal connector: summaries (totals, headlines, top search terms), the proposed changes, and the changes you approved. Not your raw data dumps, and never passwords." },
        { q: "Does it work for multiple brands?", a: "Yes. Tell Rocco the brand name when you share a report and he keeps separate settings and history per brand." },
      ]} />
    </>
  );
}
