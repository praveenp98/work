import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SellArticle } from "@/components/sell/SellArticle";
import { SELL, sellBySlug } from "@/lib/sell-data";
import { SELL_PUBLISHED } from "@/lib/sell";

export const dynamicParams = false;
export const generateStaticParams = () => SELL.filter((g) => g.slug !== "index").map((g) => ({ market: g.slug }));

export async function generateMetadata({ params }: { params: Promise<{ market: string }> }): Promise<Metadata> {
  const g = sellBySlug((await params).market);
  if (!g) return {};
  return { title: g.title, description: g.description, alternates: { canonical: `/sell-on-amazon/${g.slug}` }, openGraph: { type: "article", title: g.title, description: g.description, modifiedTime: g.updated } };
}

export default async function Page({ params }: { params: Promise<{ market: string }> }) {
  const g = sellBySlug((await params).market);
  if (!SELL_PUBLISHED || !g || g.slug === "index") notFound();
  const others = SELL.filter((x) => x.slug !== "index" && x.slug !== g.slug).map((x) => ({ slug: x.slug, flag: x.flag, country: x.country }));
  return <SellArticle g={g} path={`/sell-on-amazon/${g.slug}`} others={others} />;
}
