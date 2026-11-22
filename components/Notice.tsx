"use client";
import { useEffect, useState } from "react";
import { SIGNIN, WAIT } from "@/lib/messages";

/** Site-wide notice: sign-in problems (?signin=…) and going offline. Dismissible, never blocks the page. */
export function Notice() {
  const [msg, setMsg] = useState("");
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("signin");
    if (q && SIGNIN[q]) setMsg(SIGNIN[q]);
    const off = () => setMsg(WAIT.offline);
    const on = () => setMsg((m) => (m === WAIT.offline ? "" : m));
    window.addEventListener("offline", off);
    window.addEventListener("online", on);
    return () => { window.removeEventListener("offline", off); window.removeEventListener("online", on); };
  }, []);
  if (!msg) return null;
  return (
    <div className="notice" role="status">
      <span>{msg}</span>
      <button aria-label="Dismiss" onClick={() => setMsg("")}>×</button>
    </div>
  );
}
