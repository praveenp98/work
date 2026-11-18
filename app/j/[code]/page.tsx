import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RoccoHead } from "@/components/Rocco";
import { TextLink } from "@/components/home/TextLink";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Join your team's Rocco",
  description: "Your team's AI Amazon manager. Tap to join: morning numbers and approvals by text.",
  robots: { index: false, follow: false },
  openGraph: { title: "Join your team's Rocco 🦝", description: "Morning Amazon numbers and approvals by text, for the whole team.", images: ["/og.png"] },
};

/**
 * Invite link Rocco texts or posts (rocco.works/j/CODE). Link previews (Apple, Slack) only ever see this page,
 * never a LoopMessage link; the opt-in link is made when the teammate taps.
 */
export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const code = (await params).code.toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) notFound();
  const store = getStore();
  const ws = store ? await store.findWorkspaceByLinkCode(code) : null;
  if (!ws) notFound();
  return (
    <section className="start-page">
      <div className="hello-avatar"><svg width="112" height="92" viewBox="15 5 170 140" aria-hidden><RoccoHead mood="smirk" id="join" /></svg><span className="online" aria-hidden /></div>
      <h1>Join your team&apos;s Rocco.</h1>
      <p className="hello-lede">{ws.about ? `${ws.about.slice(0, 80)}. ` : ""}Tap, then send the message. You&apos;ll get the morning numbers and can approve fixes with a reply.</p>
      <TextLink join={code}>💬 Join on iMessage</TextLink>
      <p className="fine">iPhone works best. Already have Slack with Rocco? Just mention @Rocco there.</p>
    </section>
  );
}
