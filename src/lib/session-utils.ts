import { format } from "date-fns";

export interface SplitResult {
  first:  { date: string; start_time: string; end_time: string; duration_minutes: number };
  second: { date: string; start_time: string; end_time: string; duration_minutes: number };
}

/** Returns split data when a session crosses midnight, otherwise null. */
export function detectMidnightSplit(startISO: string, endISO: string): SplitResult | null {
  const start = new Date(startISO);
  const end   = new Date(endISO);

  const startDate = format(start, "yyyy-MM-dd");
  const endDate   = format(end,   "yyyy-MM-dd");
  if (startDate === endDate) return null;

  // Midnight boundary from start's calendar day
  const midnight = new Date(startDate + "T00:00:00");
  midnight.setDate(midnight.getDate() + 1);

  const firstMinutes  = Math.round((midnight.getTime() - start.getTime()) / 60000);
  const secondMinutes = Math.round((end.getTime() - midnight.getTime()) / 60000);

  return {
    first: {
      date: startDate,
      start_time: startISO,
      end_time: midnight.toISOString(),
      duration_minutes: firstMinutes,
    },
    second: {
      date: endDate,
      start_time: midnight.toISOString(),
      end_time: endISO,
      duration_minutes: secondMinutes,
    },
  };
}

export function formatDuration(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
