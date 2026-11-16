import type { Metadata } from "next";
import { SITE } from "@/lib/site";
export const metadata: Metadata = { title: "Refunds", alternates: { canonical: "/refunds" } };
export default function Page() {
  return (
    <section className="prose">
      <h1>Refund policy</h1>
      <p>If Rocco doesn&apos;t find anything useful in your account, email <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a> within <b>7 days</b> of purchase with your order email, and we&apos;ll refund you in full.</p>
      <p>Refunds go back to the original payment method through our payment provider and usually arrive in 5–10 business days.</p>
    </section>
  );
}
