"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

const HIDE_ON = ["/login", "/"];

export function useSidebarVisible() {
  const pathname = usePathname();
  return !HIDE_ON.includes(pathname);
}

export default function SidebarWrapper() {
  const visible = useSidebarVisible();
  if (!visible) return null;
  return <Sidebar />;
}
