import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getStore } from "@/lib/store";
import { unseal } from "@/lib/vault";
import { loadWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your Rocco", robots: { index: false, follow: false } };

/** "Your Rocco" in the nav (and the return from Amazon): open this browser's team page, else sign in. */
export default async function Page({ searchParams }: { searchParams: Promise<{ amazon?: string }> }) {
  const sp = await searchParams;
  const token = unseal((await cookies()).get("rocco_team")?.value);
  const store = getStore();
  const amazon = sp.amazon && /^[\w%-]{1,80}$/.test(sp.amazon) ? `?amazon=${sp.amazon}` : "";
  if (token && store && (await loadWorkspace(store, token))) redirect(`/w/${token}${amazon}`);
  redirect("/api/auth/google?intent=signin");
}
