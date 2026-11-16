/**
 * Rocco, full character. Original flat-cartoon raccoon in a green hoodie.
 * Poses: "hero" (magnifying glass), "judge" (arms crossed, side-eye), "party" (arms up, coins), "wave".
 * Pure SVG, no external assets, scales cleanly from 40px to full-hero.
 */
export type Pose = "hero" | "judge" | "party" | "wave";

const C = {
  fur: "#9aa4b4",
  furDark: "#6e7889",
  furLight: "#eef1f5",
  mask: "#1d2330",
  ink: "#141821",
  pink: "#f3b9b5",
  hoodie: "#2f9e6b",
  hoodieDark: "#22784f",
  hoodieLight: "#45b982",
  gold: "#f6c445",
  goldDark: "#d99a16",
};

export function RoccoHead({ mood = "smirk", id = "h" }: { mood?: "smirk" | "judge" | "wow"; id?: string }) {
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-face`} cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#b3bccb" />
          <stop offset="100%" stopColor={C.fur} />
        </radialGradient>
      </defs>
      {/* ears */}
      <path d="M44 58 C38 30 48 14 62 12 C72 14 80 30 82 44 Z" fill={C.furDark} />
      <path d="M156 58 C162 30 152 14 138 12 C128 14 120 30 118 44 Z" fill={C.furDark} />
      <path d="M52 50 C50 34 55 24 62 22 C68 26 72 34 73 44 Z" fill={C.pink} />
      <path d="M148 50 C150 34 145 24 138 22 C132 26 128 34 127 44 Z" fill={C.pink} />
      {/* head with cheek fluff */}
      <path d="M100 30 C142 30 166 52 168 84 L180 92 L166 98 L174 108 L158 110 C150 128 128 140 100 140 C72 140 50 128 42 110 L26 108 L34 98 L20 92 L32 84 C34 52 58 30 100 30 Z" fill={`url(#${id}-face)`} />
      {/* forehead stripe */}
      <path d="M100 32 C94 44 93 56 96 68 L104 68 C107 56 106 44 100 32 Z" fill={C.furDark} />
      {/* brow patches */}
      <ellipse cx="74" cy="66" rx="17" ry="8" fill={C.furLight} transform="rotate(-12 74 66)" />
      <ellipse cx="126" cy="66" rx="17" ry="8" fill={C.furLight} transform="rotate(12 126 66)" />
      {/* bandit mask */}
      <path d="M28 88 C40 70 62 70 80 78 C90 82 96 86 100 90 C104 86 110 82 120 78 C138 70 160 70 172 88 C164 104 146 108 128 102 C116 98 108 98 100 104 C92 98 84 98 72 102 C54 108 36 104 28 88 Z" fill={C.mask} />
      {/* eyes */}
      {mood === "judge" ? (
        <>
          <ellipse cx="74" cy="88" rx="13" ry="12" fill="#fff" />
          <ellipse cx="126" cy="88" rx="13" ry="12" fill="#fff" />
          <circle cx="79" cy="91" r="6.5" fill={C.ink} />
          <circle cx="131" cy="91" r="6.5" fill={C.ink} />
          <path d="M60 86 L88 86 L88 76 L60 78 Z" fill={C.mask} />
          <path d="M112 86 L140 86 L140 78 L112 76 Z" fill={C.mask} />
          <circle cx="81" cy="92" r="1.8" fill="#fff" />
          <circle cx="133" cy="92" r="1.8" fill="#fff" />
        </>
      ) : (
        <>
          <ellipse cx="74" cy="87" rx={mood === "wow" ? 15 : 13} ry={mood === "wow" ? 16 : 14} fill="#fff" />
          <ellipse cx="126" cy="87" rx={mood === "wow" ? 15 : 13} ry={mood === "wow" ? 16 : 14} fill="#fff" />
          <circle cx="76" cy="88" r={mood === "wow" ? 9 : 8} fill={C.ink} />
          <circle cx="128" cy="88" r={mood === "wow" ? 9 : 8} fill={C.ink} />
          <circle cx="79" cy="84" r="3" fill="#fff" />
          <circle cx="131" cy="84" r="3" fill="#fff" />
          <circle cx="73" cy="91" r="1.3" fill="#fff" />
          <circle cx="125" cy="91" r="1.3" fill="#fff" />
        </>
      )}
      {/* muzzle */}
      <path d="M72 116 C72 100 86 96 100 96 C114 96 128 100 128 116 C128 130 116 138 100 138 C84 138 72 130 72 116 Z" fill={C.furLight} />
      {/* nose */}
      <path d="M90 106 C90 101 110 101 110 106 C110 112 104 115 100 115 C96 115 90 112 90 106 Z" fill={C.ink} />
      <ellipse cx="96" cy="105" rx="3" ry="1.6" fill="#fff" opacity="0.7" />
      {/* mouth */}
      {mood === "wow" ? (
        <ellipse cx="100" cy="126" rx="7" ry="6" fill={C.ink} />
      ) : mood === "judge" ? (
        <path d="M90 126 L110 124" stroke={C.ink} strokeWidth="3" strokeLinecap="round" />
      ) : (
        <>
          <path d="M100 115 L100 121 M88 121 C94 128 106 128 114 118" stroke={C.ink} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M104 124 L107 130 L110 123 Z" fill="#fff" />
        </>
      )}
      {/* blush */}
      <ellipse cx="58" cy="112" rx="7" ry="4" fill={C.pink} opacity="0.55" />
      <ellipse cx="142" cy="112" rx="7" ry="4" fill={C.pink} opacity="0.55" />
    </g>
  );
}

