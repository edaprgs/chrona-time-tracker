"use client";

import { useStats } from "@/hooks/useStats";
import { useWorkspace } from "@/context/WorkspaceContext";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Target, XCircle, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

const config = {
  safe: {
    icon: Target,
    iconClass: "text-primary",
    barClass: "bg-primary",
    bannerClass: "",
    message: null,
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "text-amber-500",
    barClass: "bg-amber-400",
    bannerClass: "border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
    message: "Approaching your weekly cap - log carefully.",
  },
  danger: {
    icon: AlertTriangle,
    iconClass: "text-orange-500",
    barClass: "bg-orange-400",
    bannerClass: "border border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300",
    message: "Very close to the cap. Consider pausing new work.",
  },
  exceeded: {
    icon: XCircle,
    iconClass: "text-destructive",
    barClass: "bg-destructive",
    bannerClass: "border border-destructive/30 bg-destructive/10 text-destructive dark:bg-destructive/20",
    message: "Weekly cap reached. Hours above this can't be billed.",
  },
};

export default function WeeklyProgress() {
  const { weeklyHours, weeklyPct, capStatus, remainingHours, streak } = useStats();
  const { weeklyHourCap } = useWorkspace();
  const pct = Math.min(100, weeklyPct);
  const { icon: Icon, iconClass, barClass, bannerClass, message } = config[capStatus];
  const isHot = streak >= 5;

  return (
    <Card className="h-full">
      <CardContent className="p-4 md:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex size-7 items-center justify-center rounded-lg",
              capStatus === "safe" ? "bg-primary/10" : capStatus === "exceeded" ? "bg-destructive/10" : "bg-amber-100 dark:bg-amber-900/30"
            )}>
              <Icon className={cn("size-3.5", iconClass)} />
            </div>
            <h2 className="font-semibold">Weekly Cap</h2>
          </div>
          <p className="text-sm font-semibold tabular-nums">
            <span className={cn(capStatus !== "safe" && iconClass)}>{weeklyHours}h</span>
            <span className="text-muted-foreground font-normal"> / {weeklyHourCap}h</span>
          </p>
        </div>

        {/* Progress bar */}
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-all duration-700", barClass)}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{pct.toFixed(0)}% used</span>
          {capStatus === "safe" && <span>{remainingHours}h remaining</span>}
        </div>

        {/* Warning banner */}
        {message && (
          <div className={cn("mt-4 flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs", bannerClass)}>
            <Icon className="mt-0.5 size-3.5 shrink-0" />
            {message}
          </div>
        )}

        {/* Streak block */}
        <div className={cn(
          "mt-5 flex items-center gap-3 rounded-xl border px-4 py-3",
          isHot ? "border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/40" : "border-border bg-muted/30"
        )}>
          <Flame className={cn("size-4 shrink-0", isHot ? "text-orange-500" : streak > 0 ? "text-muted-foreground" : "text-muted-foreground/30")} />
          <div className="min-w-0">
            {streak === 0 ? (
              <p className="text-xs text-muted-foreground">No active streak - log a session to start one.</p>
            ) : (
              <>
                <p className={cn("text-sm font-semibold", isHot && "text-orange-700 dark:text-orange-300")}>
                  {streak} day{streak !== 1 ? "s" : ""} in a row
                </p>
                <p className="text-xs text-muted-foreground">
                  {isHot ? "On fire - keep it going" : streak === 1 ? "Good start! Come back tomorrow" : "Building momentum"}
                </p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}