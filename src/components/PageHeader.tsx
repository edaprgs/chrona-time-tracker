"use client";

import { Menu } from "lucide-react";
import { useMobileSidebar } from "@/context/MobileSidebarContext";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
}

export default function PageHeader({ title, subtitle, icon: Icon, actions }: Props) {
  const { toggle } = useMobileSidebar();

  return (
    <div className="border-b bg-card/60 px-4 py-4 backdrop-blur-sm print:hidden md:px-8 md:py-5">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={toggle}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg border text-muted-foreground hover:bg-muted md:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-4" />
        </button>

        {Icon && (
          <div className="hidden size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:flex">
            <Icon className="size-4 text-primary" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold tracking-tight md:text-2xl">{title}</h1>
          {subtitle && (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {actions}
      </div>
    </div>
  );
}
