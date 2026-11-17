import type { Metadata } from "next";
import { SITE } from "@/lib/site";
export const metadata: Metadata = { title: "Privacy", alternates: { canonical: "/privacy" } };
export default function Page() {
  return (
    <section className="prose">
      <h1>Privacy</h1>
      <p className="fine">Last updated Nov 16, 2026</p>
      <h2>Your reports</h2>
      <p>Reports you drop into Rocco&apos;s tools are read inside your browser. They are not uploaded to or stored on our servers. When you close the tab, the data is gone.</p>
      <h2>Reports sent through the Claude/ChatGPT connector</h2>
      <p>When your AI assistant calls Rocco, the report text is sent to our server to be analyzed and is not kept as a file. With a personal workspace, Rocco stores what it needs to remember: report summaries (totals and headlines), the changes it proposed, the changes you approved, your brand settings and the measured results. Your workspace is identified only by its private link. Ask us to delete it anytime.</p>
      <h2>Text messages (Text Rocco)</h2>
      <p>If you text Rocco or link your phone to a workspace, we store your phone number, which workspace it belongs to, and whether you&apos;ve paused messages. Rocco texts you your daily numbers and replies to your messages; message and data rates may apply. Reply <b>STOP</b> anytime to stop texts and <b>START</b> to resume. We never sell or share your number, and we don&apos;t use it for marketing from anyone else.</p>
      <h2>What we collect</h2>
      <ul>
        <li><b>Email</b>, if you join the list or buy. Used to send the brief, receipts and product updates. Unsubscribe anytime.</li>
        <li><b>Purchase data</b> handled by our payment provider (Dodo Payments, our merchant of record). We never see your full card number.</li>
        <li><b>Anonymous usage analytics</b> (pages visited, referrer, device type) to see what works.</li>
      </ul>
      <h2>What we never do</h2>
      <ul><li>Sell your data.</li><li>Log into or change your Amazon account.</li><li>Share your report contents with anyone.</li></ul>
      <h2>Contact</h2>
      <p>Questions or deletion requests: <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.</p>
      <p className="fine">{SITE.disclaimer}</p>
    </section>
  );
}
