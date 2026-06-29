"use client";

import { useSidebarVisible } from "@/components/SidebarWrapper";

export default function MainContent({ children }: { children: React.ReactNode }) {
  const sidebar = useSidebarVisible();
  return (
    <div className={`min-w-0 flex-1 flex-col ${sidebar ? "flex" : "flex w-full"}`}>
      {children}
    </div>
  );
}
