/* src/components/StreakBadge.tsx */

"use client";

import { useStats } from "@/hooks/useStats";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StreakBadge() {
  const { streak } = useStats();

  if (streak === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Flame className="size-4 opacity-30" />
        No active streak - log a session to start one.
      </div>
    );
  }

  const isHot = streak >= 5;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-3",
        isHot
          ? "border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/40"
          : "border-border bg-muted/40"
      )}
    >
      <Flame
        className={cn(
          "size-5 shrink-0",
          isHot ? "text-orange-500" : "text-muted-foreground"
        )}
      />
      <div>
        <p className={cn("text-sm font-semibold", isHot && "text-orange-700 dark:text-orange-300")}>
          {streak} day{streak !== 1 ? "s" : ""} in a row
        </p>
        <p className="text-xs text-muted-foreground">
          {isHot
            ? "Keep it going"
            : streak === 1
            ? "Good start - come back tomorrow!"
            : "Building momentum!"}
        </p>
      </div>
    </div>
  );
}