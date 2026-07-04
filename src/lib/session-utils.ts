import { format } from "date-fns";
import type { PauseEntry } from "@/types/activity";

export interface SplitResult {
  first:  { date: string; start_time: string; end_time: string; duration_minutes: number };
  second: { date: string; start_time: string; end_time: string; duration_minutes: number };
}

/**
 * Given a punch-in/out range and a pause log, compute how many actual worked
 * minutes fall before midnight (first) vs on/after midnight (second).
 * Returns null if start and end are on the same calendar day.
 */
export function splitWorkedMinutesAtMidnight(
  startISO: string,
  endISO: string,
  pauseLog: PauseEntry[],
): { firstMinutes: number; secondMinutes: number } | null {
  const start = new Date(startISO);
  const end   = new Date(endISO);
  const startDate = format(start, "yyyy-MM-dd");
  const endDate   = format(end,   "yyyy-MM-dd");
  if (startDate === endDate) return null;

  const midnight = new Date(`${startDate}T00:00:00`);
  midnight.setDate(midnight.getDate() + 1);
  const midMs = midnight.getTime();

  // Build worked intervals by subtracting pauses from [start, end]
  const pauses = pauseLog
    .filter((p) => p.resumedAt)
    .map((p) => ({ from: new Date(p.pausedAt).getTime(), to: new Date(p.resumedAt!).getTime() }));

  let intervals: [number, number][] = [[start.getTime(), end.getTime()]];
  for (const pause of pauses) {
    const next: [number, number][] = [];
    for (const [a, b] of intervals) {
      if (pause.from >= b || pause.to <= a) { next.push([a, b]); continue; }
      if (a < pause.from) next.push([a, pause.from]);
      if (pause.to < b)   next.push([pause.to, b]);
    }
    intervals = next;
  }

  let firstMs = 0, secondMs = 0;
  for (const [a, b] of intervals) {
    if (b <= midMs)      firstMs  += b - a;
    else if (a >= midMs) secondMs += b - a;
    else { firstMs += midMs - a; secondMs += b - midMs; }
  }

  return { firstMinutes: Math.round(firstMs / 60000), secondMinutes: Math.round(secondMs / 60000) };
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
