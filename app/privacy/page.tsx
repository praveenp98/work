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
      <h2>What we collect</h2>
      <ul>
        <li><b>Email</b>, if you join the list or buy. Used to send the brief, receipts and product updates. Unsubscribe anytime.</li>
        <li><b>Purchase data</b> handled by our payment provider (Polar or Razorpay). We never see your full card number.</li>
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
