import type { ReactNode } from "react";
import { DashNav } from "@/components/dash/DashNav";

/** Every Rocco page (today, actions, products, images, analytics, log, tidy, report) shares one menu. */
export default async function Layout({ children, params }: { children: ReactNode; params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <>
      <DashNav token={token} />
      {children}
    </>
  );
}
