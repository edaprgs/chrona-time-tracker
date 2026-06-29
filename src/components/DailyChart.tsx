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

interface TooltipPayload {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipPayload) {
  if (!active || !payload?.length) return null;
  const hours = payload[0].value;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{label}</p>
      <p className="text-primary">{hours.toFixed(2)}h</p>
    </div>
  );
}

export default function DailyChart() {
  const { dailyBreakdown } = useStats();
  const { weeklyHourCap } = useWorkspace();

  const dailySoftCap = weeklyHourCap / 5;
  const maxHours = Math.max(...dailyBreakdown.map((d) => d.hours), dailySoftCap + 1);

  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-muted">
              <BarChart2 className="size-3.5 text-muted-foreground" />
            </div>
            <h2 className="font-semibold">This Week</h2>
          </div>
          <p className="text-xs text-muted-foreground">Daily hours breakdown</p>
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={dailyBreakdown}
            margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
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
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-accent)", opacity: 0.4 }} />
            <ReferenceLine
              y={dailySoftCap}
              stroke="var(--color-border)"
              strokeDasharray="4 3"
              label={{ value: `${dailySoftCap}h`, fontSize: 10, fill: "var(--color-muted-foreground)", position: "right" }}
            />
            <Bar dataKey="hours" radius={[5, 5, 0, 0]} maxBarSize={44}>
              {dailyBreakdown.map((entry) => (
                <Cell
                  key={entry.day}
                  fill={
                    entry.isToday
                      ? "var(--color-primary)"
                      : entry.hours > 0
                      ? "var(--color-chart-2)"
                      : "var(--color-border)"
                  }
                  fillOpacity={entry.hours === 0 ? 0.3 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
          {dailyBreakdown.map((d) => (
            <div key={d.day} className={d.isToday ? "font-semibold text-primary" : ""}>
              {d.hours > 0 ? `${d.hours}h` : "—"}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}