"use client";

import { useMemo } from "react";
import { useSessionsContext } from "@/context/SessionsContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, DollarSign, Zap, CalendarDays } from "lucide-react";

export default function ReportsSummary() {
  const { sessions } = useSessionsContext();
  const { hourlyRate } = useWorkspace();

  const stats = useMemo(() => {
    const totalMins = sessions.reduce((s, x) => s + Number(x.duration_minutes ?? 0), 0);
    const totalHours = totalMins / 60;
    const totalEarnings = totalHours * hourlyRate;

    const scored = sessions.filter((s) => s.focus_score != null);
    const avgFocus = scored.length
      ? Math.round(scored.reduce((s, x) => s + Number(x.focus_score ?? 0), 0) / scored.length)
      : null;

    const taskCount = new Set(sessions.map((s) => s.task)).size;

    return { totalHours, totalEarnings, avgFocus, taskCount, sessionCount: sessions.length };
  }, [sessions, hourlyRate]);

  const cards = [
    { label: "Total Hours", value: `${stats.totalHours.toFixed(1)}h`, icon: Clock,        sub: `${stats.sessionCount} sessions` },
    { label: "Total Earned", value: `$${stats.totalEarnings.toFixed(0)}`, icon: DollarSign, sub: "all time (USD)"   },
    { label: "Avg Focus",    value: stats.avgFocus != null ? `${stats.avgFocus}%` : "—",  icon: Zap,          sub: "across sessions" },
    { label: "Unique Tasks", value: String(stats.taskCount), icon: CalendarDays, sub: "distinct tasks"  },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, sub }) => (
        <Card key={label}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Icon className="size-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums leading-none">{value}</p>
            <p className="mt-1.5 text-xs text-muted-foreground">{sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
