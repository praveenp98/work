import type { Metadata } from "next";
import { SetupWizard } from "@/components/connect/SetupWizard";
import { Faq } from "@/components/Faq";
import { StartSteps } from "@/components/start/StartSteps";

export const metadata: Metadata = {
  title: "Connect Amazon Ads & Seller Central to Claude, ChatGPT or Claude Code",
  description: "3-minute setup: add Amazon's official Ads and Selling Partner connectors plus Rocco to Claude, ChatGPT, Claude Code or Cursor. Exact URLs by region, copy-paste commands and config.",
  alternates: { canonical: "/setup" },
};

export default function Page() {
  return (
    <>
      <section className="start-page">
        <h1>Plug Amazon into your AI.</h1>
        <StartSteps />
        <p className="start-extra"><span>Rather text? <a href="/">Text Rocco</a></span><a href="#all">All URLs &amp; config files</a></p>
      </section>
      <details id="all" className="card" style={{ marginTop: 30 }}>
        <summary><b>All connector URLs, config files and the Claude Code autopilot</b></summary>
        <div style={{ marginTop: 16 }}><SetupWizard /></div>
      </details>
      <Faq items={[
        { q: "Is it safe to connect Amazon to my AI?", a: "You sign in to Amazon's own connectors directly (Rocco never sees your password). Amazon's Seller Central connector asks you to approve every action, and Rocco only proposes changes; nothing is applied until you approve specific codes." },
        { q: "What if I don't have Amazon Ads API access?", a: "Amazon's Ads connector requires it. Until it's approved, connect Seller Central and Rocco; Rocco can read an exported ads report in the meantime." },
        { q: "Which marketplace region am I?", a: "North America: US, Canada, Mexico, Brazil. Europe: UK, EU countries, Türkiye, Middle East, India. Far East: Japan, Australia, Singapore." },
        { q: "Can I use Claude Code instead of the chat app?", a: "Yes. Add the three connectors with one command each, sign in with /mcp, and save the /morning-check command so your daily check is one word." },
        { q: "Do the Amazon connectors cost anything?", a: "Amazon's connectors are Amazon's products. Rocco is free to add; a one-time license unlocks every fix and full tracking." },
      ]} />
    </>
  );
}
