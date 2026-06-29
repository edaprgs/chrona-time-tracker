"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useSessionsContext } from "@/context/SessionsContext";
import { Card, CardContent } from "@/components/ui/card";
import { ListChecks } from "lucide-react";

const COLORS = [
  "#f9a8d4", "#c4b5fd", "#93c5fd", "#86efac", "#fde68a",
  "#fdba74", "#fca5a5", "#5eead4", "#a5b4fc", "#bef264",
];

interface TooltipProps { active?: boolean; payload?: { value: number }[]; label?: string }
function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-md">
      <p className="font-medium truncate max-w-48">{label}</p>
      <p className="text-primary">{payload[0].value.toFixed(1)}h</p>
    </div>
  );
}

export default function TaskBreakdown() {
  const { sessions } = useSessionsContext();

  const data = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of sessions) {
      map[s.task] = (map[s.task] ?? 0) + Number(s.duration_minutes ?? 0) / 60;
    }
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([task, hours]) => ({ task, hours: parseFloat(hours.toFixed(2)) }));
  }, [sessions]);

  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-muted">
              <ListChecks className="size-3.5 text-muted-foreground" />
            </div>
            <h2 className="font-semibold">Top Tasks</h2>
          </div>
          <p className="text-xs text-muted-foreground">All time · by hours</p>
        </div>

        {data.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">No sessions yet</div>
        ) : (
          <ResponsiveContainer width="99%" height={280}>
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }} barCategoryGap="25%">
              <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}h`} />
              <YAxis type="category" dataKey="task" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={110} tickFormatter={(v: string) => v.length > 16 ? v.slice(0, 16) + "…" : v} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.05)" }} wrapperStyle={{ outline: "none" }} />
              <Bar dataKey="hours" radius={[0, 4, 4, 0]}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
