import type { Metadata } from "next";
import { SITE } from "@/lib/site";
export const metadata: Metadata = { title: "Privacy", alternates: { canonical: "/privacy" } };
export default function Page() {
  return (
    <section className="prose">
      <h1>Privacy</h1>
      <p className="fine">Last updated Nov 23, 2026</p>
      <h2>Your Amazon data</h2>
      <p>When you connect Amazon, you sign in on Amazon&apos;s own page through DataDoe, an Amazon-approved data partner. We never see your Amazon password. Rocco reads the reports it needs (ads, search terms, campaigns, sales and traffic, inventory) and keeps what it needs to remember: report totals and headlines, the fixes it proposed, the changes you approved, why you skipped any, your settings and the measured results.</p>
      <h2>Changes in your account</h2>
      <p>Rocco changes your Amazon account only when you approve a change. Every change is logged on your Rocco page and can be undone. You can remove Rocco&apos;s access anytime in Seller Central (Manage your apps) and Amazon Ads.</p>
      <h2>AI</h2>
      <p>To rank today&apos;s work and answer your questions, Rocco sends account numbers (never passwords or payment details) to Anthropic&apos;s Claude API. Anthropic doesn&apos;t use API data to train models.</p>
      <h2>Messages</h2>
      <p>If you turn on reminders, we store your phone number or Slack workspace and which Rocco it belongs to. Rocco messages you about your account and replies to you; message rates may apply. Reply <b>STOP</b> anytime to stop and <b>START</b> to resume. We never sell or share your number.</p>
      <h2>What else we collect</h2>
      <ul>
        <li><b>Your Google sign-in email</b>, for your account, receipts and product updates.</li>
        <li><b>Purchase data</b> handled by Dodo Payments, our merchant of record. We never see your full card number.</li>
        <li><b>Usage analytics</b> (pages visited, referrer, device type, which buttons were used) through PostHog, to see what works. Recordings are made only on public pages, with everything you type hidden; never inside your Rocco, and never your Amazon data.</li>
      </ul>
      <h2>Free downloads and email</h2>
      <p>When you ask for a free checklist or guide, we keep the email you give us, which download it was, the marketplace if you picked one, and how you found us (the link or site that brought you, remembered in one first-party cookie for 30 days). You get the download right away either way. Rocco only emails you Amazon tips and product news if you tick the box, and every one of those emails has an unsubscribe link that works in one tap, no login. To have your email deleted, write to us.</p>
      <h2>What we never do</h2>
      <ul><li>Sell your data.</li><li>Change anything in Amazon without your approval.</li><li>Share your account data with other sellers. Rocco learns from anonymous totals across accounts only (for example, how often a type of fix works), never names, products or numbers.</li></ul>
      <h2>Contact and deletion</h2>
      <p>Questions or deletion requests: <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.</p>
      <p className="fine">{SITE.disclaimer}</p>
    </section>
  );
}
