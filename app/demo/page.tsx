import type { Metadata } from "next";
import Link from "next/link";
import { DemoApp } from "@/components/demo/DemoApp";
import { DemoVideo } from "@/components/demo/DemoVideo";
import { PRICE } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Demo: Rocco on a demo Amazon account (2 minutes)",
  description: "Click through Rocco on a demo Amazon account: today's jobs approved in one tap, search terms, change log with results, autonomy ladder, budget alerts and restock plans. Or watch the 2-minute tour.",
  alternates: { canonical: "/demo" },
};

export default function Page() {
  return (
    <section className="pr dmp">
      <header className="pr-head">
        <span className="h5-kicker">Demo account · made-up brand and numbers</span>
        <h1>See me run an Amazon account.</h1>
        <p className="pr-sub">Watch the 2-minute tour, or click around yourself. This is the same screen your team gets every morning.</p>
        <DemoVideo />
      </header>
      <DemoApp />
      <div className="dmp-cta">
        <p><b>Ready for your own account?</b> {PRICE.annual} a year or {PRICE.monthly} a month, flat. {PRICE.tryIt}</p>
        <Link className="btn" href="/pricing">Hire Rocco →</Link>
      </div>
    </section>
  );
}
