/* src/hooks/useStats.ts */

"use client";

import { useSessionsContext } from "@/context/SessionsContext";
import { HOURLY_RATE_USD, WEEKLY_HOUR_CAP, WEEK_STARTS_ON } from "@/lib/constants";

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
  day: string;   // "Mon", "Tue", …
  date: string;  // "Jun 23"
  hours: number;
  isToday: boolean;
}

export function useStats() {
  const { sessions, loading } = useSessionsContext();

  // ── Today ──────────────────────────────────────────────────────────────────
  const todayMinutes = sessions
    .filter((s) => isToday(new Date(s.created_at)))
    .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

  // ── This week (Mon-start) ──────────────────────────────────────────────────
  const weekSessions = sessions.filter((s) =>
    isThisWeek(new Date(s.created_at), { weekStartsOn: WEEK_STARTS_ON })
  );
  const weekMinutes = weekSessions.reduce(
    (sum, s) => sum + (s.duration_minutes || 0),
    0
  );

  // ── Last 14 days ───────────────────────────────────────────────────────────
  const biweeklyMinutes = sessions
    .filter(
      (s) => differenceInCalendarDays(new Date(), new Date(s.created_at)) <= 14
    )
    .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

  // ── Daily breakdown (Mon–Sun this week) ────────────────────────────────────
  const weekStart = startOfWeek(new Date(), { weekStartsOn: WEEK_STARTS_ON });
  const dailyBreakdown: DailyBar[] = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const minutes = sessions
      .filter((s) => isSameDay(new Date(s.created_at), date))
      .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    return {
      day: format(date, "EEE"),
      date: format(date, "MMM d"),
      hours: parseFloat((minutes / 60).toFixed(2)),
      isToday: isToday(date),
    };
  });

  // ── Streak (consecutive calendar days with ≥1 session, counting back from today) ──
  let streak = 0;
  let cursor = new Date();
  // If no session today, start checking from yesterday
  const workedToday = sessions.some((s) => isToday(new Date(s.created_at)));
  if (!workedToday) cursor = addDays(cursor, -1);

  for (let i = 0; i < 365; i++) {
    const day = addDays(cursor, -i);
    const worked = sessions.some((s) => isSameDay(new Date(s.created_at), day));
    if (worked) {
      streak++;
    } else {
      break;
    }
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const todayHours    = todayMinutes / 60;
  const weeklyHours   = weekMinutes / 60;
  const biweeklyHours = biweeklyMinutes / 60;
  const remainingHours = Math.max(0, WEEKLY_HOUR_CAP - weeklyHours);
  const weeklyEarnings   = weeklyHours * HOURLY_RATE_USD;
  const biweeklyEarnings = biweeklyHours * HOURLY_RATE_USD;

  // Cap warning thresholds
  const weeklyPct = (weeklyHours / WEEKLY_HOUR_CAP) * 100;
  const capStatus: "safe" | "warning" | "danger" | "exceeded" =
    weeklyPct >= 100 ? "exceeded"
    : weeklyPct >= 90 ? "danger"
    : weeklyPct >= 75 ? "warning"
    : "safe";

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
  };
}