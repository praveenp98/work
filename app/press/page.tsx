import type { Metadata } from "next";
import kit from "@/content/launch-kit.json";
import { CopyField } from "@/components/CopyField";
import { Rocco } from "@/components/Rocco";

export const metadata: Metadata = {
  title: "Press & launch kit",
  description: "Copy-paste descriptions, taglines, links, logos, mascot art and screenshots for Rocco, the AI Amazon teammate.",
  alternates: { canonical: "/press" },
};

export default function Page() {
  return (
    <>
      <div className="split" style={{ alignItems: "center", marginTop: 12 }}>
        <div>
          <span className="eyebrow">Press &amp; launch kit</span>
          <h1 style={{ fontSize: "clamp(34px,5vw,54px)" }}>Everything to list Rocco anywhere.</h1>
          <p className="muted" style={{ fontSize: 18 }}>Copy-paste text in every length directories ask for, plus logos, mascot art and screenshots.</p>
        </div>
        <div style={{ justifySelf: "center" }}><Rocco pose="party" size={180} /></div>
      </div>

      <section style={{ marginTop: 32 }}>
        <h2 style={{ marginTop: 0 }}>Copy</h2>
        <div className="copygrid">{kit.fields.map((f) => <CopyField key={f.id} label={f.label} text={f.text} />)}</div>
      </section>

      <section>
        <h2>Logos, mascot &amp; screenshots</h2>
        <div className="assetgrid">
          {kit.assets.map((a) => (
            <a key={a.file} href={a.file} download className="asset">
              <span className="asset-img"><img src={a.file} alt={a.label} loading="lazy" /></span>
              <span>{a.label}</span>
            </a>
          ))}
        </div>
        <p className="fine" style={{ marginTop: 10 }}>Brand color #1F9D63 (green) · accent #F6C445 (gold) · ink #13161C. Rocco is an independent tool, not affiliated with Amazon.</p>
      </section>

      <section>
        <h2>Where to list</h2>
        <div className="tablewrap">
          <table className="fixes">
            <thead><tr><th>Site</th><th>What to use</th></tr></thead>
            <tbody>{kit.directories.map((d) => <tr key={d.name}><td><a href={d.url} target="_blank" rel="noopener">{d.name}</a></td><td>{d.note}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </>
  );
}
