import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { prog } from "../anim";
import { SAMPLE, usesSample } from "../config";
import { Phone, PHONE_WIDTH, type ChatStyle, type Msg } from "../ui/Phone";
import { VisualScene, type HeadingProps } from "./frame";

export interface PhoneTextSceneProps extends HeadingProps {
  /** Which generic chat look. No app logos or names are drawn. */
  style?: ChatStyle;
  /** Defaults to the thread on the homepage (sample account). */
  messages?: Msg[];
  time?: string;
}

/** Scene 3. A phone with a thread: typing dots, then each bubble. */
export const PhoneTextScene: React.FC<PhoneTextSceneProps> = ({ style = "imessage", messages = SAMPLE.messages as unknown as Msg[], time, kicker, title, blueLine, headingIn }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const lead = 8, slot = (durationInFrames * 0.8 - lead) / messages.length;
  const views = messages.map((m, i) => {
    const t0 = lead + i * slot;
    const typeFor = m.from === "rocco" ? Math.min(slot * 0.55, fps * 0.9) : Math.min(slot * 0.25, fps * 0.3);
    const typing = m.from === "rocco" && frame >= t0 && frame < t0 + typeFor;
    return { ...m, typing, shown: m.from === "rocco" ? prog(frame, t0, 6) : prog(frame, t0 + typeFor, 6) };
  });
  // Any dollar figure or the sample brand in a thread means the chip is on. It cannot be switched off.
  const sample = messages.some((m) => usesSample(m.text) || /\$\s?\d/.test(m.text));
  return (
    <VisualScene kicker={kicker} title={title} blueLine={blueLine} headingIn={headingIn} sample={sample} width={PHONE_WIDTH}>
      <Phone look={style} messages={views} clock={frame / fps} time={time} />
    </VisualScene>
  );
};
