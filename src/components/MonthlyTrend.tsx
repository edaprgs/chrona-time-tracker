"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { useSessionsContext } from "@/context/SessionsContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";

interface TooltipProps { active?: boolean; payload?: { value: number }[]; label?: string }
function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{label}</p>
      <p className="text-primary">{payload[0].value.toFixed(1)}h</p>
    </div>
  );
}

export default function MonthlyTrend() {
  const { sessions } = useSessionsContext();
  const { hourlyRate, weeklyHourCap } = useWorkspace();

  const data = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), 5 - i));
    return months.map((m) => {
      const start = startOfMonth(m);
      const end   = endOfMonth(m);
      const mins  = sessions
        .filter((s) => isWithinInterval(parseISO(s.date), { start, end }))
        .reduce((sum, s) => sum + Number(s.duration_minutes ?? 0), 0);
      return {
        month: format(m, "MMM"),
        hours: parseFloat((mins / 60).toFixed(2)),
        earnings: parseFloat(((mins / 60) * hourlyRate).toFixed(2)),
        isCurrent: format(m, "yyyy-MM") === format(new Date(), "yyyy-MM"),
      };
    });
  }, [sessions, hourlyRate]);

  const monthlyCapLine = (weeklyHourCap / 7) * 30;

  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-muted">
              <TrendingUp className="size-3.5 text-muted-foreground" />
            </div>
            <h2 className="font-semibold">Monthly Trend</h2>
          </div>
          <p className="text-xs text-muted-foreground">Last 6 months</p>
        </div>

        <ResponsiveContainer width="99%" height={200}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barCategoryGap="35%">
            <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}h`} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.05)" }} wrapperStyle={{ outline: "none" }} />
            <ReferenceLine y={monthlyCapLine} stroke="hsl(var(--destructive))" strokeDasharray="3 3" strokeOpacity={0.5} />
            <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={["#f9a8d4","#c4b5fd","#93c5fd","#86efac","#fde68a","#fdba74"][i % 6]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Monthly summary row */}
        <div className="mt-4 grid grid-cols-3 gap-3 border-t pt-4">
          {data.slice(-3).map((d) => (
            <div key={d.month} className="text-center">
              <p className="text-xs text-muted-foreground">{d.month}</p>
              <p className="text-lg font-bold">{d.hours.toFixed(0)}h</p>
              <p className="text-xs text-muted-foreground">${d.earnings.toFixed(0)}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
