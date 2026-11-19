import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getStore } from "@/lib/store";
import { unseal } from "@/lib/vault";
import { loadWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your Rocco", robots: { index: false, follow: false } };

/** "Your Rocco" in the nav: open this browser's team page (no welcome note), else sign in. */
export default async function Page() {
  const token = unseal((await cookies()).get("rocco_team")?.value);
  const store = getStore();
  if (token && store && (await loadWorkspace(store, token))) redirect(`/w/${token}`);
  redirect("/api/auth/google?intent=signin");
}
