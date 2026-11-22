import React from "react";
import type { TapState } from "../anim";
import { SAMPLE } from "../config";
import { JOB } from "./siteCopy";

/**
 * The product's real job card (JobCard in components/dash/JobCards.tsx, classes .tw-*), fed with the sample
 * account's first job. Tap target: approve.
 */
export const JOB_WIDTH = 600;
export const JobCard: React.FC<{ state: TapState; job?: number }> = ({ state, job = 0 }) => {
  const j = SAMPLE.morning.jobs[job];
  const applied = state === "done";
  return (
    <div className="tw">
      <div className="tw-head"><h2>{JOB.head}</h2></div>
      <ul className="tw-list">
        <li className={`tw-job${applied ? " is-applied" : " is-first"}`}>
          <div className="tw-top">
            <span className="tw-ic" aria-hidden>{j.icon}</span>
            <div className="tw-txt">
              <div className="tw-title"><b>{j.title}</b>{j.pick && <span className="tw-pick">{JOB.pick}</span>}</div>
              <p className="tw-why">{j.detail}</p>
            </div>
            <span className="tw-val">~${j.amount.toLocaleString("en-US")}<small>/mo</small></span>
          </div>
          {applied ? (
            <p className="tw-done"><span className="rd-tick" aria-hidden>✓</span> Done in Amazon: {j.changes} change{j.changes === 1 ? "" : "s"}. {JOB.checkLater}</p>
          ) : (
            <div className="tw-act">
              <span className="btn" data-tap="approve" style={state === "press" ? { transform: "scale(.94)" } : state === "making" ? { opacity: 0.6 } : undefined}>{state === "making" ? JOB.making : j.button}</span>
              <span className="linkbtn muted">{JOB.skip}</span>
            </div>
          )}
        </li>
      </ul>
    </div>
  );
};
