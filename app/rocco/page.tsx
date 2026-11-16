import type { Metadata } from "next";
import Link from "next/link";
import { Rocco } from "@/components/Rocco";

export const metadata: Metadata = { title: "Meet Rocco", description: "Rocco is a blunt, loyal raccoon who digs through your Amazon ads and finds the money. Here's how he works.", alternates: { canonical: "/rocco" } };

const POSES = [
  { pose: "hero" as const, name: "The Dig", line: "I go through every search term. Every. Single. One." },
  { pose: "judge" as const, name: "The Look", line: "52% ACoS? On a keyword you don't even sell? Interesting choice." },
  { pose: "party" as const, name: "The Find", line: "Found $481 a month. You can thank me in snacks." },
  { pose: "wave" as const, name: "The Monday Brief", line: "Morning. Here's what leaked this week and how to plug it." },
];

export default function Page() {
  return (
    <>
      <span className="eyebrow">Meet the raccoon</span>
      <h1>Rocco works the night shift.</h1>
      <p className="muted" style={{ fontSize: 19, maxWidth: 680 }}>Raccoons dig through what everyone else throws away and come back with something valuable. Rocco does that with your search term report. He&apos;s blunt, he&apos;s funny, and he&apos;s always on your side.</p>
      <div className="grid" style={{ marginTop: 28 }}>
        {POSES.map((p) => (
          <div className="card lift" key={p.pose} style={{ textAlign: "center" }}>
            <Rocco pose={p.pose} size={190} />
            <h3 style={{ marginTop: 8 }}>{p.name}</h3>
            <p className="muted">&ldquo;{p.line}&rdquo;</p>
          </div>
        ))}
      </div>
      <section className="prose">
        <h2>Rocco&apos;s rules</h2>
        <ul>
          <li><b>Never touches your account.</b> He hands you the fixes. You decide.</li>
          <li><b>Never panics.</b> Bid moves are capped at ±20% per step.</li>
          <li><b>Never keeps your file.</b> Reports are read in your browser and forgotten.</li>
          <li><b>Never sugarcoats.</b> If a keyword is a donation, he&apos;ll say so.</li>
        </ul>
        <p><Link className="btn" href="/tools/ad-roast?utm_source=rocco&utm_medium=page">Let Rocco roast my ads →</Link></p>
      </section>
    </>
  );
}
