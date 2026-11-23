import React from "react";
import { SAMPLE } from "../../config/sample";

/** What a tappable button shows: the site's Approve, then "Making…", then "✓ Done". */
export type TapState = "open" | "press" | "making" | "done";

/**
 * Signature element: the morning-list card. A port of components/home/HeroDashboard.tsx (the homepage hero
 * dashboard) with the same markup, classes and copy; job states are passed in instead of running on a timer.
 * Uses the site's class names, so it needs the site's CSS on the page (see README.md here). Always shows the
 * sample account: put a SampleChip next to it. Tap targets: job-0, job-1, job-2.
 */
export const MORNING_WIDTH = 560;
const M = SAMPLE.morning;
const AUTO = M.jobs.filter((j) => j.making);
const MANUAL = M.jobs.filter((j) => !j.making);

export const MorningCard: React.FC<{ states?: TapState[] }> = ({ states = [] }) => {
  const done = AUTO.filter((_, i) => states[i] === "done").length;
  return (
    <div className="hd" aria-label="Sample of Rocco's dashboard">
      <div className="hd-chrome" aria-hidden><span /><span /><span /><em>rocco.works</em></div>
      <div className="hd-body">
        <div className="hd-acct"><i /> <b>{SAMPLE.brand} · {SAMPLE.marketplace}</b><small>checked {M.checkedAt}</small></div>
        <p className="hd-kicker">Good morning</p>
        <h3 className="hd-h">{M.jobsCount} jobs today, worth <em>~${M.worthMonthly.toLocaleString("en-US")}/mo</em>.</h3>
        <p className="hd-brief">{M.brief}</p>
        <div className="hd-roi"><span>Rocco has saved you</span><b>${SAMPLE.roi.saved.toLocaleString("en-US")}</b><em>{SAMPLE.roi.timesCost}× what I cost</em></div>
        <ul className="hd-list">
          {AUTO.map((j, i) => {
            const s = states[i] ?? "open";
            return (
              <li key={j.title} className={`hd-fix s-${s}`}>
                <span className="hd-ic" aria-hidden>{j.icon}</span>
                <div className="hd-main">
                  <b>{j.title}{j.pick && <span className="hd-pick">Rocco&apos;s pick</span>}</b>
                  <small>{j.detail}</small>
                </div>
                <span className="hd-v">{j.value}</span>
                <span className="hd-btn" data-tap={`job-${i}`}>{s === "done" ? j.done : s === "making" ? j.making : j.button}</span>
              </li>
            );
          })}
          {MANUAL.map((j) => (
            <li key={j.title} className="hd-fix s-open hd-manual">
              <span className="hd-ic" aria-hidden>{j.icon}</span>
              <div className="hd-main"><b>{j.title}</b><small>{j.detail}</small></div>
              <span className="hd-btn ghost">{j.button}</span>
            </li>
          ))}
        </ul>
        <p className="hd-foot">{done ? `${done} of ${AUTO.length} jobs done in Amazon · I'll check the results next week` : M.footOpen}</p>
      </div>
    </div>
  );
};

/** One job row from the same card, on its own: the "approve button" close-up. Tap target: job-0. */
export const APPROVE_WIDTH = 620;
export const ApproveRow: React.FC<{ state: TapState; job?: number }> = ({ state, job = 0 }) => {
  const j = AUTO[job];
  return (
    <div className="hd">
      <div className="hd-body">
        <ul className="hd-list" style={{ margin: 0 }}>
          <li className={`hd-fix s-${state}`}>
            <span className="hd-ic" aria-hidden>{j.icon}</span>
            <div className="hd-main">
              <b>{j.title}{j.pick && <span className="hd-pick">Rocco&apos;s pick</span>}</b>
              <small>{j.detail}</small>
            </div>
            <span className="hd-v">{j.value}</span>
            <span className="hd-btn" data-tap="job-0">{state === "done" ? j.done : state === "making" ? j.making : j.button}</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
