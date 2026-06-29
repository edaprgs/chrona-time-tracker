"use client";

import { useMemo } from "react";
import { format, subDays, startOfDay, eachWeekOfInterval, startOfWeek, addDays } from "date-fns";
import { useSessionsContext } from "@/context/SessionsContext";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function intensityClass(hours: number): string {
  if (hours === 0) return "bg-muted/60";
  if (hours < 2)   return "bg-emerald-200 dark:bg-emerald-800";
  if (hours < 4)   return "bg-emerald-400 dark:bg-emerald-600";
  if (hours < 6)   return "bg-emerald-500 dark:bg-emerald-500";
  return "bg-emerald-700 dark:bg-emerald-400";
}

export default function HoursHeatmap() {
  const { sessions } = useSessionsContext();

  const { weeks, totalDays } = useMemo(() => {
    const end   = startOfDay(new Date());
    const start = subDays(end, 364);

    const byDate: Record<string, number> = {};
    for (const s of sessions) {
      byDate[s.date] = (byDate[s.date] ?? 0) + Number(s.duration_minutes ?? 0) / 60;
    }

    const weekStarts = eachWeekOfInterval({ start, end }, { weekStartsOn: 0 });
    const weeks = weekStarts.map((ws) =>
      Array.from({ length: 7 }, (_, i) => {
        const d = addDays(startOfWeek(ws, { weekStartsOn: 0 }), i);
        const key = format(d, "yyyy-MM-dd");
        return { date: d, key, hours: byDate[key] ?? 0, future: d > end };
      })
    );

    const totalDays = sessions.length > 0
      ? Object.values(byDate).filter((h) => h > 0).length
      : 0;

    return { weeks, totalDays };
  }, [sessions]);

  const monthLabels = useMemo(() => {
    const labels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, i) => {
      const m = week[0].date.getMonth();
      if (m !== lastMonth) { labels.push({ label: format(week[0].date, "MMM"), col: i }); lastMonth = m; }
    });
    return labels;
  }, [weeks]);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-muted">
              <CalendarDays className="size-3.5 text-muted-foreground" />
            </div>
            <h2 className="font-semibold">Activity Heatmap</h2>
          </div>
          <p className="text-xs text-muted-foreground">{totalDays} active days · last 52 weeks</p>
        </div>

        <div className="overflow-x-auto">
          {/* Month labels */}
          <div className="mb-1 flex" style={{ paddingLeft: 32 }}>
            {monthLabels.map(({ label, col }) => (
              <div key={`${label}-${col}`} className="shrink-0 text-[10px] text-muted-foreground" style={{ width: 13, marginLeft: col === 0 ? 0 : undefined, position: "relative", left: col * 13 }}>
                {label}
              </div>
            ))}
          </div>

          <div className="flex gap-1">
            {/* Day labels */}
            <div className="flex shrink-0 flex-col gap-px pt-px" style={{ width: 28 }}>
              {DAYS.map((d, i) => (
                <div key={d} className={`h-3 text-[9px] leading-3 text-muted-foreground ${i % 2 === 0 ? "invisible" : ""}`}>
                  {d}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="flex gap-px">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-px">
                  {week.map((day) => (
                    <div
                      key={day.key}
                      title={day.future ? "" : `${format(day.date, "MMM d, yyyy")}: ${day.hours.toFixed(1)}h`}
                      className={`size-3 rounded-sm transition-colors ${day.future ? "opacity-0" : intensityClass(day.hours)}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-3 flex items-center gap-1.5 justify-end">
            <span className="text-[10px] text-muted-foreground">Less</span>
            {["bg-muted/60", "bg-emerald-200 dark:bg-emerald-800", "bg-emerald-400 dark:bg-emerald-600", "bg-emerald-500", "bg-emerald-700 dark:bg-emerald-400"].map((cls, i) => (
              <div key={i} className={`size-3 rounded-sm ${cls}`} />
            ))}
            <span className="text-[10px] text-muted-foreground">More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
