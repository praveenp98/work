import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getStore } from "@/lib/store";
import { unseal } from "@/lib/vault";
import { loadWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Welcome to Rocco", robots: { index: false, follow: false } };

/** Where Dodo sends people after starting the trial: straight to their team's Rocco page (from the sealed cookie). */
export default async function Page() {
  const token = unseal((await cookies()).get("rocco_team")?.value);
  const store = getStore();
  if (token && store && (await loadWorkspace(store, token))) redirect(`/w/${token}?welcome=1`);
  return (
    <section className="start-page">
      <h1>You&apos;re in 🎉</h1>
      <p className="hello-lede">Your trial is on. Open the Rocco link from your receipt email, or text Rocco from your iPhone to get started.</p>
      <Link className="btn" href="/text">💬 Text Rocco</Link>
    </section>
  );
}
