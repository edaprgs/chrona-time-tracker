"use client";

import { useSessionsContext } from "@/context/SessionsContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { DEFAULTS } from "@/lib/constants";
import {
  isToday,
  isThisWeek,
  differenceInCalendarDays,
  startOfWeek,
  addDays,
  format,
  isSameDay,
} from "date-fns";

export interface DailyBar {
  day: string;
  date: string;
  hours: number;
  isToday: boolean;
}

export function useStats() {
  const { sessions, loading } = useSessionsContext();
  const { hourlyRate, weeklyHourCap } = useWorkspace();

  const WEEK_STARTS_ON = DEFAULTS.WEEK_STARTS_ON;

  const todayMinutes = sessions
    .filter((s) => isToday(new Date(s.date)))
    .reduce((sum, s) => sum + Number(s.duration_minutes || 0), 0);

  const weekSessions = sessions.filter((s) =>
    isThisWeek(new Date(s.date), { weekStartsOn: WEEK_STARTS_ON })
  );
  const weekMinutes = weekSessions.reduce((sum, s) => sum + Number(s.duration_minutes || 0), 0);

  const biweeklyMinutes = sessions
    .filter((s) => differenceInCalendarDays(new Date(), new Date(s.date)) <= 14)
    .reduce((sum, s) => sum + Number(s.duration_minutes || 0), 0);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: WEEK_STARTS_ON });
  const dailyBreakdown: DailyBar[] = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const dateStr = format(date, "yyyy-MM-dd");
    const minutes = sessions
      .filter((s) => s.date === dateStr)
      .reduce((sum, s) => sum + Number(s.duration_minutes || 0), 0);
    return {
      day: format(date, "EEE"),
      date: format(date, "MMM d"),
      hours: parseFloat((minutes / 60).toFixed(2)),
      isToday: isToday(date),
    };
  });

  let streak = 0;
  let cursor = new Date();
  const workedToday = sessions.some((s) => isToday(new Date(s.date)));
  if (!workedToday) cursor = addDays(cursor, -1);
  for (let i = 0; i < 365; i++) {
    const day = addDays(cursor, -i);
    const dateStr = format(day, "yyyy-MM-dd");
    if (sessions.some((s) => s.date === dateStr)) {
      streak++;
    } else {
      break;
    }
  }

  const todayHours    = todayMinutes / 60;
  const weeklyHours   = weekMinutes / 60;
  const biweeklyHours = biweeklyMinutes / 60;
  const remainingHours = Math.max(0, weeklyHourCap - weeklyHours);
  const weeklyEarnings   = weeklyHours * hourlyRate;
  const biweeklyEarnings = biweeklyHours * hourlyRate;

  const weeklyPct = (weeklyHours / weeklyHourCap) * 100;
  const capStatus: "safe" | "warning" | "danger" | "exceeded" =
    weeklyPct >= 100 ? "exceeded"
    : weeklyPct >= 90 ? "danger"
    : weeklyPct >= 75 ? "warning"
    : "safe";

  const scoredSessions = weekSessions.filter((s) => s.focus_score != null);
  const weeklyFocusAvg = scoredSessions.length > 0
    ? Math.round(scoredSessions.reduce((sum, s) => sum + Number(s.focus_score ?? 0), 0) / scoredSessions.length)
    : null;

  return {
    loading,
    todayHours:       todayHours.toFixed(1),
    weeklyHours:      weeklyHours.toFixed(1),
    biweeklyHours:    biweeklyHours.toFixed(1),
    remainingHours:   remainingHours.toFixed(1),
    weeklyEarnings:   weeklyEarnings.toFixed(2),
    biweeklyEarnings: biweeklyEarnings.toFixed(2),
    weeklyPct,
    capStatus,
    dailyBreakdown,
    streak,
    weeklyFocusAvg,
  };
}
