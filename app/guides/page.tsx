import type { Metadata } from "next";
import Link from "next/link";
import { Rocco } from "@/components/Rocco";
import { GUIDES } from "@/lib/guides";

export const metadata: Metadata = { title: "Amazon Ads Guides", description: "Plain-English Amazon PPC guides: negative keywords, ACoS, bids, keyword harvesting, bulk files, Black Friday 2026 and AI connectors.", alternates: { canonical: "/guides" } };

export default function Page() {
  return (
    <>
      <div className="split" style={{ alignItems: "center" }}>
        <div>
          <span className="eyebrow">Rocco&apos;s field notes</span>
          <h1>Amazon ads, explained without the fluff</h1>
          <p className="muted" style={{ fontSize: 18 }}>Short, practical guides. Every one ends with a tool that does it for you.</p>
        </div>
        <div style={{ justifySelf: "center" }}><Rocco pose="judge" size={170} /></div>
      </div>
      <div className="guide-list" style={{ marginTop: 24 }}>
        {GUIDES.map((g) => (
          <Link className="card" href={`/guides/${g.slug}`} key={g.slug}>
            <h3>{g.title}</h3>
            <p className="muted">{g.description}</p>
            <span className="more">Read →</span>
          </Link>
        ))}
      </div>
    </>
  );
}
