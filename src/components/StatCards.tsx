"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useStats } from "@/hooks/useStats";
import { useWorkspace } from "@/context/WorkspaceContext";
import {
  Sun, CalendarDays, CalendarRange, TrendingUp, DollarSign, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function StatCards() {
  const stats = useStats();
  const { weeklyHourCap } = useWorkspace();

  const weeklyPct = weeklyHourCap > 0 ? (Number(stats.weeklyHours) / weeklyHourCap) * 100 : 0;
  const isCritical = weeklyPct >= 90;
  const isWarning  = weeklyPct >= 70 && weeklyPct < 90;

  const focusScore = stats.weeklyFocusAvg;
  const focusGood    = focusScore !== null && focusScore >= 80;
  const focusModerate = focusScore !== null && focusScore >= 60 && focusScore < 80;
  const focusLow     = focusScore !== null && focusScore < 60;

  const cards = [
    {
      label: "Today",
      value: `${stats.todayHours}h`,
      icon: Sun,
      sub: "hours logged today",
      highlight: false, critical: false, warning: false, focusGood: false, focusModerate: false, focusLow: false,
    },
    {
      label: "This Week",
      value: `${stats.weeklyHours}h`,
      icon: CalendarDays,
      sub: `of ${weeklyHourCap}h cap`,
      highlight: false, critical: isCritical, warning: isWarning, focusGood: false, focusModerate: false, focusLow: false,
    },
    {
      label: "Last 14 Days",
      value: `${stats.biweeklyHours}h`,
      icon: CalendarRange,
      sub: "invoice period",
      highlight: false, critical: false, warning: false, focusGood: false, focusModerate: false, focusLow: false,
    },
    {
      label: "Focus Score",
      value: focusScore !== null ? `${focusScore}%` : "—",
      icon: Zap,
      sub: focusScore !== null ? (focusGood ? "high focus this week" : focusModerate ? "moderate focus" : "low focus — check pauses") : "no data yet",
      highlight: false, critical: focusLow, warning: focusModerate, focusGood, focusModerate: false, focusLow: false,
    },
    {
      label: "Earnings",
      value: `$${stats.weeklyEarnings}`,
      icon: DollarSign,
      sub: "this week (USD)",
      highlight: true, critical: false, warning: false, focusGood: false, focusModerate: false, focusLow: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-5">
      {cards.map(({ label, value, icon: Icon, sub, highlight, critical, warning, focusGood }) => (
        <Card
          key={label}
          className={cn(
            "border transition-colors",
            highlight  && "border-primary/30 bg-primary/[0.03]",
            critical   && "border-destructive/30 bg-destructive/[0.03]",
            warning    && "border-amber-400/30 bg-amber-50/40 dark:bg-amber-950/10",
            focusGood  && "border-emerald-400/30 bg-emerald-50/40 dark:bg-emerald-950/10",
          )}
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
              <div className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-lg",
                highlight  ? "bg-primary/10"
                : critical ? "bg-destructive/10"
                : warning  ? "bg-amber-100 dark:bg-amber-900/30"
                : focusGood ? "bg-emerald-100 dark:bg-emerald-900/30"
                : "bg-muted"
              )}>
                <Icon className={cn(
                  "size-3.5",
                  highlight  ? "text-primary"
                  : critical ? "text-destructive"
                  : warning  ? "text-amber-600 dark:text-amber-400"
                  : focusGood ? "text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground"
                )} />
              </div>
            </div>
            <p className={cn(
              "mt-3 text-3xl font-bold tabular-nums leading-none",
              highlight  ? "text-primary"
              : critical ? "text-destructive"
              : warning  ? "text-amber-600 dark:text-amber-400"
              : focusGood ? "text-emerald-600 dark:text-emerald-400"
              : "text-foreground"
            )}>
              {value}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">{sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}