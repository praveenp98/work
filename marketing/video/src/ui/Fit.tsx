import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { fontsLoaded, fontsReady } from "../fonts";

/**
 * Site UI is built at site pixel sizes. Fit lays its child out at `width` css px (like a browser column of that
 * width) and scales the result to fill the parent box without overflowing it. The frame is held until the
 * fonts are in and the size is measured, so a render never catches a half-laid-out piece.
 */
export const Fit: React.FC<{ width: number; maxScale?: number; align?: "center" | "top"; children: React.ReactNode }> = ({ width, maxScale = 4, align = "center", children }) => {
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [m, setM] = useState<{ scale: number; h: number } | null>(null);
  const [ready, setReady] = useState(fontsLoaded());
  const [handle] = useState(() => delayRender("Fit: measuring a UI piece"));

  useEffect(() => { let on = true; fontsReady.then(() => on && setReady(true)); return () => { on = false; }; }, []);
  useLayoutEffect(() => {
    if (!ready || !box.current || !inner.current) return;
    const bw = box.current.clientWidth, bh = box.current.clientHeight, h = inner.current.offsetHeight;
    if (!bw || !bh || !h) return;
    const scale = Math.min(bw / width, bh / h, maxScale);
    if (!m || Math.abs(m.scale - scale) > 0.001 || Math.abs(m.h - h) > 0.5) setM({ scale, h });
  });
  useEffect(() => { if (m) continueRender(handle); }, [m, handle]);

  const s = m?.scale ?? 1;
  return (
    <div ref={box} style={{ width: "100%", height: "100%", minHeight: 0, display: "flex", justifyContent: "center", alignItems: align === "top" ? "flex-start" : "center", visibility: m ? "visible" : "hidden" }}>
      <div style={{ width: width * s, height: (m?.h ?? 0) * s, position: "relative", flex: "none" }}>
        <div ref={inner} style={{ width, position: "absolute", left: 0, top: 0, transform: `scale(${s})`, transformOrigin: "0 0" }}>{children}</div>
      </div>
    </div>
  );
};
