import type { Metadata } from "next";
import Link from "next/link";
import { BreakevenCalc } from "@/components/BreakevenCalc";
import { Faq } from "@/components/Faq";
import { ToolJsonLd } from "@/components/ToolJsonLd";
import { toolBySlug } from "@/lib/tools";

const tool = toolBySlug("breakeven-acos")!;
export const metadata: Metadata = { title: "Breakeven ACoS Calculator for Amazon Sellers", description: tool.description, alternates: { canonical: "/tools/breakeven-acos" } };

export default function Page() {
  return (
    <>
      <span className="tag">Free forever</span>
      <h1>Breakeven ACoS calculator</h1>
      <p className="muted" style={{ fontSize: 18, maxWidth: 680 }}>The ACoS where your Amazon ads stop making money, the target ACoS that keeps the profit you want, and the most you can pay per click.</p>
      <BreakevenCalc />
      <section className="prose">
        <h2>The formula</h2>
        <p><b>Breakeven ACoS = (price − referral fee − FBA fee − product cost − other costs) ÷ price.</b> It&apos;s your profit margin before advertising. An ad sale at exactly that ACoS makes zero profit.</p>
        <p><b>Target ACoS = breakeven ACoS − the profit margin you want to keep.</b> <b>Max CPC = price × ACoS × conversion rate.</b></p>
        <p>Got your target? <Link href="/tools/ad-roast">Plug it into the free Ad Roast</Link> to see which search terms are above it.</p>
      </section>
      <Faq items={[
        { q: "What is a good ACoS on Amazon?", a: "There's no universal number. A good ACoS is below your breakeven ACoS, and close to your target ACoS for profit campaigns. Launch and brand-defense campaigns can run higher on purpose." },
        { q: "What's the difference between ACoS and TACoS?", a: "ACoS is ad spend ÷ ad sales. TACoS is ad spend ÷ total sales (ads plus organic). TACoS shows whether ads are growing the whole business." },
        { q: "Why is my ACoS higher in November and December?", a: "Competition pushes CPCs up during Black Friday, Cyber Monday and Christmas. Conversion rates also rise, so check profit, not just ACoS, and cap bid increases." },
      ]} />
      <ToolJsonLd tool={tool} />
    </>
  );
}
