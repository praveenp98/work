"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * A banner that changes with the calendar, in the visitor's browser, so no deploy is needed on the day.
 * Until Dec 1, 2026 (midnight US Eastern, the same clock lib/urgency.ts uses): the Black Friday checklist.
 * From Dec 1: the December version of the same checklist (pull bids back, post-mortem, gifting weeks).
 * Renders nothing until it knows the date, and nothing after the season ends.
 */
const SWITCH = Date.parse("2026-12-01T05:00:00Z");
const END = Date.parse("2027-01-01T05:00:00Z");

export function SeasonBanner({ from }: { from: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); }, []);
  if (now === null || now >= END) return null;
  const december = now >= SWITCH;
  const href = `/free/black-friday-checklist?utm_source=site&utm_medium=banner&utm_campaign=${december ? "q4-checklist" : "bfcm-checklist"}&utm_content=${from}`;
  return (
    <aside data-season-banner={december ? "december" : "bfcm"} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 14px", padding: "12px 16px", margin: "0 0 18px", borderRadius: 16, background: "color-mix(in srgb, #e8a33d 14%, #fff)", border: "1px solid color-mix(in srgb, #e8a33d 35%, var(--line))", fontSize: 15 }}>
      <span style={{ flex: "1 1 260px" }}>
        {december
          ? <><b>Black Friday is done.</b> December checklist: pull bids back, check what leaked, keep winners funded for the gifting weeks.</>
          : <><b>Black Friday is Nov 27, Cyber Monday Nov 30.</b> The day-by-day ads checklist: before, during and after. Free PDF.</>}
      </span>
      <Link className="btn small" href={href}>{december ? "Get the Q4 checklist →" : "Get the checklist →"}</Link>
    </aside>
  );
}
