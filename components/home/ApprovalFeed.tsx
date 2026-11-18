"use client";
import { useEffect, useState } from "react";
import { AppIcon } from "@/components/home/RoccoStage";
import type { BrandIcon } from "@/lib/brand-icons";

/**
 * Below the fold: Rocco's work, as it happens on a sample brand. New cards slide in on top every ~2.4s.
 * Labeled as a sample brand (no fake customers): it shows what approvals look like, not real accounts.
 */
type Ev = { icon: string; what: string; detail: string; who: string; via: BrandIcon | "claudecode" | "rocco"; value?: string };

const EVENTS: Ev[] = [
  { icon: "📦", what: "Send 340 units of Kitchen Set Blue", detail: "9 days of stock left before Black Friday", who: "Sam approved", via: "imessage" },
  { icon: "✂️", what: "Cut “plastic chopping mat”", detail: "41 clicks, 0 orders in 30 days", who: "Priya approved", via: "slack", value: "+$63/mo" },
  { icon: "🔎", what: "Analyzed 2,140 search terms", detail: "Ads + Seller Central, this morning", who: "Rocco", via: "claude" },
  { icon: "📈", what: "Bid +12% on “bamboo cutting board”", detail: "ACoS 18% vs 30% target, room to grow", who: "Sam approved", via: "imessage", value: "+$210/mo sales" },
  { icon: "🚨", what: "Bamboo Board S is suppressed", detail: "Main image background · ads paused until fixed", who: "Rocco flagged", via: "rocco" },
  { icon: "🌱", what: "Promote “cutting board set” to exact", detail: "6 orders at 14% ACoS from auto", who: "Jen approved", via: "openai", value: "+$120/mo" },
  { icon: "💰", what: "Move $15/day to Hero Exact", detail: "Out of budget by 3pm, ACoS 16%", who: "Priya approved", via: "slack", value: "+$340/mo sales" },
  { icon: "✅", what: "Last week's B3 worked", detail: "Lower bid saved $86/mo, sales held", who: "Rocco checked", via: "calendar", value: "$86/mo saved" },
  { icon: "⚠️", what: "Buy Box 72% on B0CHARC001", detail: "Another seller undercut by $1.20", who: "Rocco flagged", via: "rocco" },
  { icon: "🧾", what: "Client report for 5 brands", detail: "Sent to the agency's clients, Monday 9:00", who: "Rocco", via: "claudecode" },
];

export function ApprovalFeed() {
  const [n, setN] = useState(4);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setN((x) => x + 1), 2400);
    return () => clearInterval(t);
  }, []);
  const items = Array.from({ length: 5 }, (_, i) => ({ k: n - i, ev: EVENTS[(((n - i) % EVENTS.length) + EVENTS.length) % EVENTS.length] }));
  return (
    <div className="feed" aria-label="Sample of Rocco's work">
      <ul>
        {items.map(({ k, ev }, i) => (
          <li key={k} className={i === 0 ? "new" : ""} style={{ opacity: 1 - i * 0.14 }}>
            <span className="feed-ic" aria-hidden>{ev.icon}</span>
            <div className="feed-main">
              <b>{ev.what}</b>
              <small>{ev.detail}</small>
            </div>
            <div className="feed-side">
              {ev.value && <span className="feed-val">{ev.value}</span>}
              <span className="feed-who">{ev.via === "rocco" ? "🦝" : <AppIcon app={ev.via} size={13} />} {ev.who}</span>
            </div>
          </li>
        ))}
      </ul>
      <p className="fine">Sample brand. Every change is approved by your team, logged, and checked a week later.</p>
    </div>
  );
}
