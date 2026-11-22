import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Thanks for hiring Rocco", robots: { index: false } };

/** Old checkout return page: everything now happens on /welcome (confirms the payment, then Connect Amazon). */
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const q = new URLSearchParams(Object.entries(sp).filter(([, v]) => typeof v === "string") as [string, string][]);
  redirect(`/welcome${q.toString() ? `?${q.toString()}` : ""}`);
}
