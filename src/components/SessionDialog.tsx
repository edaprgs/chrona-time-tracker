"use client";

import { useEffect, useState } from "react";
import { useSessionsContext } from "@/context/SessionsContext";
import { useToast } from "@/hooks/useToast";
import { detectMidnightSplit, splitWorkedMinutesAtMidnight } from "@/lib/session-utils";
import { loadTemplates, saveTemplate, deleteTemplate, type SessionTemplate } from "@/lib/templates";
import type { Session, PrStatus } from "@/types/session";
import type { PauseEntry } from "@/types/activity";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Globe, SplitSquareHorizontal, BookmarkPlus, Bookmark, Trash2,
  ChevronDown, Zap,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const PR_STATUS_OPTIONS: { value: PrStatus; label: string }[] = [
  { value: "open",      label: "Open"      },
  { value: "in_review", label: "In Review" },
  { value: "approved",  label: "Approved"  },
  { value: "merged",    label: "Merged"    },
  { value: "done",      label: "Done"      },
];

function calcFocusScore(durationMinutes: number, pauseLog: PauseEntry[]): number {
  const completedPauses = pauseLog.filter((p) => p.pausedAt && p.resumedAt);
  const totalPauseMs = completedPauses.reduce((sum, p) => {
    return sum + (new Date(p.resumedAt!).getTime() - new Date(p.pausedAt).getTime());
  }, 0);
  const totalPauseMin = totalPauseMs / 60000;
  const activeMin = Math.max(0, durationMinutes - totalPauseMin);
  if (durationMinutes <= 0) return 100;
  return Math.min(100, Math.round((activeMin / durationMinutes) * 100));
}

function FocusBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
    : score >= 60 ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
    : "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
  const label = score >= 80 ? "High focus" : score >= 60 ? "Moderate" : "Low focus";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold", color)}>
      <Zap className="size-3" />
      {score}% · {label}
    </span>
  );
}

interface Props {
  open: boolean;
  setOpen: (value: boolean) => void;
  durationSeconds?: number;
  punchedInAt?: string;
  pauseLog?: PauseEntry[];
  resetTimer?: () => void;
  session?: Session;
  isManual?: boolean;
}

