"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { useStats } from "@/hooks/useStats";
import { useWorkspace } from "@/context/WorkspaceContext";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart2 } from "lucide-react";

interface DailyBar {
  day: string;
  date: string;
  hours: number;
  isToday: boolean;
}

interface TooltipPayload {
  active?: boolean;
  payload?: { value: number; payload: DailyBar }[];
  label?: string;
}

function CustomTooltip({ active, payload }: TooltipPayload) {
  if (!active || !payload?.length) return null;
  const { hours, day, date } = payload[0].payload;
  return (
    <div className="rounded-lg border bg-card px-3 py-2.5 text-sm shadow-md space-y-0.5">
      <p className="font-semibold">{day}, {date}</p>
      <p className="text-primary font-medium">{hours.toFixed(2)}h worked</p>
    </div>
  );
}

export default function DailyChart() {
  const { dailyBreakdown } = useStats();
  const { weeklyHourCap } = useWorkspace();

  const dailySoftCap = weeklyHourCap / 5;
  const maxHours = Math.max(...dailyBreakdown.map((d) => d.hours), dailySoftCap + 1);
  const totalWeekHours = dailyBreakdown.reduce((s, d) => s + d.hours, 0);

  return (
    <Card className="h-full">
      <CardContent className="p-6">
        {/* Header */}
        <div className="mb-1 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-muted">
              <BarChart2 className="size-3.5 text-muted-foreground" />
            </div>
            <h2 className="font-semibold">This Week</h2>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Weekly total</p>
            <p className="text-sm font-semibold text-primary">{totalWeekHours.toFixed(2)}h</p>
          </div>
        </div>

        {/* Daily soft-cap note */}
        <p className="mb-4 text-[11px] text-muted-foreground">
          Daily target: {dailySoftCap}h · Cap: {weeklyHourCap}h/week
        </p>

        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={dailyBreakdown}
            margin={{ top: 8, right: 16, left: -20, bottom: 0 }}
            barCategoryGap="35%"
          >
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, Math.ceil(maxHours)]}
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}h`}
              width={32}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(0,0,0,0.05)" }}
              wrapperStyle={{ outline: "none" }}
            />
            <ReferenceLine
              y={dailySoftCap}
              stroke="var(--color-border)"
              strokeDasharray="4 3"
            />
            <Bar dataKey="hours" radius={[5, 5, 0, 0]} maxBarSize={44}>
              {dailyBreakdown.map((entry) => (
                <Cell
                  key={entry.day}
                  fill={
                    entry.isToday
                      ? "#f9a8d4"
                      : entry.hours > 0
                      ? "#c4b5fd"
                      : "#e5e7eb"
                  }
                  fillOpacity={entry.hours === 0 ? 0.5 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Per-day breakdown with dates */}
        <div className="mt-3 grid grid-cols-7 gap-1 text-center">
          {dailyBreakdown.map((d) => (
            <div key={d.day} className="space-y-0.5">
              <p className={`text-xs font-semibold ${d.isToday ? "text-primary" : "text-foreground"}`}>
                {d.hours > 0 ? `${d.hours}h` : "-"}
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight">{d.date}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
