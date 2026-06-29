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

const PR_COLORS: Record<string, string> = {
  open:      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  in_review: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  approved:  "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  merged:    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  done:      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
};

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

  const recent = useMemo(
    () => sessions.slice(0, 40),
    [sessions]
  );

  const groups = useMemo(() => groupByDate(recent), [recent]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="size-9 rounded-xl bg-muted shrink-0" />
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
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
            <Clock className="size-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold">No sessions yet</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Punch in above to start logging your work.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-muted">
              <Clock className="size-3.5 text-muted-foreground" />
            </div>
            <h2 className="font-semibold">Recent Activity</h2>
          </div>
          <Link href="/sessions" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            View all <ArrowUpRight className="size-3" />
          </Link>
        </div>

        {/* Groups by date */}
        <div className="divide-y">
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
                <div className="flex items-center justify-between bg-muted/30 px-6 py-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {dateLabel(date)}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {avgFocus !== null && <FocusPip score={avgFocus} />}
                    <span className="font-medium tabular-nums">{formatDuration(totalMin)}</span>
                  </div>
                </div>

                {/* Session rows */}
                <div className="divide-y divide-border/50">
                  {daySessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-start gap-4 px-6 py-3.5 hover:bg-muted/20 transition-colors"
                    >
                      {/* Color dot / time indicator */}
                      <div className="flex flex-col items-center gap-1 pt-0.5">
                        <div className={cn(
                          "size-2 rounded-full mt-1",
                          session.focus_score != null
                            ? Number(session.focus_score) >= 80 ? "bg-emerald-400"
                              : Number(session.focus_score) >= 60 ? "bg-amber-400"
                              : "bg-red-400"
                            : "bg-muted-foreground/30"
                        )} />
                      </div>

                      {/* Main content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium leading-tight">
                              {session.task}
                              {session.is_split && (
                                <span title="Split session">
                                  <SplitSquareHorizontal className="ml-1.5 inline size-3 text-blue-400" />
                                </span>
                              )}
                            </p>
                            {session.description && (
                              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                                {session.description}
                              </p>
                            )}
                          </div>

                          {/* Right side: duration */}
                          <span className="shrink-0 tabular-nums text-sm font-semibold text-primary">
                            {formatDuration(Number(session.duration_minutes))}
                          </span>
                        </div>

                        {/* Meta row */}
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          {session.start_time && (
                            <span className="text-[11px] text-muted-foreground tabular-nums">
                              {format(new Date(session.start_time), "h:mm a")}
                              {session.end_time && ` – ${format(new Date(session.end_time), "h:mm a")}`}
                            </span>
                          )}
                          {session.focus_score != null && (
                            <FocusPip score={Number(session.focus_score)} />
                          )}
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
                        </div>
                      </div>

                      {/* Pause icon if paused during session */}
                      {session.focus_score !== null && Number(session.focus_score) < 80 && (
                        <span title="Had pauses">
                          <Coffee className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/50" />
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {sessions.length > 40 && (
          <div className="border-t px-6 py-3 text-center">
            <Link href="/sessions" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              See all {sessions.length} sessions →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
