import React, { useMemo } from "react";
import { AbsoluteFill, Audio, Series, staticFile } from "remotion";
import { cuesToLines, scriptToWords, toLines, type Line } from "./captions";
import "./fonts";
import "./generated/site.css";
import { AREAS, LayoutProvider } from "./layout";
import { CaptionTrack } from "./scenes/CaptionTrack";
import { ChangeLogScene } from "./scenes/ChangeLogScene";
import { CompareScene } from "./scenes/CompareScene";
import { EndCard } from "./scenes/EndCard";
import { FootageScene, MissingFiles } from "./scenes/FootageScene";
import { HookCard } from "./scenes/HookCard";
import { PhoneTextScene } from "./scenes/PhoneTextScene";
import { StatScene } from "./scenes/StatScene";
import { UiScene } from "./scenes/UiScene";
import { fpsOf, sceneFrames, type SceneSpec, type VideoProps } from "./spec";
import { expandTokens } from "./tokens";
import "./video.css";

const render = (s: SceneSpec): React.ReactNode => {
  switch (s.type) {
    case "hook": return <HookCard {...s.props} />;
    case "ui": return <UiScene {...s.props} />;
    case "phone": return <PhoneTextScene {...(s.props ?? {})} />;
    case "changelog": return <ChangeLogScene {...(s.props ?? {})} />;
    case "compare": return <CompareScene {...(s.props ?? {})} />;
    case "stat": return <StatScene {...s.props} />;
    case "footage": return <FootageScene {...s.props} />;
    case "end": return <EndCard {...s.props} />;
    default: throw new Error(`Unknown scene type "${(s as { type: string }).type}"`);
  }
};

/** The whole video: scenes in order from a JSON spec, captions always on top, music underneath if the spec names a track. */
export const Video: React.FC<VideoProps> = ({ spec: raw, layout, resolved }) => {
  const spec = useMemo(() => expandTokens(raw), [raw]);
  const fps = fpsOf(spec);
  const frames = sceneFrames(spec);
  const opts = useMemo(() => ({ maxChars: Math.round((layout === "16x9" ? 34 : 24) / (raw.captionScale ?? 1)) }), [layout, raw.captionScale]);

  const lines: Line[] = useMemo(() => {
    if (resolved?.words?.length) return toLines(resolved.words, opts);
    if (resolved?.cues?.length) return cuesToLines(resolved.cues, opts);
    let at = 0;
    return spec.scenes.flatMap((s, i) => {
      const start = at / fps, end = (at + frames[i]) / fps;
      at += frames[i];
      return s.caption ? toLines(scriptToWords(s.caption, start + 0.12, end - 0.08), opts) : [];
    });
  }, [spec, resolved, fps, frames, opts]);

  const missing = useMemo(() => new Set(resolved?.missing ?? []), [resolved]);
  const music = spec.music && resolved?.musicOk !== false && !missing.has(spec.music.src) ? spec.music : null;

  return (
    <AbsoluteFill className="rv" style={{ width: AREAS[layout].width, height: AREAS[layout].height }}>
      <LayoutProvider layout={layout}>
        <MissingFiles.Provider value={missing}>
          <Series>
            {spec.scenes.map((s, i) => <Series.Sequence key={i} durationInFrames={frames[i]} name={`${i + 1}. ${s.type}`}>{render(s)}</Series.Sequence>)}
          </Series>
          <CaptionTrack lines={lines} scale={spec.captionScale ?? 1} />
          {music && <Audio src={staticFile(music.src)} volume={music.volume ?? 0.12} loop />}
        </MissingFiles.Provider>
      </LayoutProvider>
    </AbsoluteFill>
  );
};
