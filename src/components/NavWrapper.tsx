"use client";

import { usePathname } from "next/navigation";
import Nav from "@/components/Nav";

const HIDE_NAV_ON = ["/login"];

export default function NavWrapper() {
  const pathname = usePathname();
  if (HIDE_NAV_ON.includes(pathname)) return null;
  return <Nav />;
}
