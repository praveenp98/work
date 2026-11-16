/** Rocco's face. Simple, original raccoon mark (no Amazon colors or shapes). */
export function Raccoon({ size = 32, mood = "happy" }: { size?: number; mood?: "happy" | "judging" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Rocco the raccoon">
      <path d="M10 22 L14 6 L26 16 Z" fill="#6b6f76" />
      <path d="M54 22 L50 6 L38 16 Z" fill="#6b6f76" />
      <path d="M13 18 L15 10 L21 15 Z" fill="#f2d7c9" />
      <path d="M51 18 L49 10 L43 15 Z" fill="#f2d7c9" />
      <ellipse cx="32" cy="36" rx="24" ry="21" fill="#8a8f97" />
      <path d="M12 34 Q32 22 52 34 Q48 44 38 42 L32 38 L26 42 Q16 44 12 34 Z" fill="#26282c" />
      <ellipse cx="32" cy="48" rx="13" ry="9" fill="#eceae6" />
      <circle cx="23" cy="35" r="4.2" fill="#fff" />
      <circle cx="41" cy="35" r="4.2" fill="#fff" />
      {mood === "judging" ? (
        <>
          <rect x="19" y="35" width="8" height="4" fill="#26282c" />
          <rect x="37" y="35" width="8" height="4" fill="#26282c" />
          <circle cx="23" cy="34" r="1.8" fill="#111" />
          <circle cx="41" cy="34" r="1.8" fill="#111" />
        </>
      ) : (
        <>
          <circle cx="23.8" cy="35.5" r="2.2" fill="#111" />
          <circle cx="41.8" cy="35.5" r="2.2" fill="#111" />
        </>
      )}
      <ellipse cx="32" cy="45" rx="3.4" ry="2.4" fill="#111" />
      <path d="M27 50 Q32 54 37 50" stroke="#111" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}
