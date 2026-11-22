import type { ChangeLogSceneProps } from "./scenes/ChangeLogScene";
import type { CompareSceneProps } from "./scenes/CompareScene";
import type { EndCardProps } from "./scenes/EndCard";
import type { FootageSceneProps } from "./scenes/FootageScene";
import type { HookCardProps } from "./scenes/HookCard";
import type { PhoneTextSceneProps } from "./scenes/PhoneTextScene";
import type { StatSceneProps } from "./scenes/StatScene";
import type { UiSceneProps } from "./scenes/UiScene";
import type { Cue, Word } from "./captions";
import type { Layout } from "./layout";

/** One entry in a spec's "scenes" list. `duration` is in seconds. `caption` is what is said (or read) during it. */
interface Base { duration: number; caption?: string }
export type SceneSpec =
  | (Base & { type: "hook"; props: HookCardProps })
  | (Base & { type: "ui"; props: UiSceneProps })
  | (Base & { type: "phone"; props?: PhoneTextSceneProps })
  | (Base & { type: "changelog"; props?: ChangeLogSceneProps })
  | (Base & { type: "compare"; props?: CompareSceneProps })
  | (Base & { type: "stat"; props: StatSceneProps })
  | (Base & { type: "footage"; props: FootageSceneProps })
  | (Base & { type: "end"; props: EndCardProps });

export const SCENE_TYPES = ["hook", "ui", "phone", "changelog", "compare", "stat", "footage", "end"] as const;

export interface VideoSpec {
  /** Used in file names: marketing/out/video/<id>-<format>.mp4 */
  id: string;
  fps?: number;
  scenes: SceneSpec[];
  /** Captions from a file (captions/x.srt or captions/x.json) instead of the per-scene `caption` lines. */
  captions?: { src: string };
  /** A royalty-free track in marketing/video/music/. Nothing is bundled. */
  music?: { src: string; volume?: number };
  /** Which moment becomes the poster PNG. Default: 1 second into the first scene. */
  poster?: { scene?: number; at?: number };
}

/** Filled in by calculateMetadata (studio) or the render script: things only known once files are looked at. */
export interface Resolved { missing: string[]; cues?: Cue[]; words?: Word[]; musicOk?: boolean }
// A type alias (not an interface) so Remotion accepts it as composition props.
export type VideoProps = { spec: VideoSpec; layout: Layout; resolved?: Resolved };

export const FPS = 30;
export const fpsOf = (spec: VideoSpec) => spec.fps ?? FPS;
export const sceneFrames = (spec: VideoSpec) => spec.scenes.map((s) => Math.max(1, Math.round(s.duration * fpsOf(spec))));
export const totalFrames = (spec: VideoSpec) => sceneFrames(spec).reduce((a, b) => a + b, 0);
