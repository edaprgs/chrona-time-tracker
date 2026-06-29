"use client";

import { useSidebarVisible } from "@/components/SidebarWrapper";

export default function MainContent({ children }: { children: React.ReactNode }) {
  const sidebar = useSidebarVisible();
  return (
    <div className={`flex min-h-screen flex-1 flex-col print:pl-0 ${sidebar ? "pl-64" : ""}`}>
      {children}
    </div>
  );
}
