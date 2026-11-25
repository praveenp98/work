import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageStudio } from "@/components/dash/ImageStudio";
import { hasAccess } from "@/lib/access";
import { acctLabel } from "@/lib/health";
import { higgsfieldOn } from "@/lib/higgsfield";
import { hireUrl } from "@/lib/paywall";
import { getStore } from "@/lib/store";
import { loadWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Listing images · Rocco", robots: { index: false, follow: false } };

/** Listing and A+ images made on demand (Opus plans, Higgsfield renders from the real product photo). */
export default async function Page({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ account?: string; sku?: string }> }) {
  const { token } = await params;
  const sp = await searchParams;
  const store = getStore();
  const ws = store ? await loadWorkspace(store, token) : null;
  if (!store || !ws) notFound();
  const accounts = ws.amazon?.accounts ?? [];
  const account = accounts.find((a) => a.id === sp.account) ?? accounts[0];
  const items = account ? (ws.amazon?.products?.[account.id]?.items ?? []) : [];
  const products = [...items].sort((a, b) => b.sales - a.sales).map((p) => ({ sku: p.sku, asin: p.asin, title: p.title || p.sku }));
  if (sp.sku) products.sort((a, b) => (a.sku === sp.sku ? -1 : b.sku === sp.sku ? 1 : 0));
  const paid = hasAccess(ws);
  return (
    <section className="ps-page">
      <h1>Listing &amp; A+ images</h1>
      <p className="hello-lede">Rocco plans images that sell for each product, makes them from your real product photo, and puts the ones you pick on your listing.</p>
      {accounts.length > 1 && <nav className="rd-tabs" aria-label="Accounts">{accounts.map((a) => <Link key={a.id} href={`/w/${token}/images?account=${a.id}`} className={a.id === account?.id ? "on" : ""}>{acctLabel(a)}</Link>)}</nav>}
      {!paid ? <p><a className="btn" href={hireUrl(ws)}>Hire Rocco to make listing images</a></p>
        : !higgsfieldOn() ? <div className="rd-empty"><b>Image making is switching on soon.</b><span>It needs Rocco&apos;s image engine key. Everything else works now.</span></div>
        : !account ? <p className="fine">Connect Amazon first: <Link href={`/w/${token}`}>your Rocco page</Link>.</p>
        : !products.length ? <div className="rd-empty"><b>Your products show up after the next data pull.</b><span>Then pick one here and Rocco plans its images.</span></div>
        : <ImageStudio token={token} account={account.id} products={products} />}
    </section>
  );
}
