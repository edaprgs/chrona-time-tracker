"use client";

import { useSessionsContext } from "@/context/SessionsContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import {
  isToday,
  differenceInCalendarDays,
  startOfWeek,
  addDays,
  format,
} from "date-fns";

export interface DailyBar {
  day: string;
  date: string;
  hours: number;
  isToday: boolean;
  isWorkDay: boolean;
}

/** Returns true if dayOfWeek (0=Sun…6=Sat) falls within [start, end] inclusive (wraps around). */
function isWorkDay(dayOfWeek: number, start: number, end: number): boolean {
  return start <= end
    ? dayOfWeek >= start && dayOfWeek <= end
    : dayOfWeek >= start || dayOfWeek <= end;
}

export function useStats() {
  const { sessions, loading } = useSessionsContext();
  const { hourlyRate, weeklyHourCap, workStartDay, workEndDay, numWorkDays } = useWorkspace();

  const weekStartsOn = workStartDay as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const weekStart    = startOfWeek(new Date(), { weekStartsOn });

  const todayMinutes = sessions
    .filter((s) => isToday(new Date(s.date)))
    .reduce((sum, s) => sum + Number(s.duration_minutes || 0), 0);

  // "This week" = sessions whose date falls within [weekStart, weekStart+7)
  const weekEnd = addDays(weekStart, 7);
  const weekSessions = sessions.filter((s) => {
    const d = new Date(s.date);
    return d >= weekStart && d < weekEnd;
  });
  const weekMinutes = weekSessions.reduce((sum, s) => sum + Number(s.duration_minutes || 0), 0);

  const biweeklyMinutes = sessions
    .filter((s) => differenceInCalendarDays(new Date(), new Date(s.date)) <= 14)
    .reduce((sum, s) => sum + Number(s.duration_minutes || 0), 0);

  const dailyBreakdown: DailyBar[] = Array.from({ length: 7 }, (_, i) => {
    const date      = addDays(weekStart, i);
    const dateStr   = format(date, "yyyy-MM-dd");
    const dayOfWeek = date.getDay(); // 0=Sun
    const minutes   = sessions
      .filter((s) => s.date === dateStr)
      .reduce((sum, s) => sum + Number(s.duration_minutes || 0), 0);
    return {
      day:       format(date, "EEE"),
      date:      format(date, "MMM d"),
      hours:     parseFloat((minutes / 60).toFixed(2)),
      isToday:   isToday(date),
      isWorkDay: isWorkDay(dayOfWeek, workStartDay, workEndDay),
    };
  });

  // Streak — consecutive calendar days with at least one session
  let streak = 0;
  let cursor = new Date();
  const workedToday = sessions.some((s) => isToday(new Date(s.date)));
  if (!workedToday) cursor = addDays(cursor, -1);
  for (let i = 0; i < 365; i++) {
    const day     = addDays(cursor, -i);
    const dateStr = format(day, "yyyy-MM-dd");
    if (sessions.some((s) => s.date === dateStr)) streak++;
    else break;
  }

  const todayHours     = todayMinutes / 60;
  const weeklyHours    = weekMinutes / 60;
  const biweeklyHours  = biweeklyMinutes / 60;
  const remainingHours = Math.max(0, weeklyHourCap - weeklyHours);
  const weeklyEarnings    = weeklyHours * hourlyRate;
  const biweeklyEarnings  = biweeklyHours * hourlyRate;
  const dailyTargetHours  = weeklyHourCap / numWorkDays;

  const weeklyPct = (weeklyHours / weeklyHourCap) * 100;
  const capStatus: "safe" | "warning" | "danger" | "exceeded" =
    weeklyPct >= 100 ? "exceeded"
    : weeklyPct >= 90 ? "danger"
    : weeklyPct >= 75 ? "warning"
    : "safe";

  const scoredSessions  = weekSessions.filter((s) => s.focus_score != null);
  const weeklyFocusAvg  = scoredSessions.length > 0
    ? Math.round(scoredSessions.reduce((sum, s) => sum + Number(s.focus_score ?? 0), 0) / scoredSessions.length)
    : null;

  return {
    loading,
    todayHours:       todayHours.toFixed(1),
    todayHoursRaw:    todayMinutes / 60,
    weeklyHours:      weeklyHours.toFixed(1),
    weeklyHoursRaw:   weekMinutes / 60,
    biweeklyHours:    biweeklyHours.toFixed(1),
    remainingHours:   remainingHours.toFixed(1),
    weeklyEarnings:   weeklyEarnings.toFixed(2),
    biweeklyEarnings: biweeklyEarnings.toFixed(2),
    dailyTargetHours,
    weeklyPct,
    capStatus,
    dailyBreakdown,
    streak,
    weeklyFocusAvg,
  };
}
