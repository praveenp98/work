import React from "react";
import { Composition, Folder, staticFile, Still, type CalculateMetadataFunction } from "remotion";
import { parseCaptionJson, parseSrt } from "./captions";
import { AREAS, LAYOUTS } from "./layout";
import { PROFILE_IMAGES, ProfileImage, type ProfileProps } from "./profiles/ProfileImage";
import { fpsOf, totalFrames, type Resolved, type VideoProps, type VideoSpec } from "./spec";
import { Video } from "./Video";

// Every JSON file in specs/ shows up in the Studio as a folder with its three formats.
declare const require: { context(dir: string, deep: boolean, match: RegExp): { keys(): string[]; (key: string): unknown } };
const ctx = require.context("../specs", false, /\.json$/);
const SPECS: VideoSpec[] = ctx.keys().map((k) => { const m = ctx(k) as VideoSpec & { default?: VideoSpec }; return m.default ?? m; });
const demo = SPECS.find((s) => s.id === "demo") ?? SPECS[0];

const exists = async (src: string) => { try { return (await fetch(staticFile(src), { method: "HEAD" })).ok; } catch { return false; } };

/** Looks at the files a spec points to: missing footage becomes a labelled slot, missing music is skipped, caption files are read. */
async function resolve(spec: VideoSpec): Promise<Resolved> {
  const files = [...new Set(spec.scenes.flatMap((s) => (s.type === "footage" ? [s.props.src] : [])))];
  const missing = (await Promise.all(files.map(async (f) => ((await exists(f)) ? null : f)))).filter((f): f is string => f !== null);
  const out: Resolved = { missing };
  if (spec.music) out.musicOk = await exists(spec.music.src);
  if (spec.captions?.src) {
    const res = await fetch(staticFile(spec.captions.src));
    if (!res.ok) throw new Error(`Captions file not found: marketing/video/${spec.captions.src}`);
    const body = await res.text();
    if (/\.json$/i.test(spec.captions.src)) Object.assign(out, parseCaptionJson(JSON.parse(body)));
    else out.cues = parseSrt(body);
  }
  return out;
}

const calc: CalculateMetadataFunction<VideoProps> = async ({ props }) => {
  const a = AREAS[props.layout];
  return { width: a.width, height: a.height, fps: fpsOf(props.spec), durationInFrames: totalFrames(props.spec), props: { ...props, resolved: props.resolved ?? (await resolve(props.spec)) } };
};

const safeId = (s: string) => s.replace(/[^a-zA-Z0-9-]/g, "-");

export const Root: React.FC = () => (
  <>
    {/* What `npm run render` uses: the spec comes in as input props. */}
    {LAYOUTS.map((layout) => (
      <Composition key={layout} id={`Video-${layout}`} component={Video} width={AREAS[layout].width} height={AREAS[layout].height} fps={30} durationInFrames={300} defaultProps={{ spec: demo, layout }} calculateMetadata={calc} />
    ))}
    {/* Profile pictures, banners and covers for every account: stills, rendered by scripts/profiles.mjs. */}
    <Folder name="profiles">
      {PROFILE_IMAGES.map(({ file, props }) => (
        <Still key={file} id={`profile-${safeId(file.replace(/\.png$/, ""))}`} component={ProfileImage} width={props.width} height={props.height} defaultProps={props as ProfileProps} />
      ))}
    </Folder>
    {SPECS.map((spec) => (
      <Folder key={spec.id} name={safeId(spec.id)}>
        {LAYOUTS.map((layout) => (
          <Composition key={layout} id={`${safeId(spec.id)}-${layout}`} component={Video} width={AREAS[layout].width} height={AREAS[layout].height} fps={30} durationInFrames={300} defaultProps={{ spec, layout }} calculateMetadata={calc} />
        ))}
      </Folder>
    ))}
  </>
);
