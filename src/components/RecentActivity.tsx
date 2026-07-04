"use client";

import { useMemo } from "react";
import { formatDistanceToNow, parseISO, format, isToday, isYesterday } from "date-fns";
import { useSessionsContext } from "@/context/SessionsContext";
import { formatDuration } from "@/lib/session-utils";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import {
  Zap, Coffee, GitBranch, ArrowUpRight, Clock, SplitSquareHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Session } from "@/types/session";

function dateLabel(dateStr: string): string {
  const d = parseISO(dateStr);
  if (isToday(d))     return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEE, MMM d");
}

function FocusPip({ score }: { score: number }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
      score >= 80 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      : score >= 60 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
    )}>
      <Zap className="size-2.5" />
      {score}%
    </span>
  );
}

function groupByDate(sessions: Session[]) {
  const groups: Record<string, Session[]> = {};
  for (const s of sessions) {
    (groups[s.date] ??= []).push(s);
  }
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
}

export default function RecentActivity() {
  const { sessions, loading } = useSessionsContext();

  const recent  = useMemo(() => sessions.filter((s) => {
    const d = parseISO(s.date);
    return isToday(d) || isYesterday(d);
  }), [sessions]);
  const groups  = useMemo(() => groupByDate(recent), [recent]);

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="p-4 md:p-6">
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="size-8 rounded-xl bg-muted shrink-0" />
                <div className="flex-1 space-y-1.5 pt-1">
                  <div className="h-3.5 w-40 rounded bg-muted" />
                  <div className="h-3 w-24 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card className="h-full">
        <CardContent className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-muted">
            <Clock className="size-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-sm">No sessions yet</p>
            <p className="text-xs text-muted-foreground mt-0.5">Punch in to start logging.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <CardContent className="flex h-full min-h-0 flex-col p-0">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-muted">
              <Clock className="size-3.5 text-muted-foreground" />
            </div>
            <h2 className="text-sm font-semibold md:text-base">Recent Activity</h2>
          </div>
          <Link
            href="/sessions"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all <ArrowUpRight className="size-3" />
          </Link>
        </div>

        {/* Scrollable session list */}
        <div className="min-h-0 flex-1 overflow-y-auto divide-y">
          {groups.map(([date, daySessions]) => {
            const totalMin = daySessions.reduce((s, x) => s + Number(x.duration_minutes), 0);
            const avgFocus = (() => {
              const scored = daySessions.filter((s) => s.focus_score != null);
              if (!scored.length) return null;
              return Math.round(scored.reduce((s, x) => s + Number(x.focus_score ?? 0), 0) / scored.length);
            })();

            return (
              <div key={date}>
                {/* Date header */}
                <div className="flex items-center justify-between bg-muted/30 px-4 py-1.5 md:px-6">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    {dateLabel(date)}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {avgFocus !== null && <FocusPip score={avgFocus} />}
                    <span className="font-medium tabular-nums">{formatDuration(totalMin)}</span>
                  </div>
                </div>

                {/* Session rows */}
                <div className="divide-y divide-border/50">
                  {daySessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-start gap-3 px-4 py-2.5 hover:bg-muted/20 transition-colors md:px-6"
                    >
                      <div className="pt-1.5 shrink-0">
                        <div className={cn(
                          "size-1.5 rounded-full",
                          session.focus_score != null
                            ? Number(session.focus_score) >= 80 ? "bg-emerald-400"
                              : Number(session.focus_score) >= 60 ? "bg-amber-400"
                              : "bg-red-400"
                            : "bg-muted-foreground/30"
                        )} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-medium leading-tight">
                            {session.task}
                            {session.is_split && (
                              <SplitSquareHorizontal className="ml-1.5 inline size-3 text-blue-400" />
                            )}
                          </p>
                          <span className="shrink-0 tabular-nums text-sm font-semibold text-primary">
                            {formatDuration(Number(session.duration_minutes))}
                          </span>
                        </div>

                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          {session.start_time && (
                            <span className="text-[11px] text-muted-foreground tabular-nums">
                              {format(new Date(session.start_time), "h:mm a")}
                              {session.end_time && ` – ${format(new Date(session.end_time), "h:mm a")}`}
                            </span>
                          )}
                          {session.focus_score != null && <FocusPip score={Number(session.focus_score)} />}
                          {session.github_pr && (
                            <a
                              href={session.github_pr}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <GitBranch className="size-2.5" />
                              {session.pr_status ?? "PR"}
                            </a>
                          )}
                          {session.created_at && !session.start_time && (
                            <span className="text-[11px] text-muted-foreground">
                              {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                            </span>
                          )}
                          {session.focus_score !== null && Number(session.focus_score) < 80 && (
                            <Coffee className="size-3 text-muted-foreground/40" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {sessions.length > 40 && (
          <div className="shrink-0 border-t px-4 py-2.5 text-center md:px-6">
            <Link href="/sessions" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              See all {sessions.length} sessions
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