function Tail() {
  return (
    <g>
      <path d="M140 230 C178 232 198 204 192 172 C188 152 174 140 162 142 C176 160 176 188 150 200 Z" fill={C.fur} />
      <path d="M185 160 C178 158 170 162 168 168 L178 176 C184 172 188 166 185 160 Z" fill={C.mask} />
      <path d="M192 186 C182 186 172 190 170 196 L178 206 C186 202 192 196 192 186 Z" fill={C.mask} />
      <path d="M176 214 C168 212 160 214 156 220 L162 228 C170 226 176 222 176 214 Z" fill={C.mask} />
      <path d="M170 146 C166 142 162 142 162 142 C168 150 172 156 174 162 L182 156 C180 152 176 148 170 146 Z" fill={C.mask} />
    </g>
  );
}

function Body({ badge = true }: { badge?: boolean }) {
  return (
    <g>
      {/* feet */}
      <ellipse cx="78" cy="258" rx="18" ry="9" fill={C.mask} />
      <ellipse cx="122" cy="258" rx="18" ry="9" fill={C.mask} />
      {/* hoodie body */}
      <path d="M52 172 C52 146 74 132 100 132 C126 132 148 146 148 172 L152 236 C152 248 140 254 126 254 L74 254 C60 254 48 248 48 236 Z" fill={C.hoodie} />
      <path d="M48 236 C48 248 60 254 74 254 L126 254 C140 254 152 248 152 236 L151 228 L49 228 Z" fill={C.hoodieDark} />
      {/* pocket */}
      <path d="M72 200 L128 200 L134 226 L66 226 Z" fill={C.hoodieDark} opacity="0.6" />
      {/* hood collar */}
      <path d="M66 140 C78 152 122 152 134 140 C130 134 116 130 100 130 C84 130 70 134 66 140 Z" fill={C.hoodieLight} />
      {/* strings */}
      <path d="M90 150 L88 176 M110 150 L112 176" stroke={C.furLight} strokeWidth="3" strokeLinecap="round" />
      <circle cx="88" cy="178" r="3" fill={C.furLight} />
      <circle cx="112" cy="178" r="3" fill={C.furLight} />
      {/* little R badge */}
      {badge && (
        <>
          <circle cx="72" cy="182" r="9" fill={C.gold} />
          <text x="72" y="186.5" textAnchor="middle" fontSize="12" fontWeight="800" fill={C.hoodieDark} fontFamily="system-ui, sans-serif">R</text>
        </>
      )}
    </g>
  );
}

