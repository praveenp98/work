"use client";
import { useEffect, useState } from "react";

/**
 * The buttons on /start. Each one carries the visitor's UTM tags through to where it goes (so the next page, or
 * an outside booking page, knows which profile sent them) and sends a funnel event when tapped: data-track is
 * picked up by components/FunnelEvents.tsx.
 */
export interface StartLink { id: string; href: string; title: string; sub: string; event: "link_click" | "call_click" }

export function StartLinks({ links }: { links: StartLink[] }) {
  const [utm, setUtm] = useState("");
  useEffect(() => {
    const q = new URLSearchParams(location.search), keep = new URLSearchParams();
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) { const v = q.get(k); if (v) keep.set(k, v); }
    setUtm(keep.toString());
  }, []);
  const withUtm = (href: string) => { if (!utm) return href; const [path, hash] = href.split("#"); return `${path}${path.includes("?") ? "&" : "?"}${utm}${hash ? `#${hash}` : ""}`; };
  return (
    <nav aria-label="Where to next" style={{ display: "grid", gap: 12, width: "100%" }}>
      {links.map((l, i) => (
        <a key={l.id} href={withUtm(l.href)} data-track={l.event} data-track-link={l.id} style={{ display: "grid", gap: 2, padding: "18px 22px", borderRadius: 22, textDecoration: "none", textAlign: "left", background: i === 0 ? "var(--accent)" : "#fff", color: i === 0 ? "#fff" : "var(--ink)", border: i === 0 ? "1px solid var(--accent)" : "1px solid var(--line)", boxShadow: i === 0 ? "0 8px 22px color-mix(in srgb, var(--accent) 28%, transparent)" : "var(--shadow)" }}>
          <b style={{ fontSize: 19 }}>{l.title} →</b>
          <span style={{ fontSize: 14.5, opacity: i === 0 ? 0.9 : 1, color: i === 0 ? "#fff" : "var(--muted)" }}>{l.sub}</span>
        </a>
      ))}
    </nav>
  );
}
