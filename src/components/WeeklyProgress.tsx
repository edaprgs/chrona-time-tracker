/* src/components/WeeklyProgress.tsx */

"use client";

import { Progress } from "@/components/ui/progress";
import { useStats } from "@/hooks/useStats";
import { Target } from "lucide-react";

export default function WeeklyProgress() {
  const { weeklyHours } = useStats();
  const percentage = Math.min(100, (Number(weeklyHours) / 40) * 100);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold">
          <Target className="size-4 text-primary" />
          Weekly Progress
        </h2>

        <p className="text-muted-foreground">{weeklyHours}/40h</p>
      </div>

      <Progress value={percentage} />
    </div>
  );
}