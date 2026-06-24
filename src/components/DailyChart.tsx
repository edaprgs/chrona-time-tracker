/* src/components/DailyChart.tsx */

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
import { WEEKLY_HOUR_CAP } from "@/lib/constants";

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

  // Daily cap = 40h / 5 working days
  const dailySoftCap = WEEKLY_HOUR_CAP / 5;
  const maxHours = Math.max(...dailyBreakdown.map((d) => d.hours), dailySoftCap + 1);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">This Week</h2>
        <p className="text-xs text-muted-foreground">Daily breakdown</p>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={dailyBreakdown}
          margin={{ top: 8, right: 4, left: -24, bottom: 0 }}
          barCategoryGap="30%"
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
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-accent)", opacity: 0.5 }} />

          {/* Soft daily reference line (8h) */}
          <ReferenceLine
            y={dailySoftCap}
            stroke="var(--color-border)"
            strokeDasharray="4 3"
            label={{ value: `${dailySoftCap}h`, fontSize: 10, fill: "var(--color-muted-foreground)", position: "right" }}
          />

          <Bar dataKey="hours" radius={[4, 4, 0, 0]} maxBarSize={48}>
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
                fillOpacity={entry.hours === 0 ? 0.35 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Day labels with hours */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {dailyBreakdown.map((d) => (
          <div key={d.day} className={d.isToday ? "font-semibold text-primary" : ""}>
            {d.hours > 0 ? `${d.hours}h` : "—"}
          </div>
        ))}
      </div>
    </div>
  );
}