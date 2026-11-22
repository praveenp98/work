import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { prog, tapState } from "../anim";
import { SAMPLE } from "../config";
import { ChangeLog, DEFAULT_ROWS, LOG_WIDTH } from "../ui/ChangeLog";
import type { Tap } from "../ui/Cursor";
import { JOB_WIDTH, JobCard } from "../ui/JobCard";
import { APPROVE_WIDTH, ApproveRow, MORNING_WIDTH, MorningCard } from "../ui/MorningCard";
import { PRICING_WIDTH, PricingCard } from "../ui/PricingCard";
import { SKIP_WIDTH, SkipReasons } from "../ui/SkipReasons";
import { Tidy, TIDY_WIDTH } from "../ui/Tidy";
import { VisualScene, type HeadingProps } from "./frame";

export type UiPiece = "morning" | "job" | "approve" | "tidy" | "changelog-row" | "skip" | "before-rocco" | "pricing";
export const UI_PIECES: UiPiece[] = ["morning", "job", "approve", "tidy", "changelog-row", "skip", "before-rocco", "pricing"];

export interface UiSceneProps extends HeadingProps {
  piece: UiPiece;
  /** Show the touch dot travelling to the button. The button still gets tapped when this is off. */
  cursor?: boolean;
  /** false freezes the piece in its first state (no tap, no state change). */
  interact?: boolean;
  /** changelog-row: which row of the sample log (0 to 3). job / approve: which sample job (0 to 2). */
  index?: number;
}

/** Every piece except the pricing card shows the sample account, so every one of them gets the chip. */
const SAMPLE_PIECES: Record<UiPiece, boolean> = { morning: true, job: true, approve: true, tidy: true, "changelog-row": true, skip: true, "before-rocco": true, pricing: false };

/** Scene 2. A real piece of Rocco's UI, with the site's CSS, an optional touch dot and a tap. */
export const UiScene: React.FC<UiSceneProps> = ({ piece, cursor = true, interact = true, index = 0, kicker, title, blueLine, headingIn }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames: d } = useVideoConfig();
  const at = (k: number) => (interact ? Math.round(d * k) : undefined);
  let taps: Tap[] = [], width = 480, node: React.ReactNode = null;

  if (piece === "morning") {
    const t = [at(0.26), at(0.48), at(0.7)];
    taps = t.flatMap((f, i) => (f === undefined ? [] : [{ target: `job-${i}`, at: f }]));
    width = MORNING_WIDTH;
    node = <MorningCard states={t.map((f) => tapState(frame, f, fps, 0.5))} />;
  } else if (piece === "job") {
    const f = at(0.4);
    if (f !== undefined) taps = [{ target: "approve", at: f }];
    width = JOB_WIDTH;
    node = <JobCard state={tapState(frame, f, fps)} job={index} />;
  } else if (piece === "approve") {
    const f = at(0.36);
    if (f !== undefined) taps = [{ target: "job-0", at: f }];
    width = APPROVE_WIDTH;
    node = <ApproveRow state={tapState(frame, f, fps)} job={index} />;
  } else if (piece === "tidy") {
    const f = at(0.56);
    if (f !== undefined) taps = [{ target: "tidy", at: f }];
    width = TIDY_WIDTH;
    const n = SAMPLE.tidy.rows.length;
    const renamed = interact ? Array.from({ length: n }, (_, i) => prog(frame, d * 0.1 + (i / n) * d * 0.34, 9)).reduce((a, b) => a + b, 0) : n;
    node = <Tidy renamed={renamed} state={tapState(frame, f, fps)} />;
  } else if (piece === "changelog-row") {
    const row = DEFAULT_ROWS[Math.min(index, DEFAULT_ROWS.length - 1)];
    width = LOG_WIDTH;
    node = <ChangeLog rows={[row]} shown={[1]} flipped={[interact ? prog(frame, d * 0.45, 10) : 0]} past={false} />;
  } else if (piece === "skip") {
    const f = at(0.34);
    if (f !== undefined) taps = [{ target: "skip", at: f }];
    width = SKIP_WIDTH;
    node = <SkipReasons picked={f === undefined ? true : frame >= f} noted={f === undefined ? 1 : prog(frame, f + 8, 9)} />;
  } else if (piece === "before-rocco") {
    width = LOG_WIDTH;
    node = <ChangeLog rows={[]} shown={[]} flipped={[]} pastShown={prog(frame, 8, 10)} />;
  } else if (piece === "pricing") {
    const f = at(0.6);
    if (f !== undefined) taps = [{ target: "cta", at: f }];
    width = PRICING_WIDTH;
    node = <PricingCard pressed={f !== undefined && frame >= f - 1 && frame < f + 4} />;
  } else {
    throw new Error(`UiScene: unknown piece "${piece}". Use one of: ${UI_PIECES.join(", ")}`);
  }

  return (
    <VisualScene kicker={kicker} title={title} blueLine={blueLine} headingIn={headingIn} sample={SAMPLE_PIECES[piece]} width={width} taps={cursor ? taps : []}>
      {node}
    </VisualScene>
  );
};