export default function SessionDialog({
  open, setOpen, durationSeconds, punchedInAt, pauseLog, resetTimer, session, isManual,
}: Props) {
  const { createSession, updateSession } = useSessionsContext();
  const { toast } = useToast();
  const isEditMode = Boolean(session);

  const [task, setTask]           = useState("");
  const [description, setDesc]    = useState("");
  const [githubPR, setGithubPR]   = useState("");
  const [prStatus, setPrStatus]   = useState<PrStatus>("open");
  const [minutes, setMinutes]     = useState(0);
  const [manualDate, setManualDate]   = useState("");
  const [manualStart, setManualStart] = useState("");
  const [manualEnd, setManualEnd]     = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  // Templates
  const [templates, setTemplates]     = useState<SessionTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);

  const punchOutISO = new Date().toISOString();
  const rawSplit = !isEditMode && !isManual && punchedInAt
    ? detectMidnightSplit(punchedInAt, punchOutISO)
    : null;
  // Recalculate split durations using actual worked time (minus pauses) so a
  // session paused across midnight doesn't inflate the per-day hour counts.
  const workedSplit = rawSplit && punchedInAt && pauseLog
    ? splitWorkedMinutesAtMidnight(punchedInAt, punchOutISO, pauseLog)
    : null;
  const split = rawSplit && workedSplit
    ? {
        first:  { ...rawSplit.first,  duration_minutes: workedSplit.firstMinutes  },
        second: { ...rawSplit.second, duration_minutes: workedSplit.secondMinutes },
      }
    : rawSplit;

  const manualSplit = isManual && manualDate && manualStart && manualEnd
    ? detectMidnightSplit(
        new Date(`${manualDate}T${manualStart}`).toISOString(),
        new Date(`${manualDate}T${manualEnd}`).toISOString(),
      )
    : null;

  const durationMinutes = Math.round((durationSeconds || 0) / 60);
  const focusScore = !isEditMode && !isManual && pauseLog
    ? calcFocusScore(durationMinutes, pauseLog)
    : null;

  useEffect(() => {
    if (!open) return;
    setTemplates(loadTemplates());
    setShowTemplates(false);
    if (session) {
      setTask(session.task);
      setDesc(session.description || "");
      setGithubPR(session.github_pr || "");
      setPrStatus(session.pr_status ?? "open");
      setMinutes(Number(session.duration_minutes));
    } else if (isManual) {
      setTask(""); setDesc(""); setGithubPR(""); setPrStatus("open"); setMinutes(0);
      setManualDate(format(new Date(), "yyyy-MM-dd"));
      setManualStart(""); setManualEnd("");
    } else {
      setTask(""); setDesc(""); setGithubPR(""); setPrStatus("open");
      setMinutes(Math.round((durationSeconds || 0) / 60));
    }
    setError("");
  }, [open, session, durationSeconds, isManual]);

  useEffect(() => {
    if (!isManual || !manualDate || !manualStart || !manualEnd) return;
    const start = new Date(`${manualDate}T${manualStart}`);
    const end   = new Date(`${manualDate}T${manualEnd}`);
    if (manualSplit) {
      setMinutes(manualSplit.first.duration_minutes + manualSplit.second.duration_minutes);
    } else {
      const diff = Math.round((end.getTime() - start.getTime()) / 60000);
      if (diff > 0) setMinutes(diff);
    }
  }, [isManual, manualDate, manualStart, manualEnd, manualSplit]);

  function applyTemplate(t: SessionTemplate) {
    setTask(t.task);
    setDesc(t.description);
    setGithubPR(t.github_pr);
    setShowTemplates(false);
  }

  function handleSaveTemplate() {
    if (!task.trim()) { toast("Enter a task title first.", "destructive"); return; }
    saveTemplate({ name: task, task, description, github_pr: githubPR });
    setTemplates(loadTemplates());
    toast("Template saved.", "success");
  }

  function handleDeleteTemplate(id: string) {
    deleteTemplate(id);
    setTemplates(loadTemplates());
  }

  async function handleSave() {
    if (!task.trim()) { setError("Task title is required"); return; }
    setLoading(true); setError("");

    if (isEditMode && session) {
      await updateSession(session.id, { task, description, github_pr: githubPR, pr_status: prStatus, duration_minutes: minutes });
      toast("Session updated.", "success");

    } else if (isManual) {
      if (minutes <= 0) { setError("Duration must be greater than 0"); setLoading(false); return; }
      const activeSplit = manualSplit;
      if (activeSplit) {
        const parent = await createSession({
          task, description, github_pr: githubPR, pr_status: prStatus,
          ...activeSplit.first, is_split: true,
        });
        if (parent) {
          await createSession({
            task, description, github_pr: githubPR, pr_status: prStatus,
            ...activeSplit.second, is_split: true, parent_session_id: parent.id,
          });
        }
        toast("Session split across midnight and saved.", "success");
      } else {
        const startISO = manualDate && manualStart ? new Date(`${manualDate}T${manualStart}`).toISOString() : null;
        const endISO   = manualDate && manualEnd   ? new Date(`${manualDate}T${manualEnd}`).toISOString()   : null;
        await createSession({
          task, description, github_pr: githubPR, pr_status: prStatus,
          duration_minutes: minutes,
          date: manualDate || format(new Date(), "yyyy-MM-dd"),
          start_time: startISO, end_time: endISO,
        });
        toast("Session saved.", "success");
      }

    } else {
      // Timer-based — compute focus score
      const endISO = new Date().toISOString();
      const score = focusScore;
      if (split) {
        const parent = await createSession({
          task, description, github_pr: githubPR, pr_status: prStatus,
          ...split.first, is_split: true, focus_score: score,
        }, pauseLog);
        if (parent) {
          await createSession({
            task, description, github_pr: githubPR, pr_status: prStatus,
            ...split.second, is_split: true, parent_session_id: parent.id,
          });
        }
        toast("Session split across midnight and saved.", "success");
      } else {
        await createSession({
          task, description, github_pr: githubPR, pr_status: prStatus,
          duration_minutes: durationMinutes,
          date: format(new Date(), "yyyy-MM-dd"),
          start_time: punchedInAt ?? null,
          end_time: endISO,
          focus_score: score,
        }, pauseLog);
        toast("Session saved.", "success");
      }
      resetTimer?.();
    }

    setLoading(false);
    setOpen(false);
  }

  const title = isEditMode ? "Edit Session" : isManual ? "Add Session Manually" : "Save Session";
  const activeSplit = split || manualSplit;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto pr-1 space-y-4">
          {/* Timer punch info + focus score */}
          {!isEditMode && !isManual && punchedInAt && (
            <div className="rounded-lg bg-muted px-4 py-2.5 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">
                  <span className="font-medium text-foreground">In:</span>{" "}
                  {new Date(punchedInAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  {" → "}
                  <span className="font-medium text-foreground">Out:</span>{" "}
                  {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  {pauseLog && pauseLog.length > 0 && (
                    <span className="ml-2 text-amber-600 dark:text-amber-400">
                      · {pauseLog.length} pause{pauseLog.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </span>
                {focusScore !== null && <FocusBadge score={focusScore} />}
              </div>
            </div>
          )}

          {/* Midnight split */}
          {activeSplit && (
            <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
              <SplitSquareHorizontal className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-medium">Session crosses midnight — will be split</p>
                <p className="mt-0.5 text-xs opacity-80">
                  <span className="font-medium">{activeSplit.first.date}:</span> {activeSplit.first.duration_minutes}m
                  {" · "}
                  <span className="font-medium">{activeSplit.second.date}:</span> {activeSplit.second.duration_minutes}m
                </p>
              </div>
            </div>
          )}

          {/* Templates picker */}
          <div className="relative">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowTemplates((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-dashed px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <Bookmark className="size-3.5" />
                Templates
                <ChevronDown className={cn("size-3 transition-transform", showTemplates && "rotate-180")} />
              </button>
              {task.trim() && (
                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-dashed px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <BookmarkPlus className="size-3.5" />
                  Save as template
                </button>
              )}
            </div>

            {showTemplates && (
              <div className="absolute left-0 top-full z-10 mt-1 w-72 rounded-xl border bg-popover p-1.5 shadow-lg">
                {templates.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-muted-foreground">No templates yet. Fill in a task and click "Save as template".</p>
                ) : (
                  <div className="space-y-0.5">
                    {templates.map((t) => (
                      <div key={t.id} className="flex items-center gap-1 rounded-lg px-2 py-1.5 hover:bg-muted">
                        <button
                          className="flex-1 text-left"
                          onClick={() => applyTemplate(t)}
                        >
                          <p className="text-sm font-medium">{t.name}</p>
                          {t.description && (
                            <p className="truncate text-xs text-muted-foreground">{t.description}</p>
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(t.id)}
                          className="shrink-0 rounded p-1 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Input placeholder="Task title" value={task} onChange={(e) => setTask(e.target.value)} />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <Textarea
            placeholder="Description — what did you work on?"
            rows={3}
            value={description}
            onChange={(e) => setDesc(e.target.value)}
          />

          <div className="relative">
            <Globe className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="GitHub PR link (optional)"
              value={githubPR}
              onChange={(e) => setGithubPR(e.target.value)}
            />
          </div>

          {githubPR && (
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">PR Status</label>
              <div className="flex flex-wrap gap-2">
                {PR_STATUS_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setPrStatus(value)}
                    className={
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors " +
                      (prStatus === value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:bg-muted")
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isManual && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Date</label>
                <Input type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Start</label>
                  <Input type="time" value={manualStart} onChange={(e) => setManualStart(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">End</label>
                  <Input type="time" value={manualEnd} onChange={(e) => setManualEnd(e.target.value)} />
                </div>
              </div>
              {!manualSplit && (
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Duration (minutes)</label>
                  <Input type="number" min={0} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} />
                </div>
              )}
            </div>
          )}

          {isEditMode && (
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Duration (minutes)</label>
              <Input type="number" min={0} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} />
            </div>
          )}

          <Button className="w-full" onClick={handleSave} disabled={loading}>
            {loading ? "Saving…" : isEditMode ? "Save Changes" : "Save Session"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
