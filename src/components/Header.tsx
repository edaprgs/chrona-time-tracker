"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useStats } from "@/hooks/useStats";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const today = useMemo(
    () => new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
    []
  );

  const firstName = (contractorName || user?.email?.split("@")[0] || "there").split(" ")[0];
  const client = clientName || workspaceName;
  const isHot = streak >= 5;

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting()}, {firstName}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
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
          "flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm",
          isHot
            ? "border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/40"
            : "border-border bg-muted/40"
        )}>
          <Flame className={cn("size-4", isHot ? "text-orange-500" : "text-muted-foreground")} />
          <span className={cn("font-semibold tabular-nums", isHot && "text-orange-700 dark:text-orange-300")}>
            {streak}d
          </span>
          <span className="text-xs text-muted-foreground hidden sm:inline">streak</span>
        </div>
      )}
    </div>
  );
}
