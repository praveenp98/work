import type { Metadata } from "next";
import Link from "next/link";
import { CouponCalc } from "@/components/CouponCalc";
import { Faq } from "@/components/Faq";
import { ToolJsonLd } from "@/components/ToolJsonLd";
import { WaitlistForm } from "@/components/WaitlistForm";
import { toolBySlug } from "@/lib/tools";

const tool = toolBySlug("coupon-calculator")!;
export const metadata: Metadata = { title: "Amazon Coupon Profit Calculator (Black Friday 2026)", description: tool.description, alternates: { canonical: "/tools/coupon-calculator" } };

export default function Page() {
  return (
    <>
      <span className="tag">Free · Black Friday &amp; Cyber Monday</span>
      <h1>Amazon coupon profit calculator</h1>
      <p className="muted" style={{ fontSize: 18, maxWidth: 680 }}>Before you clip a 20% coupon for Black Friday, see what it actually leaves you after referral fees, FBA fees, coupon fees and ad cost.</p>
      <CouponCalc />
      <section className="prose">
        <h2>How the math works</h2>
        <ul>
          <li><b>Referral fee and coupon fee are charged on the discounted price</b>, so a coupon shrinks both your revenue and some of your fees.</li>
          <li><b>FBA fee, product cost and ad cost don&apos;t shrink.</b> That&apos;s why a 20% coupon can cut profit per unit by half or more.</li>
          <li><b>Deepest safe coupon</b> is the discount where profit per unit hits zero. Stay well above it in peak season, when CPCs rise.</li>
        </ul>
        <p>Then check whether your ads are eating the margin: <Link href="/tools/ad-roast">run a free Ad Roast</Link>.</p>
        <h3 style={{ marginTop: 24 }}>Get the per-SKU coupon plan when it launches</h3>
        <WaitlistForm source="coupon-calculator" cta="Notify me" />
      </section>
      <Faq items={[
        { q: "What fees does Amazon charge for coupons?", a: "Amazon charges coupon fees on top of normal referral and FBA fees. The structure has changed over time (per-redemption fees, then a fixed fee per coupon plus a percentage of coupon sales). Check Seller Central for the current numbers and enter them in the calculator." },
        { q: "Is the referral fee calculated before or after the coupon?", a: "On the price the customer pays, so after the coupon discount." },
        { q: "Should I run a coupon or a Prime Exclusive Discount for Black Friday?", a: "Run the numbers for both. Coupons show a badge in search, which can lift click-through rate; the right choice is the one that keeps profit per unit positive at your expected volume." },
        { q: "How many extra sales does a coupon need to be worth it?", a: "The calculator shows how many coupon sales you need to earn what your expected full-price sales would. If the coupon can't realistically lift volume that much, skip it or make it smaller." },
      ]} />
      <ToolJsonLd tool={tool} />
    </>
  );
}
