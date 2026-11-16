import type { Metadata } from "next";
import Link from "next/link";
import { liveTools } from "@/lib/tools";

export const metadata: Metadata = { title: "Free Amazon Seller Tools", description: "Free Amazon ads and pricing tools from Rocco: Ad Roast (PPC audit), coupon profit calculator, breakeven ACoS calculator.", alternates: { canonical: "/tools" } };

export default function Page() {
  return (
    <>
      <h1>Free Amazon seller tools</h1>
      <p className="muted" style={{ fontSize: 18 }}>No login. Your files stay in your browser.</p>
      <div className="grid" style={{ marginTop: 18 }}>
        {liveTools().map((t) => (
          <div className="card" key={t.slug}>
            <h3>{t.name}</h3>
            <p className="muted">{t.short}</p>
            <p className="fine">Free: {t.free}</p>
            <Link className="more" href={`/tools/${t.slug}`}>Open →</Link>
          </div>
        ))}
      </div>
    </>
  );
}
