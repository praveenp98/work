"use client";
import type { RoastResult } from "@/lib/rules/roast";
import { download } from "@/lib/readTable";

const GRADE_COLORS: Record<string, string> = { A: "#2f7d5b", B: "#5b8c3a", C: "#b7871a", D: "#c2611f", F: "#b42318" };

function drawCard(r: RoastResult): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 1200; c.height = 630;
  const g = c.getContext("2d")!;
  g.fillStyle = "#faf8f4"; g.fillRect(0, 0, 1200, 630);
  g.fillStyle = GRADE_COLORS[r.grade]; roundRect(g, 70, 90, 220, 220, 40); g.fill();
  g.fillStyle = "#fff"; g.font = "800 150px system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(r.grade, 180, 205);
  g.textAlign = "left"; g.textBaseline = "alphabetic";
  g.fillStyle = "#5d636b"; g.font = "600 30px system-ui, sans-serif"; g.fillText("My Amazon ads Leak Score", 340, 130);
  g.fillStyle = "#1d1f22"; g.font = "800 76px system-ui, sans-serif";
  g.fillText(`${r.currency}${Math.round(r.leakMonthly).toLocaleString("en-US")}/mo`, 340, 220);
  g.font = "600 34px system-ui, sans-serif"; g.fillText(`leaking (${Math.round(r.leakPct * 100)}% of ad spend)`, 340, 275);
  const line = r.leaks[0]?.line ?? r.headline;
  g.fillStyle = "#1d1f22"; g.font = "italic 30px system-ui, sans-serif";
  wrap(g, `Rocco: “${line}”`, 70, 400, 1060, 42, 3);
  g.fillStyle = "#2f7d5b"; g.font = "700 32px system-ui, sans-serif"; g.fillText("Roast yours free → rocco.works", 70, 580);
  return c;
}
function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
function wrap(g: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, lh: number, lines: number) {
  const words = text.split(" "); let line = ""; let n = 0;
  for (const w of words) {
    const t = line ? line + " " + w : w;
    if (g.measureText(t).width > max && line) { g.fillText(line, x, y + n * lh); n++; line = w; if (n >= lines) return; }
    else line = t;
  }
  if (n < lines) g.fillText(line, x, y + n * lh);
}

export function ShareCard({ r }: { r: RoastResult }) {
  const text = `Rocco roasted my Amazon ads: grade ${r.grade}, ${r.currency}${Math.round(r.leakMonthly).toLocaleString("en-US")}/month leaking. Roast yours free:`;
  const url = "https://rocco.works/tools/ad-roast?utm_source=x&utm_medium=share&utm_campaign=roast_card";
  return (
    <div className="row" style={{ marginTop: 12 }}>
      <button className="btn ghost small" onClick={() => drawCard(r).toBlob((b) => b && download("rocco-roast.png", b, "image/png"))}>Download share card</button>
      <a className="btn ghost small" target="_blank" rel="noopener" href={`https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}>Post on X</a>
      <a className="btn ghost small" target="_blank" rel="noopener" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url.replace("utm_source=x", "utm_source=linkedin"))}`}>Share on LinkedIn</a>
    </div>
  );
}
