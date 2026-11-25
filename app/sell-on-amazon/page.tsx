import type { Metadata } from "next";
import Link from "next/link";
import { SellArticle } from "@/components/sell/SellArticle";
import { SELL, sellBySlug } from "@/lib/sell-data";

const g = sellBySlug("index")!;
export const metadata: Metadata = { title: g.title, description: g.description, alternates: { canonical: "/sell-on-amazon" }, openGraph: { type: "article", title: g.title, description: g.description } };

/** Hub: the global picture + a card per marketplace guide. */
export default function Page() {
  const markets = SELL.filter((x) => x.slug !== "index");
  const cards = (
    <div className="sl-cards" aria-label="Pick your marketplace">
      {markets.map((m) => (
        <Link key={m.slug} className="sl-card" href={`/sell-on-amazon/${m.slug}`}>
          <span className="f" aria-hidden>{m.flag}</span><b>{m.country}</b><small>{m.marketplace} · costs, tax, compliance, first 90 days</small>
        </Link>
      ))}
    </div>
  );
  return <SellArticle g={g} path="/sell-on-amazon" others={markets.map((x) => ({ slug: x.slug, flag: x.flag, country: x.country }))} hub={cards} />;
}
