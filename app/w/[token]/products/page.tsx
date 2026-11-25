import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductsStudio } from "@/components/dash/ProductsStudio";
import { accessOf } from "@/lib/access";
import { currencyOf } from "@/lib/currency";
import { acctLabel } from "@/lib/health";
import { hireUrl } from "@/lib/paywall";
import { getStore } from "@/lib/store";
import { loadWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Products & profit · Rocco", robots: { index: false, follow: false } };

/** What each product really makes, product costs, and listing work (keywords, issues, A+). */
export default async function Page({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ account?: string }> }) {
  const { token } = await params;
  const sp = await searchParams;
  const store = getStore();
  const ws = store ? await loadWorkspace(store, token) : null;
  if (!store || !ws) notFound();
  const accounts = ws.amazon?.accounts ?? [];
  const account = accounts.find((a) => a.id === sp.account) ?? accounts[0];
  const data = account ? ws.amazon?.products?.[account.id] : undefined;
  const paid = accessOf(ws) !== "none";
  return (
    <section className="ps-page">
      <h1>Products &amp; profit</h1>
      <p className="hello-lede">What each product really made in the last 30 days, and the listing work that helps it sell.</p>
      {accounts.length > 1 && <nav className="rd-tabs" aria-label="Accounts">{accounts.map((a) => <Link key={a.id} href={`/w/${token}/products?account=${a.id}`} className={a.id === account?.id ? "on" : ""}>{acctLabel(a)}</Link>)}</nav>}
      {!paid ? (
        <p><a className="btn" href={hireUrl(ws)}>Hire Rocco to see profit per product</a></p>
      ) : !account ? (
        <p className="fine">Connect Amazon first: <Link href={`/w/${token}`}>your Rocco page</Link>.</p>
      ) : !data?.items.length ? (
        <div className="rd-empty"><b>Profit per product fills in after the next data pull.</b><span>It needs the profit table switched on in DataDoe (Settings → Data → &ldquo;Profit by SKU &amp; Date&rdquo;). Then tap Check connection now on your Rocco page, or wait for tomorrow morning&apos;s pull.</span></div>
      ) : (
        <ProductsStudio token={token} account={{ id: account.id, name: account.name, country: account.country }} items={data.items} at={data.at} sym={currencyOf(account.country).symbol.trim()} />
      )}
    </section>
  );
}
