"use client";
import posthog from "posthog-js";

/**
 * Product analytics (PostHog), off until NEXT_PUBLIC_POSTHOG_KEY is set (Vercel env; the key is public by design).
 *  - Page views + the funnel events Rocco fires (docs/ANALYTICS.md).
 *  - Private team links (/w/rw_…, /mcp/rw_…) are scrubbed from every URL before anything leaves the browser.
 *  - Session replays only on public pages (home, pricing, help…), never inside a customer's Rocco, and every input
 *    is masked.
 *  - Sent through rocco.works/ingest (next.config rewrites), so ad blockers don't drop the funnel.
 * The hackathon traffic tracker (components/Tracker.tsx) is separate and stays on every page.
 */
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
let started = false;

export const scrub = (s: string) => s.replace(/\/(w|mcp|j)\/[A-Za-z0-9_-]{6,}/g, "/$1/[team]").replace(/([?&](t|token|key)=)[^&#]+/g, "$1[x]");
const isApp = (path: string) => /^\/(w|me|welcome|mcp|j)(\/|$)/.test(path);

export function startAnalytics() {
  if (!KEY || started || typeof window === "undefined") return;
  started = true;
  posthog.init(KEY, {
    api_host: "/ingest",
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_UI_HOST || "https://us.posthog.com",
    capture_pageview: false, // sent by trackPage with a scrubbed URL
    capture_pageleave: true,
    autocapture: true,
    persistence: "localStorage+cookie",
    session_recording: { maskAllInputs: true },
    disable_session_recording: true, // turned on per page below (public pages only)
    before_send: (e) => {
      if (!e) return e;
      for (const k of ["$current_url", "$pathname", "$referrer", "$initial_referrer", "$initial_current_url"]) {
        const v = e.properties?.[k];
        if (typeof v === "string") e.properties[k] = scrub(v);
      }
      return e;
    },
  });
}

export function trackPage(path: string) {
  if (!KEY) return;
  startAnalytics();
  if (isApp(path)) posthog.stopSessionRecording();
  else posthog.startSessionRecording();
  posthog.capture("$pageview", { $current_url: scrub(window.location.href), $pathname: scrub(path) });
}

/** A funnel step or action. Never pass secrets, emails or customer data in props. */
export function track(event: string, props: Record<string, string | number | boolean | undefined> = {}) {
  if (!KEY) return;
  startAnalytics();
  posthog.capture(event, props);
}

/** Tie this browser to a team (workspace id: not a secret), so server events (paid, connected) join the funnel. */
export function identifyTeam(teamId: string, props: Record<string, string | number | boolean> = {}) {
  if (!KEY || !teamId) return;
  startAnalytics();
  posthog.identify(teamId, props);
}
