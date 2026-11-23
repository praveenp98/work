"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { track, type ClientEvent } from "@/lib/track";

/**
 * Mounted once in the root layout. Sends funnel events (lib/track.ts) without touching the product's components:
 *
 *   page_view         every landing page view (not team pages, /me, /welcome or /admin)
 *   hire_click        a click on any "Hire Rocco" button (.hire-cta, .pc-cta)
 *   signup_started    "Continue with Google" in the hire sheet, or its email form
 *   checkout_started  the Continue button that opens Dodo checkout
 *   tool_result       the first time someone uses a tool on /tools/<slug> (first input or file), once per page
 *   call_click        any link to a booking page, or anything marked data-track="call_click"
 *   anything else     data-track="<event>" on a link or button (+ data-track-magnet / -tool / -link)
 *
 * lead_captured is sent by the forms themselves when the email is saved (see components/WaitlistForm.tsx).
 */
const PRIVATE = /^\/(w|me|j|welcome|oauth|mcp|admin|thanks|card)(\/|$)/;
const TOOL = /^\/tools\/([a-z0-9-]+)\/?$/;
const seen = { path: "", at: 0 };

export function Analytics() {
  const path = usePathname();

  useEffect(() => {
    if (!path || PRIVATE.test(path)) return;
    // One view per page: React's dev mode runs effects twice, and a re-render must not count as a second visit.
    if (seen.path === path && Date.now() - seen.at < 2000) return;
    seen.path = path; seen.at = Date.now();
    track("page_view");
  }, [path]);

  useEffect(() => {
    let toolSent = "";
    const onClick = (e: MouseEvent) => {
      const el = e.target instanceof Element ? e.target : null;
      if (!el) return;
      const marked = el.closest<HTMLElement>("[data-track]");
      if (marked?.dataset.track) return track(marked.dataset.track as ClientEvent, { magnet: marked.dataset.trackMagnet, tool: marked.dataset.trackTool, link: marked.dataset.trackLink });
      if (el.closest("a[href*='dodopayments.com']")) return track("checkout_started");
      if (el.closest("a[href*='/api/auth/google'][href*='intent=hire']")) return track("signup_started");
      if (el.closest("a[href*='cal.com/'], a[href*='calendly.com/'], a[href*='savvycal.com/']")) return track("call_click");
      if (el.closest("button.hire-cta, button.pc-cta")) return track("hire_click");
    };
    const onSubmit = (e: SubmitEvent) => {
      if (e.target instanceof Element && e.target.matches("form.sheet-form")) track("signup_started");
    };
    const onInput = (e: Event) => {
      const tool = location.pathname.match(TOOL)?.[1];
      if (!tool || toolSent === tool || !(e.target instanceof Element) || !e.target.closest("main")) return;
      if (e.target.closest("form.waitlist") || e.target.matches("input[type=email]")) return; // typing an email is not using the tool
      toolSent = tool;
      track("tool_result", { tool });
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    document.addEventListener("change", onInput, true);
    return () => { document.removeEventListener("click", onClick, true); document.removeEventListener("submit", onSubmit, true); document.removeEventListener("change", onInput, true); };
  }, []);

  return null;
}
