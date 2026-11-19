"use client";
import { useEffect, useState } from "react";

/** Top-right: "Your Rocco" once signed in (flag cookie set at sign-in), else "Sign in" with Google. Client-side so pages stay static. */
export function AccountLink({ google }: { google: boolean }) {
  const [inn, setIn] = useState<boolean | null>(null);
  useEffect(() => { setIn(/(?:^|;\s*)rocco_in=1/.test(document.cookie)); }, []);
  if (inn === null) return null;
  if (inn) return <a className="top-acct" href="/welcome">Your Rocco</a>;
  return google ? <a className="top-acct" href="/api/auth/google?intent=signin" rel="nofollow">Sign in</a> : null;
}
