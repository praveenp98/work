"use client";
import { useEffect } from "react";

/** Remembers this team in this browser so Rocco's Connect page (opened by Claude/ChatGPT) can link to it. */
export function RememberTeam({ t }: { t: string }) {
  useEffect(() => {
    void fetch("/api/w/remember", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ t }) }).catch(() => {});
  }, [t]);
  return null;
}
