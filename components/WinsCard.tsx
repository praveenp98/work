"use client";
import { download } from "@/lib/readTable";

/** "Rocco saved me $X" image + X post: proof that spreads. */
export function WinsCard({ saved, worked, applied, since }: { saved: number; worked: number; applied: number; since: string }) {
  const days = Math.max(1, Math.round((Date.now() - new Date(since).getTime()) / 86400000));
  const text = saved > 0
    ? `My AI Amazon teammate Rocco: ${applied} changes, ${worked} confirmed working, $${Math.round(saved).toLocaleString("en-US")} saved in ${days} days. 🦝`
    : `Hired an AI Amazon teammate. ${applied} changes approved so far; Rocco re-checks every one. 🦝`;
  const url = "https://rocco.works/?utm_source=x&utm_medium=wins&utm_campaign=wins_card";
  function draw() {
    const c = document.createElement("canvas"); c.width = 1200; c.height = 630;
    const g = c.getContext("2d")!;
    const grad = g.createLinearGradient(0, 0, 1200, 630); grad.addColorStop(0, "#157a4b"); grad.addColorStop(1, "#1f9d63");
    g.fillStyle = grad; g.fillRect(0, 0, 1200, 630);
    g.fillStyle = "#f6c445"; g.font = "800 150px system-ui, sans-serif"; g.fillText(`$${Math.round(saved).toLocaleString("en-US")}`, 70, 250);
    g.fillStyle = "#fff"; g.font = "700 46px system-ui, sans-serif"; g.fillText(`saved by Rocco in ${days} days`, 74, 320);
    g.font = "600 36px system-ui, sans-serif"; g.fillText(`${applied} changes approved · ${worked} confirmed working`, 74, 400);
    g.font = "700 34px system-ui, sans-serif"; g.fillText("My AI Amazon teammate → rocco.works", 74, 560);
    c.toBlob((b) => b && download("rocco-wins.png", b, "image/png"));
  }
  return (
    <div className="row" style={{ gap: 8 }}>
      <button className="btn small" onClick={draw}>🏆 Download my wins card</button>
      <a className="btn ghost small" target="_blank" rel="noopener" href={`https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}>Post on X</a>
    </div>
  );
}
