import type { Metadata } from "next";
import Link from "next/link";
import { CHECKED, COMPETITORS } from "@/lib/compare";
import { PRICE } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Rocco vs Amazon PPC tools and agencies: every comparison",
  description: `How Rocco (${PRICE.annual}/yr flat) compares with Dr. PPC, Helium 10 Ads, Teikametrics, Perpetua, Scale Insights, Ad Badger, BidX, Quartile, agencies and Amazon's free tools.`,
  alternates: { canonical: "/compare" },
};

const short = (name: string) => name.replace(/ \(.*\)$/, "");

export default function Page() {
  const all = [{ slug: "dr-ppc", name: "Dr. PPC", price: "$299/mo + 2% of ad spend", model: "Subscription + % of ad spend" }, ...COMPETITORS];
  return (
    <section className="pr cmp">
      <header className="pr-head">
        <span className="h5-kicker">Compare</span>
        <h1>Rocco vs everything else.</h1>
        <p className="pr-sub">Most Amazon ad tools charge more as you spend more. Rocco is {PRICE.annual} a year, flat, for ads and Seller Central. Here&apos;s how it stacks up, honestly.</p>
      </header>
      <section className="pr-sec">
        <div className="cmp-wrap">
          <table className="cmp-t">
            <thead><tr><th>Rocco vs</th><th>Their price</th><th>How they charge</th></tr></thead>
            <tbody>
              {all.map((c) => <tr key={c.slug}><th scope="row"><Link href={`/compare/${c.slug}`}>{short(c.name).replace(/^an /, "An ")}</Link></th><td>{c.price}</td><td>{c.model}</td></tr>)}
              <tr><th scope="row"><b>Rocco</b></th><td><b>{PRICE.annual}/yr or {PRICE.monthly}/mo</b></td><td><b>Flat. Same at any ad spend</b></td></tr>
            </tbody>
          </table>
        </div>
        <p className="fine">Public prices and listings, checked {CHECKED}. Most vendors don&apos;t publish exact prices; each page says where its numbers came from.</p>
      </section>
    </section>
  );
}
