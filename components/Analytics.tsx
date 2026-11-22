"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { configureAnalytics, identifyTeam, track, trackPage } from "@/lib/analytics";

/** Page views on every route change, plus clicks on mailto: links (Email a human). Renders nothing. */
export function Analytics({ apiKey, uiHost }: { apiKey?: string; uiHost?: string }) {
  // During render (before any effect on the page runs), so page-level events find the key.
  configureAnalytics(apiKey, uiHost);
  const path = usePathname() ?? "/";
  useEffect(() => { trackPage(path); }, [path]);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.("a[href^='mailto:']");
      if (a) track("email_human_clicked", { where: path.startsWith("/w/") ? "app" : path });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [path]);
  return null;
}

/** On a team's own pages: link this browser to the team so server-side events join the same person. */
export function IdentifyTeam({ team, paid, accounts }: { team: string; paid: boolean; accounts: number }) {
  useEffect(() => { identifyTeam(team, { paid, accounts }); }, [team, paid, accounts]);
  return null;
}
