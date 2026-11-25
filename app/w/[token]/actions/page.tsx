import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionsStudio } from "@/components/dash/ActionsStudio";
import { hasAccess } from "@/lib/access";
import { acctLabel } from "@/lib/health";
import { hireUrl } from "@/lib/paywall";
import { getStore } from "@/lib/store";
import { loadWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Actions · Rocco", robots: { index: false, follow: false } };

/** Every change Rocco can make in Amazon (DataDoe Actions), and "tell Rocco what to change". */
export default async function Page({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ account?: string }> }) {
  const { token } = await params;
  const sp = await searchParams;
  const store = getStore();
  const ws = store ? await loadWorkspace(store, token) : null;
  if (!store || !ws) notFound();
  const accounts = ws.amazon?.accounts ?? [];
  const account = accounts.find((a) => a.id === sp.account) ?? accounts[0];
  const paid = hasAccess(ws);
  return (
    <section className="ps-page">
      <h1>Actions</h1>
      <p className="hello-lede">Ask for any change in plain words. Rocco works out the exact Amazon change, checks it with Amazon, shows you the before and after, and makes it when you approve.</p>
      {accounts.length > 1 && <nav className="rd-tabs" aria-label="Accounts">{accounts.map((a) => <Link key={a.id} href={`/w/${token}/actions?account=${a.id}`} className={a.id === account?.id ? "on" : ""}>{acctLabel(a)}</Link>)}</nav>}
      {!paid ? <p><a className="btn" href={hireUrl(ws)}>Hire Rocco to make changes in Amazon</a></p>
        : !account ? <p className="fine">Connect Amazon first: <Link href={`/w/${token}`}>your Rocco page</Link>.</p>
        : <ActionsStudio token={token} account={account.id} accountLabel={acctLabel(account)} />}
    </section>
  );
}
