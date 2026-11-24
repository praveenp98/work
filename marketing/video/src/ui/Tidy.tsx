import React from "react";
import type { TapState } from "../anim";
import { SAMPLE } from "../config";
import { TIDY } from "./siteCopy";

/**
 * Tidy campaigns: markup and classes from components/dash/TidyClient.tsx (.td-*). `renamed` is how many rows
 * already show their new name (0 to rows.length, fractional = the row fading in). Tap target: tidy.
 */
export const TIDY_WIDTH = 600;
const R = SAMPLE.tidy.rows;

export const Tidy: React.FC<{ renamed: number; state: TapState }> = ({ renamed, state }) => (
  <div className="td-wrap">
    <h1 style={{ fontSize: 40 }}>{TIDY.title}</h1>
    <p className="td-lede" style={{ maxWidth: "none" }}>One naming system: <code>{SAMPLE.tidy.system}</code>, and one portfolio per product.</p>
    <div className="td-groups">
      <div className="td-group">
        <div className="td-g-sum" style={{ display: "flex", flexWrap: "wrap", gap: "8px 12px", alignItems: "center", padding: "14px 16px" }}>
          <input type="checkbox" checked readOnly style={{ accentColor: "var(--accent)", width: 16, height: 16 }} />
          <b style={{ fontSize: 16 }}>{SAMPLE.tidy.product}</b>
          <span className="td-g-meta">{R.length} campaigns</span>
        </div>
        <ul className="td-rows">
          {R.map((r, i) => {
            const k = Math.max(0, Math.min(1, renamed - i));
            return (
              <li key={r.old}>
                <span className="td-old" style={{ textDecorationLine: k > 0.5 ? "line-through" : "none" }}>{r.old}</span>
                <span className="td-arrow" aria-hidden style={{ opacity: k }}>→</span>
                <span className="td-new" style={{ opacity: k, transform: `translateX(${(1 - k) * -10}px)` }}>{r.next}</span>
                <span className={`td-tag t-${r.tagClass}`} style={{ opacity: k }}>{r.tag}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
    {state === "done" ? (
      <div className="td-done">
        <p><span className="rd-tick" aria-hidden>✓</span> <b>Tidied.</b> {R.length} renamed · 1 portfolio. {TIDY.doneTail}</p>
        <span className="btn ghost small">Undo</span>
      </div>
    ) : (
      <div className="td-apply">
        <span className="btn" data-tap="tidy" style={state === "press" ? { transform: "scale(.94)" } : state === "making" ? { opacity: 0.6 } : undefined}>{state === "making" ? TIDY.busy : TIDY.button}</span>
        <p className="fine" style={{ margin: 0 }}>{TIDY.fine}</p>
      </div>
    )}
  </div>
);
