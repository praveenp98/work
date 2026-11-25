import type { Metadata } from "next";
import { AiCompare } from "@/components/compare/AiCompare";
import { PRICE } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Can ChatGPT manage Amazon PPC? Rocco vs ChatGPT for Amazon sellers",
  description: `ChatGPT can analyse the Amazon reports you give it. Rocco checks your account every morning, keeps changes inside safe limits, and measures every result. ${PRICE.monthly}/mo flat.`,
  alternates: { canonical: "/compare/chatgpt" },
};

export default function Page() {
  return <AiCompare ai={{ name: "ChatGPT", plan: "ChatGPT plans from about $20/mo (higher tiers for heavy use)", data: "Reports you upload, or connected apps where available", act: "You make the changes in Seller Central (or through connected apps where available)", makerUrl: "https://chatgpt.com", checked: "Nov 25, 2026" }} />;
}