const Paw = ({ x, y }: { x: number; y: number }) => <circle cx={x} cy={y} r="10" fill={C.furDark} />;

function Coin({ x, y, r = 11, rot = 0 }: { x: number; y: number; r?: number; rot?: number }) {
  return (
    <g transform={`rotate(${rot} ${x} ${y})`}>
      <circle cx={x} cy={y} r={r} fill={C.goldDark} />
      <circle cx={x - 1} cy={y - 1} r={r - 2} fill={C.gold} />
      <text x={x - 1} y={y + r * 0.38} textAnchor="middle" fontSize={r * 1.1} fontWeight="900" fill={C.goldDark} fontFamily="system-ui, sans-serif">$</text>
    </g>
  );
}

function Arms({ pose }: { pose: Pose }) {
  const sleeve = { fill: "none", stroke: C.hoodie, strokeWidth: 22, strokeLinecap: "round" as const };
  if (pose === "judge")
    return (
      <g>
        <path d="M60 176 C70 200 110 204 136 192" {...sleeve} />
        <path d="M140 176 C130 200 90 204 64 192" {...sleeve} stroke={C.hoodieDark} />
        <Paw x={136} y={192} />
        <Paw x={64} y={192} />
      </g>
    );
  if (pose === "party")
    return (
      <g>
        <path d="M58 166 C44 140 38 120 36 104" {...sleeve} />
        <path d="M142 166 C156 140 162 120 164 104" {...sleeve} />
        <Paw x={36} y={100} />
        <Paw x={164} y={100} />
        <Coin x={16} y={52} rot={-20} />
        <Coin x={186} y={46} rot={15} />
        <Coin x={168} y={14} r={8} rot={30} />
        <Coin x={30} y={16} r={8} rot={-10} />
        <Coin x={100} y={8} r={7} rot={8} />
      </g>
    );
  if (pose === "wave")
    return (
      <g>
        <path d="M58 170 C50 196 52 214 62 224" {...sleeve} />
        <Paw x={62} y={226} />
        <path d="M142 166 C160 150 168 128 170 112" {...sleeve} />
        <Paw x={170} y={106} />
        <path d="M176 96 C180 92 182 88 182 84 M182 106 C188 104 190 100 192 96" stroke={C.furDark} strokeWidth="3" strokeLinecap="round" fill="none" />
      </g>
    );
  // hero: magnifying glass
  return (
    <g>
      <path d="M58 170 C50 196 54 214 66 222" {...sleeve} />
      <Paw x={68} y={224} />
      <path d="M142 168 C158 160 168 146 170 132" {...sleeve} />
      <path d="M170 136 L184 108" stroke="#5b4636" strokeWidth="8" strokeLinecap="round" />
      <Paw x={170} y={134} />
      <circle cx="192" cy="88" r="22" fill="#cfe9ff" fillOpacity="0.35" stroke="#3b4252" strokeWidth="6" />
      <path d="M180 80 C182 74 188 70 194 70" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" />
      <text x="192" y="96" textAnchor="middle" fontSize="20" fontWeight="900" fill={C.goldDark} fontFamily="system-ui, sans-serif">$</text>
    </g>
  );
}

export function Rocco({ pose = "hero", size = 220, className }: { pose?: Pose; size?: number; className?: string }) {
  const mood = pose === "judge" ? "judge" : pose === "party" ? "wow" : "smirk";
  return (
    <svg className={className} width={size} height={(size * 280) / 230} viewBox="-10 0 230 280" role="img" aria-label="Rocco the raccoon">
      <ellipse cx="100" cy="266" rx="70" ry="8" fill="#000" opacity="0.08" />
      <Tail />
      <Body badge={pose !== "judge"} />
      <Arms pose={pose} />
      <g transform="translate(0 4)">
        <RoccoHead mood={mood} id={`r-${pose}`} />
      </g>
    </svg>
  );
}
