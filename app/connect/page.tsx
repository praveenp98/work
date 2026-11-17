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
  { name: "rocco_brief", say: "“Rocco, brief me.”", does: "Today's to-do list: results of past changes, what's due, open fixes, which reports to refresh, seasonal reminders.", memory: true },
  { name: "analyze_report", say: "“Analyze this.” (attach any report)", does: "Detects the report type, finds problems, returns an approval list with codes, and checks earlier changes against the new data." },
  { name: "apply_changes", say: "“Approve N1–N4 and G2, I applied them.”", does: "Logs approved changes with before-numbers and a follow-up date.", memory: true },
  { name: "list_changes", say: "“What did we change this month?”", does: "Your change log with results: worked, no effect, worse, or still waiting.", memory: true },
  { name: "revert_changes", say: "“Undo B3.”", does: "Marks it reverted and gives the exact undo steps.", memory: true },
  { name: "set_brand_settings", say: "“Target ACoS 25%, never negate ‘acme’.”", does: "Per-brand target and breakeven ACoS, click threshold, protected brand terms.", memory: true },
  { name: "export_changes", say: "“Give me the bulk file for N1–N6.” (attach bulk file)", does: "Fix list CSV, plus Bulksheets 2.0 rows with your real IDs, ready to upload.", memory: true },
  { name: "bfcm_surge_plan", say: "“Plan my Black Friday budgets.”", does: "Day-by-day budget, bid and placement plan for Nov 19 – Dec 2." },
  { name: "amazon_ads_playbook", say: "“What are Rocco's rules for bids?”", does: "Rocco's operator rules: negatives, harvest, bids, budgets, guardrails, working beside Amazon's own connector." },
  { name: "breakeven_acos · coupon_profit", say: "“What's my breakeven ACoS?”", does: "The margin math, done right." },
];

export default function Page() {
  return (
    <>
      <section className="hero hero-mcp">
        <div>
          <span className="eyebrow">MCP connector · Claude &amp; ChatGPT</span>
          <h1>Add Rocco in 60 seconds.</h1>
          <p className="lede">One URL turns your AI into an Amazon teammate who knows the job: what to check, what to cut, what to fund, and what you changed last week.</p>
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
          <span className="eyebrow">Feed Rocco</span>
          <h2>Which reports, and where to find them</h2>
          <p>Download, then drag into your chat. Rocco detects the type. Fresh reports weekly keep his brief sharp.</p>
        </div>
        <div className="tablewrap">
          <table className="fixes">
            <thead><tr><th>Report</th><th>Where</th></tr></thead>
            <tbody>{Object.values(REPORT_HELP).map((r) => <tr key={r.name}><td><b>{r.name}</b></td><td>{r.where}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="fine" style={{ marginTop: 8 }}>For result checks, use Daily reports that start the day after you applied changes.</p>
      </section>

      <section className="prose">
        <h2>Already using Amazon&apos;s own Ads connector?</h2>
        <p>Amazon&apos;s Ads MCP server gives your AI hands: it can pull data and make changes if you have Amazon Ads API access. Rocco gives it judgment and memory. Let Amazon&apos;s connector pull the reports, Rocco decide and log, and apply only the codes you approve.</p>
        <p>No API access? Download the reports and attach them. Or <Link href="/tools/ad-roast">use the web roast</Link>.</p>
      </section>

      <Faq items={[
        { q: "Is Rocco free to add?", a: "Yes. The brief, findings, and the top 3 fixes per report are free, including tracking those changes. A one-time license unlocks every fix, full tracking and bulk files." },
        { q: "What's the difference between the shared URL and my personal URL?", a: "rocco.works/mcp works for anyone, with no memory. Your personal URL (rocco.works/mcp/your-key) adds memory: change log, result checks, brand settings and the daily brief. Keep it private." },
        { q: "Does Rocco change my Amazon account?", a: "No. Rocco reads reports and proposes changes. You (or Amazon's own connector, with your approval) apply them." },
        { q: "What does Rocco store?", a: "With a personal connector: report summaries (totals, headlines), the proposed changes, and the changes you approved. Not the raw report files." },
        { q: "Does it work for multiple brands?", a: "Yes. Tell Rocco the brand name when you share a report and he keeps separate settings and history per brand." },
      ]} />
    </>
  );
}
