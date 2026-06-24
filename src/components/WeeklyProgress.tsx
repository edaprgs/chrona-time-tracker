/* src/components/WeeklyProgress.tsx */

"use client";

import { Progress } from "@/components/ui/progress";
import { useStats } from "@/hooks/useStats";
import { AlertTriangle, Target, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { WEEKLY_HOUR_CAP } from "@/lib/constants";

const config = {
  safe: {
    icon: Target,
    iconClass: "text-primary",
    barClass: "",
    bannerClass: "",
    message: null,
  },
  warning: {
    icon: Target,
    iconClass: "text-amber-500",
    barClass: "bg-amber-400",
    bannerClass: "",
    message: null,
  },
  danger: {
    icon: AlertTriangle,
    iconClass: "text-orange-500",
    barClass: "bg-orange-400",
    bannerClass: "border border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300",
    message: "You're close to the 40h cap. Log carefully.",
  },
  exceeded: {
    icon: XCircle,
    iconClass: "text-destructive",
    barClass: "bg-destructive",
    bannerClass: "border border-destructive/30 bg-destructive/10 text-destructive dark:bg-destructive/20",
    message: "You've reached the 40h weekly cap. Hours above this can't be billed.",
  },
};

export default function WeeklyProgress() {
  const { weeklyHours, weeklyPct, capStatus, remainingHours } = useStats();
  const pct = Math.min(100, weeklyPct);
  const { icon: Icon, iconClass, barClass, bannerClass, message } = config[capStatus];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold">
          <Icon className={cn("size-4", iconClass)} />
          Weekly Cap
        </h2>
        <p className="text-sm text-muted-foreground">
          <span className={cn("font-semibold", capStatus !== "safe" && iconClass)}>
            {weeklyHours}h
          </span>
          {" / "}
          {WEEKLY_HOUR_CAP}h
          {capStatus === "safe" && (
            <span className="ml-2 text-muted-foreground">
              · {remainingHours}h left
            </span>
          )}
        </p>
      </div>

      {/* Progress bar — colour shifts with status */}
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("h-full rounded-full transition-all", barClass || "bg-primary")}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Warning / danger banner */}
      {message && (
        <div className={cn("flex items-start gap-2 rounded-lg px-4 py-3 text-sm", bannerClass)}>
          <Icon className="mt-0.5 size-4 shrink-0" />
          {message}
        </div>
      )}
    </div>
  );
}