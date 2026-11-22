"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** Top-right: "Your Rocco" once signed in (flag cookie set at sign-in), else "Sign in" with Google. Client-side so pages stay static. */
export function AccountLink({ google }: { google: boolean }) {
  const path = usePathname() ?? "";
  const [inn, setIn] = useState<boolean | null>(null);
  useEffect(() => { setIn(/(?:^|;\s*)rocco_in=1/.test(document.cookie)); }, []);
  if (inn === null) return null;
  // Already on your Rocco (dashboard, plan step, welcome): a link back to it only confuses.
  if (/^\/(w|me|welcome)(\/|$)/.test(path)) return null;
  if (inn) return <a className="top-acct" href="/me">Your Rocco</a>;
  return google ? <a className="top-acct" href="/api/auth/google?intent=signin" rel="nofollow">Sign in</a> : null;
}
