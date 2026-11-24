import React from "react";
import { SAMPLE } from "../config";
import { SKIP } from "./siteCopy";

/** The "Why skip this?" card from the homepage (.hlearn in app/page.tsx). Tap target: skip. */
export const SKIP_WIDTH = 440;
export const SkipReasons: React.FC<{ picked: boolean; noted: number }> = ({ picked, noted }) => (
  <div className="hlearn">
    <p className="hlearn-q">{SKIP.question}</p>
    <div className="hlearn-chips">{SKIP.chips.map((c, i) => <span key={c} className={picked && i === SKIP.picked ? "on" : ""} data-tap={i === SKIP.picked ? "skip" : undefined}>{c}</span>)}</div>
    <p className="hlearn-a" style={{ opacity: noted, transform: `translateY(${(1 - noted) * 8}px)` }}>{SKIP.noted}</p>
    <div className="hlearn-roi"><span>{SKIP.roiLabel}</span><b>${SAMPLE.roi.saved.toLocaleString("en-US")}</b><em>{SAMPLE.roi.timesCost}× what I cost</em></div>
  </div>
);
