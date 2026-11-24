"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** Top-right: "Your Rocco" once signed in (flag cookie set at sign-in), else "Sign in" with Google. Client-side so pages stay static. */
export function AccountLink({ google }: { google: boolean }) {
  const path = usePathname() ?? "";
  // Render "Sign in" on the server too, so it's there before scripts load; switch to "Your Rocco" once we see the cookie.
  const [inn, setIn] = useState(false);
  useEffect(() => { setIn(/(?:^|;\s*)rocco_in=1/.test(document.cookie)); }, []);
  // Already on your Rocco (dashboard, plan step, welcome): a link back to it only confuses.
  if (/^\/(w|me|welcome)(\/|$)/.test(path)) return null;
  if (inn) return <a className="top-acct" href="/me">Your Rocco</a>;
  return google ? <a className="top-acct" href="/api/auth/google?intent=signin" rel="nofollow">Sign in</a> : null;
}
