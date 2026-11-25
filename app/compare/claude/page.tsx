import type { Metadata } from "next";
import { AiCompare } from "@/components/compare/AiCompare";
import { PRICE } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Can Claude manage Amazon PPC? Rocco vs Claude for Amazon sellers",
  description: `Claude is great at analysing your Amazon reports. Rocco runs on Claude and adds the daily check, memory, money guardrails and a result check on every change. ${PRICE.monthly}/mo flat.`,
  alternates: { canonical: "/compare/claude" },
};

export default function Page() {
  return <AiCompare ai={{ name: "Claude", plan: "Claude plans from about $20/mo (higher tiers for heavy use)", data: "Reports you upload, or Amazon's own connectors where available (Selling Partner, Amazon Ads)", act: "Can act through connectors when you allow it, one chat at a time", makerUrl: "https://claude.ai", checked: "Nov 25, 2026" }} />;
}
