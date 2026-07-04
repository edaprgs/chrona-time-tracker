"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import type { Session } from "@/types/session";
import { formatDuration } from "@/lib/session-utils";
import { supabase } from "@/lib/supabase";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Globe, Zap, Coffee, Minus, Equal, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const PR_STATUS_LABEL: Record<string, string> = {
  open: "Open",
  in_review: "In Review",
  approved: "Approved",
  merged: "Merged",
  done: "Done",
};

interface PauseRow {
  id: string;
  paused_at: string;
  resumed_at: string | null;
  reason: string | null;
  duration_minutes: number | null;
}

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  session?: Session;
}

export default function ViewSessionDialog({ open, setOpen, session }: Props) {
  const [pauseLogs, setPauseLogs] = useState<PauseRow[]>([]);

  useEffect(() => {
    if (!open || !session) { setPauseLogs([]); return; }
    supabase
      .from("pause_logs")
      .select("id, paused_at, resumed_at, reason, duration_minutes")
      .eq("session_id", session.id)
      .order("paused_at", { ascending: true })
      .then(({ data }) => setPauseLogs(data ?? []));
  }, [open, session]);

  if (!session) return null;

  const focusScore   = session.focus_score !== null ? Number(session.focus_score) : null;
  const workedMin    = Number(session.duration_minutes);

  const totalPauseMin = pauseLogs
    .filter((p) => p.duration_minutes != null)
    .reduce((sum, p) => sum + Number(p.duration_minutes), 0);

  const wallClockMin = session.start_time && session.end_time
    ? Math.round((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 60000)
    : null;

  const hasPauses    = pauseLogs.length > 0;
  const hasTimeRange = session.start_time && session.end_time;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="pr-6">{session.task}</DialogTitle>
        </DialogHeader>

        <div className="max-h-[72vh] overflow-y-auto pr-1 space-y-4">

          {/* Time receipt */}
          {hasTimeRange && (
            <div className="rounded-xl border bg-muted/30 overflow-hidden">
              {/* Start → End */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Start</span>
                </div>
                <span className="text-sm font-medium">
                  {format(new Date(session.start_time!), "h:mm a, MMM d")}
                </span>
              </div>

              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">End</span>
                </div>
                <span className="text-sm font-medium">
                  {format(new Date(session.end_time!), "h:mm a, MMM d")}
                </span>
              </div>

              {/* Wall-clock subtotal */}
              {wallClockMin !== null && (
                <div className="flex items-center justify-between border-t bg-muted/40 px-4 py-2.5">
                  <span className="text-xs text-muted-foreground">Total span</span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {formatDuration(wallClockMin)}
                  </span>
                </div>
              )}

              {/* Pause deductions */}
              {hasPauses && (
                <>
                  <div className="border-t px-4 pt-3 pb-1">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Coffee className="size-3.5" />
                      Breaks deducted
                    </p>
                  </div>
                  {pauseLogs.map((p, i) => (
                    <div
                      key={p.id}
                      className="flex items-start gap-3 px-4 py-2.5 border-t bg-amber-50/60 dark:bg-amber-950/10"
                    >
                      <Minus className="size-3.5 shrink-0 mt-0.5 text-amber-500" />
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-muted-foreground">
                            Break {i + 1}
                            {" · "}
                            <span className="font-medium text-foreground">
                              {format(new Date(p.paused_at), "h:mm a")}
                            </span>
                            {p.resumed_at && (
                              <>
                                {" → "}
                                <span className="font-medium text-foreground">
                                  {format(new Date(p.resumed_at), "h:mm a")}
                                </span>
                              </>
                            )}
                            {!p.resumed_at && (
                              <span className="text-amber-600 dark:text-amber-400"> · ongoing</span>
                            )}
                          </span>
                          {p.duration_minutes != null && (
                            <span className="shrink-0 text-xs font-semibold text-amber-700 dark:text-amber-400">
                              −{formatDuration(Number(p.duration_minutes))}
                            </span>
                          )}
                        </div>
                        {p.reason && (
                          <p className="text-[11px] italic text-muted-foreground">"{p.reason}"</p>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Total pauses */}
                  {totalPauseMin > 0 && (
                    <div className="flex items-center justify-between border-t bg-amber-50/80 dark:bg-amber-950/20 px-4 py-2">
                      <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">Total breaks</span>
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                        −{formatDuration(totalPauseMin)}
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* Final worked duration */}
              <div className={cn(
                "flex items-center justify-between px-4 py-3 border-t",
                hasPauses ? "bg-primary/5" : ""
              )}>
                <div className="flex items-center gap-2">
                  {hasPauses && <Equal className="size-3.5 text-primary shrink-0" />}
                  <span className="text-sm font-semibold text-primary">
                    {hasPauses ? "Time worked" : "Duration"}
                  </span>
                </div>
                <span className="text-sm font-bold text-primary">
                  {formatDuration(workedMin)}
                </span>
              </div>
            </div>
          )}

          {/* No time range — just show duration plainly */}
          {!hasTimeRange && (
            <div className="flex items-center justify-between rounded-xl border px-4 py-3">
              <span className="text-sm font-medium text-muted-foreground">Duration</span>
              <span className="text-sm font-bold text-primary">{formatDuration(workedMin)}</span>
            </div>
          )}

          {/* Meta row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border px-3 py-2.5 space-y-0.5">
              <p className="text-[11px] font-medium text-muted-foreground">Date</p>
              <p className="text-sm font-medium">{format(parseISO(session.date), "MMM d, yyyy")}</p>
            </div>

            {focusScore !== null && (
              <div className="rounded-lg border px-3 py-2.5 space-y-0.5">
                <p className="text-[11px] font-medium text-muted-foreground">Focus score</p>
                <p className="text-sm font-medium flex items-center gap-1">
                  <Zap className={cn("size-3.5", focusScore >= 80 ? "text-emerald-500" : focusScore >= 60 ? "text-amber-500" : "text-red-500")} />
                  {focusScore}%
                </p>
              </div>
            )}

            <div className="rounded-lg border px-3 py-2.5 space-y-0.5">
              <p className="text-[11px] font-medium text-muted-foreground">PR Status</p>
              <p className="text-sm font-medium">{PR_STATUS_LABEL[session.pr_status] ?? session.pr_status}</p>
            </div>

            {session.github_pr && (
              <div className="rounded-lg border px-3 py-2.5 space-y-0.5">
                <p className="text-[11px] font-medium text-muted-foreground">Pull Request</p>
                <a
                  href={session.github_pr}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <Globe className="size-3.5" /> View PR
                </a>
              </div>
            )}
          </div>

          {session.description && (
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground">Description</p>
              <p className="text-sm whitespace-pre-wrap text-foreground leading-relaxed">
                {session.description}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
