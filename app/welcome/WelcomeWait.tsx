"use client";
import { useEffect } from "react";
import { LoadingText } from "@/components/LoadingText";

/** While Dodo confirms the payment: show the steps and check again every 3 seconds. */
export function WelcomeWait({ next }: { next: string }) {
  useEffect(() => { const t = setTimeout(() => window.location.replace(next), 3000); return () => clearTimeout(t); }, [next]);
  return <LoadingText steps={["Payment received by Dodo…", "Confirming it with them…", "Switching on your Rocco…"]} every={1200} />;
}
