"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import { useStats } from "@/hooks/useStats";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useToast } from "@/hooks/useToast";

export default function OvertimeBanner() {
  const { weeklyHours, loading } = useStats();
  const { weeklyHourCap } = useWorkspace();
  const { toast } = useToast();
  const toastedRef = useRef(false);

  const hoursNum   = parseFloat(weeklyHours as string);
  const isOver     = !loading && weeklyHourCap > 0 && hoursNum > weeklyHourCap;
  const overByHours = isOver ? (hoursNum - weeklyHourCap).toFixed(1) : "0";

  // Fire toast once per browser session when the threshold is crossed
  useEffect(() => {
    if (isOver && !toastedRef.current) {
      toastedRef.current = true;
      toast(
        `You've exceeded your ${weeklyHourCap}h weekly cap by ${overByHours}h. Consider wrapping up for the week.`,
        "destructive"
      );
    }
    if (!isOver) {
      toastedRef.current = false;
    }
  }, [isOver, weeklyHourCap, overByHours, toast]);

  if (!isOver) return null;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive dark:bg-destructive/15">
      <AlertTriangle className="size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <span className="font-semibold">Weekly cap exceeded</span>
        <span className="ml-2 text-destructive/80">
          You&apos;re <span className="font-bold">{overByHours}h</span> over your {weeklyHourCap}h limit this week.
        </span>
      </div>
    </div>
  );
}
