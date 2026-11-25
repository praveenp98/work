import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Rocco in Claude and ChatGPT: connector setup, tools and privacy",
  description: "Add Rocco to Claude or ChatGPT: your Amazon account's memory and watchdog inside your chat. Setup, every tool, example prompts, data and privacy.",
  alternates: { canonical: "/connector" },
};

const URL = `${SITE.url}/mcp/login`;
const TOOLS: [string, string, "Read" | "Adds a record" | "Changes saved data"][] = [
  ["rocco_brief", "Your daily brief: results of past changes, changes due for a check, approved fixes not applied yet, trends per brand.", "Read"],
  ["analyze_report", "Analyzes Amazon report rows (from Amazon's own connectors or an exported file) and returns findings plus a numbered approval list. Saves a snapshot so results can be measured later.", "Adds a record"],
  ["rocco_plan", "Which reports and columns a job needs (morning check, wasted searches, budgets, restock...).", "Read"],
  ["listing_gaps", "Converting search terms missing from your title, bullets or backend keywords.", "Read"],
  ["export_changes", "The approved change list in Amazon Ads API format, or Bulksheets rows to upload yourself.", "Read"],
  ["apply_changes", "Records changes you applied (by code) and sets a 7-day follow-up so Rocco can measure them.", "Changes saved data"],
  ["list_changes", "Everything applied with Rocco: what, when, why, follow-up date and measured result.", "Read"],
  ["revert_changes", "Marks logged changes as reverted and returns the exact undo steps.", "Changes saved data"],
  ["set_brand_settings", "Saves target ACoS, break-even, protected brand terms and the click threshold for negatives.", "Changes saved data"],
  ["setup_check", "How to connect Amazon's official Ads and Selling Partner connectors.", "Read"],
  ["amazon_ads_playbook", "Rocco's rules and thresholds for judging an ads account.", "Read"],
  ["breakeven_acos", "Break-even ACoS, target ACoS and max CPC for a product.", "Read"],
  ["coupon_profit", "Profit per unit before and after a coupon, and the deepest safe discount.", "Read"],
  ["roast_ads_report", "A quick graded audit of a search term report: what's leaking and where.", "Read"],
  ["bfcm_surge_plan", "Day-by-day Black Friday / Cyber Monday budget and bid plan.", "Read"],
  ["workspace_link", "The link to your Rocco dashboard.", "Read"],
  ["activate_license", "Attaches a Rocco license key to your workspace.", "Adds a record"],
];
const PROMPTS = [
  "Rocco, what needs my attention today?",
  "Analyze my last 30 days of search terms and show me what to block.",
  "Did the bid changes I made last week work?",
  "Claude suggested restructuring my campaigns. Check that against what's worked in my account.",
  "Set my target ACoS to 25% and never negate my brand name.",
];

/** Public docs for the Claude / ChatGPT directory listings (required by both). */
export default function Page() {
  return (
    <section className="pr">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Rocco for Claude and ChatGPT", applicationCategory: "BusinessApplication", operatingSystem: "Web", url: `${SITE.url}/connector`, publisher: { "@type": "Organization", name: SITE.name, url: SITE.url } }} />
      <header className="pr-head">
        <span className="h5-kicker">Rocco connector</span>
        <h1>Your Amazon account&apos;s memory, inside Claude and ChatGPT.</h1>
        <p className="pr-sub">Claude and ChatGPT give great advice. Rocco keeps the receipts: what was changed, why, and whether it worked. Add Rocco to your chat and ask about your Amazon business with your real history behind every answer.</p>
      </header>

      <section className="pr-sec">
        <h2>Set up (2 minutes)</h2>
        <ol className="cx-steps">
          <li><b>Claude:</b> Settings → Connectors → find <b>Rocco</b> in the directory (or <b>Add custom connector</b> and paste <code>{URL}</code>) → Connect → sign in to Rocco with Google.</li>
          <li><b>ChatGPT:</b> open the apps directory, find <b>Rocco</b>, and connect → sign in to Rocco with Google.</li>
          <li>For your Amazon data, also connect Amazon&apos;s own Ads and Selling Partner connectors where available, or upload a report. Rocco analyzes what you give it.</li>
          <li>In a new chat, ask: <i>&ldquo;Rocco, what needs my attention today?&rdquo;</i></li>
        </ol>
        <p className="fine">Rocco never changes anything in Amazon from a chat. It proposes a numbered approval list; you decide what to apply. A full Rocco plan (daily checks, one-tap changes made in Amazon, iMessage/WhatsApp/Slack) is at <Link href="/pricing">rocco.works/pricing</Link>.</p>
      </section>

      <section className="pr-sec">
        <h2>Try these prompts</h2>
        <ul className="cx-prompts">{PROMPTS.map((p) => <li key={p}>&ldquo;{p}&rdquo;</li>)}</ul>
      </section>

      <section className="pr-sec">
        <h2>Every tool</h2>
        <div className="cmp-wrap">
          <table className="cmp-t">
            <thead><tr><th>Tool</th><th>What it does</th><th>Type</th></tr></thead>
            <tbody>{TOOLS.map(([n, d, t]) => <tr key={n}><th scope="row"><code>{n}</code></th><td data-label="What it does">{d}</td><td data-label="Type">{t}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="fine">&ldquo;Changes saved data&rdquo; means Rocco&apos;s own records (your change log and settings), never your Amazon account. Your assistant asks you before running these.</p>
      </section>

      <section className="pr-sec">
        <h2>Data and privacy</h2>
        <ul className="cx-prompts">
          <li>Sign-in is OAuth 2.0 with your Google account. Rocco never sees your Amazon password.</li>
          <li>Rocco receives only what a tool needs: the report rows you analyze, the codes you apply, the settings you save. It does not read your chat history, memory or files.</li>
          <li>Stored: a summary of each report you analyze (totals, top search terms, findings), your change log, results and brand settings, so Rocco can measure results. Raw report files aren&apos;t kept. Everything stays until you delete your workspace.</li>
          <li>Never sold, never shared with other sellers. Full policy: <Link href="/privacy">rocco.works/privacy</Link>.</li>
          <li>Disconnect any time in your assistant&apos;s connector settings. Delete everything: email <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.</li>
        </ul>
      </section>

      <section className="pr-sec">
        <h2>Support</h2>
        <p>Email <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>, usually answered the same day. Rocco is an independent tool, not affiliated with Amazon, Anthropic or OpenAI.</p>
      </section>
    </section>
  );
}
