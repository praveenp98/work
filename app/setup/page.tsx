import type { Metadata } from "next";
import { SetupWizard } from "@/components/connect/SetupWizard";
import { Faq } from "@/components/Faq";
import { Rocco } from "@/components/Rocco";

export const metadata: Metadata = {
  title: "Connect Amazon Ads & Seller Central to Claude, ChatGPT or Claude Code",
  description: "3-minute setup: add Amazon's official Ads and Selling Partner connectors plus Rocco to Claude, ChatGPT, Claude Code or Cursor. Exact URLs by region, copy-paste commands and config.",
  alternates: { canonical: "/setup" },
};

export default function Page() {
  return (
    <>
      <div className="split" style={{ alignItems: "center", marginTop: 12 }}>
        <div>
          <span className="eyebrow">Setup · about 3 minutes</span>
          <h1 style={{ fontSize: "clamp(34px,5vw,54px)" }}>Plug Amazon into your AI. Then just ask.</h1>
          <p className="muted" style={{ fontSize: 18 }}>Amazon&apos;s official connectors give your AI access to Ads and Seller Central. Rocco gives it the judgment: what to pull, what to change, and what happened last time. Pick your app and marketplace; we&apos;ll give you the exact steps.</p>
        </div>
        <div style={{ justifySelf: "center" }}><Rocco pose="wave" size={190} /></div>
      </div>
      <SetupWizard />
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
