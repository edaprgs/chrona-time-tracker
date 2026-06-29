"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useStats } from "@/hooks/useStats";
import { Flame, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMobileSidebar } from "@/context/MobileSidebarContext";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Header() {
  const { user } = useAuth();
  const { contractorName, clientName, workspaceName } = useWorkspace();
  const { streak } = useStats();
  const { toggle } = useMobileSidebar();

  const today = useMemo(
    () => new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
    []
  );

  const firstName = (contractorName || user?.email?.split("@")[0] || "there").split(" ")[0];
  const client = clientName || workspaceName;
  const isHot = streak >= 5;

  return (
    <div className="flex items-center gap-3">
      {/* Hamburger — mobile only */}
      <button
        onClick={toggle}
        className="flex size-9 shrink-0 items-center justify-center rounded-lg border text-muted-foreground hover:bg-muted md:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-4" />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-bold tracking-tight md:text-2xl">
          {greeting()}, {firstName}
        </h1>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {today}
          {client && (
            <>
              <span className="mx-2 opacity-40">·</span>
              <span>{client}</span>
            </>
          )}
        </p>
      </div>

      {streak > 0 && (
        <div className={cn(
          "flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm",
          isHot
            ? "border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/40"
            : "border-border bg-muted/40"
        )}>
          <Flame className={cn("size-4", isHot ? "text-orange-500" : "text-muted-foreground")} />
          <span className={cn("font-semibold tabular-nums", isHot && "text-orange-700 dark:text-orange-300")}>
            {streak}d
          </span>
          <span className="hidden text-xs text-muted-foreground sm:inline">streak</span>
        </div>
      )}
    </div>
  );
}
