import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TidyClient } from "@/components/dash/TidyClient";
import { hasAccess } from "@/lib/access";
import { hireUrl } from "@/lib/paywall";
import { getStore } from "@/lib/store";
import { loadWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tidy your campaigns · Rocco", robots: { index: false, follow: false } };

/** Tidy your campaigns: one naming system, one portfolio per product, idle and mixed campaigns called out. */
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const store = getStore();
  const ws = store ? await loadWorkspace(store, token) : null;
  if (!store || !ws) notFound();
  const account = ws.amazon?.accounts?.[0];
  const saved = account ? ws.tidy?.[account.id] : undefined;
  return (
    <section className="td">
      <TidyClient token={token} account={account ? { id: account.id, name: account.name } : null} plan={saved?.plan ?? null} done={saved?.done ?? null} paid={hasAccess(ws)} hire={hireUrl(ws)} />
    </section>
  );
}
