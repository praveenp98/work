import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { prog } from "../anim";
import { SAMPLE, usesSample } from "../config";
import { ChangeLog, DEFAULT_ROWS, LOG_WIDTH, type LogRow } from "../ui/ChangeLog";
import { VisualScene, type HeadingProps } from "./frame";

export interface ChangeLogSceneProps extends HeadingProps {
  /** Defaults to the homepage change log (sample account). A row with `done` flips from `wait` to `done`. */
  rows?: LogRow[];
  /** The "Before Rocco" note under the rows. false hides it. */
  beforeRocco?: string | false;
}

/** Scene 4. Rows slide in, then flip from "⏳ checking" to "✅ worked" or "↩️ reverted", then the Before Rocco note. */
export const ChangeLogScene: React.FC<ChangeLogSceneProps> = ({ rows = DEFAULT_ROWS, beforeRocco = SAMPLE.beforeRocco, kicker, title, blueLine, headingIn }) => {
  const frame = useCurrentFrame();
  const { durationInFrames: d } = useVideoConfig();
  const inSpan = d * 0.32, flipAt = d * 0.42, flipSpan = d * 0.22;
  const flips = rows.map((r, i) => (r.done ? i : -1)).filter((i) => i >= 0);
  const shown = rows.map((_, i) => prog(frame, 6 + (i / rows.length) * inSpan, 10));
  const flipped = rows.map((_, i) => prog(frame, flipAt + (Math.max(0, flips.indexOf(i)) / Math.max(1, flips.length)) * flipSpan, 10));
  const sample = usesSample(JSON.stringify(rows) + (beforeRocco || "")) || rows === DEFAULT_ROWS || beforeRocco === SAMPLE.beforeRocco;
  return (
    <VisualScene kicker={kicker} title={title} blueLine={blueLine} headingIn={headingIn} sample={sample} width={LOG_WIDTH}>
      <ChangeLog rows={rows} shown={shown} flipped={flipped} past={beforeRocco} pastShown={prog(frame, d * 0.7, 10)} headRight={sample ? undefined : ""} />
    </VisualScene>
  );
};
