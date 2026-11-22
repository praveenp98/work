import type { Metadata } from "next";
import Link from "next/link";
import { PLAN } from "@/lib/pricing";
import { SITE } from "@/lib/site";
export const metadata: Metadata = { title: "Terms", alternates: { canonical: "/terms" } };
export default function Page() {
  return (
    <section className="prose">
      <h1>Terms of use</h1>
      <p className="fine">Last updated Nov 22, 2026</p>
      <ul>
        <li>Rocco is self-serve software. It reads your Amazon data through Amazon&apos;s official APIs (via DataDoe, an Amazon-approved data partner), suggests changes, and makes only the changes you approve. It does not provide consulting or manage your account without you.</li>
        <li>Nothing changes in your Amazon account until you approve it on your Rocco page or by text (if you switched that on). Each change is checked with Amazon first, logged, and can be undone. Review what you approve: Amazon advertising results are never guaranteed.</li>
        <li>Plans are subscriptions (yearly or monthly) for your team and your own brands. Cancel the renewal anytime; access runs to the end of the paid period. Refunds follow the <Link href="/refunds">{PLAN.guaranteeDays}-day money-back guarantee</Link>.</li>
        <li>Only connect accounts you have the right to use, and don&apos;t try to break or abuse the service. You can remove Rocco&apos;s access anytime in Seller Central and Amazon Ads.</li>
        <li>The service is provided as is. Our total liability is limited to the amount you paid in the last 12 months.</li>
      </ul>
      <p className="fine">{SITE.disclaimer} Amazon is a trademark of Amazon.com, Inc. or its affiliates and is used here only to describe compatibility.</p>
    </section>
  );
}
