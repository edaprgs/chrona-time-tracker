/* src/hooks/useStats.ts */

"use client";

import { useSessionsContext } from "@/context/SessionsContext";
import { HOURLY_RATE_USD, WEEKLY_HOUR_CAP, WEEK_STARTS_ON } from "@/lib/constants";

import {
  isToday,
  isThisWeek,
  differenceInCalendarDays,
} from "date-fns";

export function useStats() {
  const { sessions, loading } = useSessionsContext();

  // Today's sessions
  const todayMinutes = sessions
    .filter((session) => isToday(new Date(session.created_at)))
    .reduce((sum, session) => sum + (session.duration_minutes || 0), 0);

  // Current week's sessions (Monday-start, so it lines up with the
  // contract's "no more than 40 hours in any seven-day period" cap)
  const weekMinutes = sessions
    .filter((session) =>
      isThisWeek(new Date(session.created_at), { weekStartsOn: WEEK_STARTS_ON })
    )
    .reduce((sum, session) => sum + (session.duration_minutes || 0), 0);

  // Last 14 days (matches the biweekly invoice cycle)
  const biweeklyMinutes = sessions
    .filter(
      (session) =>
        differenceInCalendarDays(new Date(), new Date(session.created_at)) <= 14
    )
    .reduce((sum, session) => sum + (session.duration_minutes || 0), 0);

  const todayHours = todayMinutes / 60;
  const weeklyHours = weekMinutes / 60;
  const biweeklyHours = biweeklyMinutes / 60;

  const remainingHours = Math.max(0, WEEKLY_HOUR_CAP - weeklyHours);
  const weeklyEarnings = weeklyHours * HOURLY_RATE_USD;
  const biweeklyEarnings = biweeklyHours * HOURLY_RATE_USD;

  return {
    loading,
    todayHours: todayHours.toFixed(1),
    weeklyHours: weeklyHours.toFixed(1),
    biweeklyHours: biweeklyHours.toFixed(1),
    remainingHours: remainingHours.toFixed(1),
    weeklyEarnings: weeklyEarnings.toFixed(2),
    biweeklyEarnings: biweeklyEarnings.toFixed(2),
  };
}