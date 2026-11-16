import type { Metadata } from "next";
import Link from "next/link";
import { Faq } from "@/components/Faq";
import { Rocco } from "@/components/Rocco";
import { SurgePlanner } from "@/components/SurgePlanner";
import { ToolJsonLd } from "@/components/ToolJsonLd";
import { toolBySlug } from "@/lib/tools";

const tool = toolBySlug("bfcm-surge-plan")!;
export const metadata: Metadata = { title: "Amazon Black Friday Ad Budget Plan 2026 (Free)", description: tool.description, alternates: { canonical: "/tools/bfcm-surge-plan" } };

export default function Page() {
  return (
    <>
      <div className="split" style={{ alignItems: "end" }}>
        <div>
          <span className="tag live">Free · Black Friday Nov 27 · Cyber Monday Nov 30</span>
          <h1>Your Black Friday ad budget plan, day by day</h1>
          <p className="muted" style={{ fontSize: 18 }}>Enter today&apos;s budget. Rocco gives you the budget, bid and placement moves for every day from Nov 19 to Dec 2, with guardrails so peak week doesn&apos;t burn your margin.</p>
        </div>
        <div style={{ justifySelf: "center" }}><Rocco pose="party" size={180} /></div>
      </div>
      <SurgePlanner />
      <section className="prose">
        <h2>Why plan the budget day by day?</h2>
        <p>Black Friday and Cyber Monday bring more shoppers and higher conversion rates, but also higher CPCs. The two classic mistakes are running out of budget by noon on the biggest day, and raising every bid so junk search terms eat the extra money. The plan raises budgets in steps, boosts only proven winners, and pulls back on Dec 1.</p>
        <p>Do it in this order: <Link href="/tools/ad-roast">roast your account</Link> and add the negatives, check your <Link href="/tools/coupon-calculator">coupon margin</Link>, then follow the surge plan.</p>
      </section>
      <Faq items={[
        { q: "How much should I increase my Amazon ad budget for Black Friday?", a: "It depends on margin and stock. Rocco's normal plan roughly doubles daily budget on Black Friday and Cyber Monday, with smaller increases the week before. Use 'careful' with thin margins and 'bold' only with strong margins and deep stock." },
        { q: "Should I raise all my bids for Black Friday?", a: "No. Raise bids only on proven winners: exact-match terms with orders and ACoS under target. Raising everything sends more money to search terms that never convert." },
        { q: "When does Black Friday 2026 start on Amazon?", a: "Black Friday is Friday, November 27, 2026 and Cyber Monday is November 30. Amazon's deal events usually start earlier in the week, so the plan starts ramping on November 19." },
        { q: "What ACoS is OK during Black Friday?", a: "On peak days you can tolerate ACoS up to your breakeven on proven winners, because conversion rates rise. Outside peak days, hold your normal target." },
      ]} />
      <ToolJsonLd tool={tool} />
    </>
  );
}
