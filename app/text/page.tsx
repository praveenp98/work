import type { Metadata } from "next";
import { RoccoHead } from "@/components/Rocco";
import { TextLink } from "@/components/home/TextLink";
import { TextRoccoButton } from "@/components/home/TextRoccoButton";

export const metadata: Metadata = { title: "Text Rocco", robots: { index: false, follow: false } };

/** One button. The iMessage link is made only when you tap it. */
export default async function Page({ searchParams }: { searchParams: Promise<{ join?: string; closed?: string }> }) {
  const sp = await searchParams;
  const join = sp.join && /^[A-Za-z0-9]{6}$/.test(sp.join) ? sp.join.toUpperCase() : undefined;
  return (
    <section className="start-page">
      <div className="hello-avatar"><svg width="112" height="92" viewBox="15 5 170 140" aria-hidden><RoccoHead mood="smirk" id="txt" /></svg><span className="online" aria-hidden /></div>
      <h1>{join ? "Join your team's Rocco." : "Text Rocco."}</h1>
      <p className="hello-lede">{join ? "Tap, then send the message. Your phone joins your team's Rocco: morning numbers and approvals by reply." : "Tap, then send the message. I'll take it from there."}</p>
      {sp.closed ? <TextRoccoButton /> : <TextLink join={join}>💬 Text Rocco</TextLink>}
      <p className="fine">iPhone works best (iMessage). Not affiliated with Amazon.</p>
    </section>
  );
}
