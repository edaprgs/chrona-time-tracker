"use client";

import { useMemo } from "react";
import { useSessionsContext } from "@/context/SessionsContext";
import { Card, CardContent } from "@/components/ui/card";
import { ListChecks } from "lucide-react";
import { isThisWeek } from "date-fns";
import { DEFAULTS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const BAR_COLORS = [
  "bg-[#f9a8d4]",
  "bg-[#c4b5fd]",
  "bg-[#93c5fd]",
  "bg-[#86efac]",
  "bg-[#fde68a]",
];

export default function TopTasks() {
  const { sessions } = useSessionsContext();

  const tasks = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of sessions.filter((s) => isThisWeek(new Date(s.date), { weekStartsOn: DEFAULTS.WEEK_STARTS_ON }))) {
      map[s.task] = (map[s.task] ?? 0) + Number(s.duration_minutes ?? 0) / 60;
    }
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const max = sorted[0]?.[1] ?? 1;
    return sorted.map(([task, hours]) => ({ task, hours, pct: (hours / max) * 100 }));
  }, [sessions]);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-muted">
              <ListChecks className="size-3.5 text-muted-foreground" />
            </div>
            <h2 className="font-semibold">Top Tasks</h2>
          </div>
          <p className="text-xs text-muted-foreground">This week</p>
        </div>

        {tasks.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No sessions this week yet.</p>
        ) : (
          <div className="space-y-3">
            {tasks.map(({ task, hours, pct }, i) => (
              <div key={task}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{task}</span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{hours.toFixed(1)}h</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className={cn("h-full rounded-full transition-all", BAR_COLORS[i % BAR_COLORS.length])} style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
