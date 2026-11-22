import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { prog } from "../anim";
import { usesSample } from "../config";
import { VS_HEAD, VS_ROWS, VS_TITLE } from "../ui/siteCopy";
import { VisualScene, type HeadingProps } from "./frame";

export interface CompareSceneProps extends HeadingProps {
  /** Left column header: a category ("Amazon data tools", "PPC agencies", "Doing it yourself"). Never a named product. */
  leftTitle?: string;
  rightTitle?: string;
  /** [row label, the category, Rocco]. Defaults to the table on the homepage. */
  rows?: [string, string, string][];
}

/** Scene 5. The site's data-vs-decisions table (.vs), rows revealed one by one. */
export const CompareScene: React.FC<CompareSceneProps> = ({ leftTitle = VS_HEAD.left, rightTitle = VS_HEAD.right, rows = VS_ROWS, kicker, title = [...VS_TITLE], blueLine = 1, headingIn }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const start = 10, span = Math.max(rows.length * 6, durationInFrames * 0.6);
  return (
    <VisualScene kicker={kicker} title={title} blueLine={blueLine} headingIn={headingIn} sample={usesSample(rows.flat().join(" "))} width={640}>
      <div className="vs" role="table">
        <div className="vs-row vs-head" role="row"><span role="columnheader" /><span role="columnheader">{leftTitle}</span><span role="columnheader">{rightTitle}</span></div>
        {rows.map(([k, a, b], i) => {
          const p = prog(frame, start + (i / rows.length) * span, 9);
          return (
            <div key={k} className="vs-row" role="row">
              <span role="rowheader" style={{ opacity: p }}>{k}</span>
              <span role="cell" style={{ opacity: p }}>{a}</span>
              <span role="cell"><b style={{ display: "inline-block", opacity: p, transform: `translateX(${(1 - p) * -12}px)` }}>{b}</b></span>
            </div>
          );
        })}
      </div>
    </VisualScene>
  );
};
