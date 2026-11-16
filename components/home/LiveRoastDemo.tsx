"use client";
import { useEffect, useState } from "react";
import { RoccoHead } from "../Rocco";

type Verdict = "cut" | "harvest" | "lower" | "keep";
const TERMS: { term: string; clicks: number; spend: number; orders: number; v: Verdict; note: string; found: number }[] = [
  { term: "bamboo cutting board", clicks: 212, spend: 237, orders: 45, v: "keep", note: "18% ACoS. Chef’s kiss.", found: 0 },
  { term: "free cutting board", clicks: 31, spend: 30, orders: 0, v: "cut", note: "They wanted it free. You paid.", found: 30 },
  { term: "charcuterie board large", clicks: 96, spend: 126, orders: 30, v: "harvest", note: "Winner hiding in auto. Promote it.", found: 0 },
  { term: "plastic cutting board dishwasher safe", clicks: 64, spend: 91, orders: 0, v: "cut", note: "You sell bamboo. Read the room.", found: 91 },
  { term: "cutting board", clicks: 180, spend: 279, orders: 18, v: "lower", note: "52% ACoS. Bid down 20%.", found: 117 },
  { term: "how to clean cutting board", clicks: 22, spend: 26, orders: 0, v: "cut", note: "They wanted a sponge.", found: 26 },
  { term: "large bamboo board for kitchen", clicks: 58, spend: 70, orders: 15, v: "harvest", note: "16% ACoS. Give it its own keyword.", found: 0 },
];
const LABEL: Record<Verdict, string> = { cut: "CUT", harvest: "HARVEST", lower: "BID DOWN", keep: "KEEP" };

/** Self-playing demo: Rocco stamps a verdict on each search term while the "found" counter climbs. */
export function LiveRoastDemo() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setStep(TERMS.length); return; }
    const t = setInterval(() => setStep((s) => (s >= TERMS.length + 3 ? 0 : s + 1)), 1100);
    return () => clearInterval(t);
  }, []);
  const n = Math.min(step, TERMS.length);
  const found = TERMS.slice(0, n).reduce((a, t) => a + t.found, 0);
  return (
    <div className="demo">
      <div className="demo-head">
        <svg width="44" height="36" viewBox="15 5 170 140" aria-hidden><RoccoHead mood={n >= TERMS.length ? "wow" : "judge"} id="demo" /></svg>
        <div className="demo-title">
          <b>Rocco is roasting a sample account</b>
          <span className="fine">{n} of {TERMS.length} search terms judged</span>
        </div>
        <div className="demo-found">
          <span className="fine">Leak found</span>
          <b>${found.toLocaleString("en-US")}</b>
        </div>
      </div>
      <ul className="demo-list">
        {TERMS.map((t, i) => (
          <li key={t.term} className={i < step ? `judged v-${t.v}` : i === step ? "judging" : ""}>
            <div className="demo-term">
              <span>{t.term}</span>
              <span className="fine">{t.clicks} clicks · ${t.spend} · {t.orders} orders</span>
            </div>
            {i < step && (
              <div className="demo-verdict">
                <span className={`stamp s-${t.v}`}>{LABEL[t.v]}</span>
                <span className="fine demo-note">{t.note}</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
