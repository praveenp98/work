import { RoccoHead } from "./Rocco";

/** Small Rocco head for logos, buttons and inline use. */
export function Raccoon({ size = 32, mood = "happy" }: { size?: number; mood?: "happy" | "judging" | "wow" }) {
  const m = mood === "judging" ? "judge" : mood === "wow" ? "wow" : "smirk";
  return (
    <svg width={size} height={Math.round(size * (140 / 170))} viewBox="15 5 170 140" role="img" aria-label="Rocco the raccoon">
      <RoccoHead mood={m} id={`mini-${m}`} />
    </svg>
  );
}
