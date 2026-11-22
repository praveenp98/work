import type { Metadata } from "next";
import { PLAN } from "@/lib/pricing";
import { SITE } from "@/lib/site";
export const metadata: Metadata = { title: "Refunds", alternates: { canonical: "/refunds" } };
export default function Page() {
  return (
    <section className="prose">
      <h1>Refund policy</h1>
      <p className="fine">Last updated Nov 22, 2026</p>
      <h2>{PLAN.guaranteeDays}-day money-back guarantee</h2>
      <p>If you don&apos;t like the fixes Rocco gives you, email <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a> within <b>{PLAN.guaranteeDays} days</b> of your first payment, from the email you paid with, and we&apos;ll refund you in full. This applies to the yearly and the monthly plan. No call, no forms.</p>
      <h2>Cancelling</h2>
      <p>You can cancel the renewal anytime. Rocco keeps working until the end of the period you paid for, and you won&apos;t be charged again.</p>
      <h2>How refunds arrive</h2>
      <p>Refunds go back to your original payment method through Dodo Payments, our merchant of record, and usually arrive in 5–10 business days.</p>
      <p className="fine">Changes Rocco made in your Amazon account stay logged on your Rocco page, so you can undo any of them yourself.</p>
    </section>
  );
}
