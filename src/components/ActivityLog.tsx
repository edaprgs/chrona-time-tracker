"use client";

import { useEffect, useState, useCallback } from "react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/useToast";
import type { ActivityEvent, ActivityEventType } from "@/types/activity";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Globe, Terminal, GitCommit, Bug, FlaskConical, FileCode2, FilePlus,
  FilePen, MessageSquare, LayoutGrid, BookOpen, Pencil, Trash2,
  Plus, ClipboardList, ChevronDown, ChevronUp, Loader2, GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Config ──────────────────────────────────────────────────────────────────

const MANUAL_TYPES: { value: ActivityEventType; label: string; icon: React.ElementType }[] = [
  { value: "manual_browser",  label: "Browsed Internet",  icon: Globe         },
  { value: "manual_sprint",   label: "Visited Sprint",    icon: LayoutGrid    },
  { value: "manual_review",   label: "Reviewed PR / Code",icon: BookOpen      },
  { value: "manual_meeting",  label: "Meeting / Call",    icon: MessageSquare },
  { value: "manual_other",    label: "Other",             icon: ClipboardList },
];

const EVENT_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  file_open:       { label: "Opened file",   icon: FilePlus,    color: "text-sky-500"     },
  file_save:       { label: "Saved file",    icon: FileCode2,   color: "text-primary"     },
  file_edit:       { label: "Edited file",   icon: FilePen,     color: "text-violet-500"  },
  terminal:        { label: "Terminal",      icon: Terminal,    color: "text-amber-500"   },
  git_commit:      { label: "Git commit",    icon: GitCommit,   color: "text-emerald-500" },
  browser_visit:   { label: "Browser",       icon: Globe,       color: "text-sky-500"     },
  debug:           { label: "Debug",         icon: Bug,         color: "text-red-500"     },
  test_run:        { label: "Tests",         icon: FlaskConical,color: "text-orange-500"  },
  manual_browser:  { label: "Browser",       icon: Globe,       color: "text-sky-500"     },
  manual_sprint:   { label: "Sprint",        icon: LayoutGrid,  color: "text-indigo-500"  },
  manual_review:   { label: "PR Review",     icon: BookOpen,    color: "text-violet-500"  },
  manual_meeting:  { label: "Meeting",       icon: MessageSquare,color:"text-amber-500"   },
  manual_other:    { label: "Activity",      icon: ClipboardList,color:"text-muted-foreground"},
};

function eventLabel(e: ActivityEvent): string {
  const meta = EVENT_META[e.event_type];
  if (e.note) return e.note;
  if (e.file_path) {
    const parts = e.file_path.replace(/\\/g, "/").split("/");
    return parts.slice(-2).join("/");
  }
  if (e.git_branch) return `Branch: ${e.git_branch}`;
  return meta?.label ?? e.event_type;
}

function dayLabel(iso: string) {
  const d = parseISO(iso);
  if (isToday(d))     return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEEE, MMM d");
}

function friendlyDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function groupByDay(events: ActivityEvent[]) {
  const map: Record<string, ActivityEvent[]> = {};
  for (const e of events) {
    const day = e.timestamp.slice(0, 10);
    (map[day] ??= []).push(e);
  }
  return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
}

// ─── Add/Edit Dialog ─────────────────────────────────────────────────────────

interface EntryDialogProps {
  open: boolean;
  initial?: ActivityEvent | null;
  onClose: () => void;
  onSave: (type: ActivityEventType, note: string, time: string) => Promise<void>;
}

function EntryDialog({ open, initial, onClose, onSave }: EntryDialogProps) {
  const [type, setType]   = useState<ActivityEventType>("manual_browser");
  const [note, setNote]   = useState("");
  const [time, setTime]   = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setType(initial.event_type);
      setNote(initial.note ?? "");
      setTime(format(new Date(initial.timestamp), "HH:mm"));
    } else {
      setType("manual_browser");
      setNote("");
      setTime(format(new Date(), "HH:mm"));
    }
  }, [open, initial]);

  async function handleSave() {
    if (!note.trim()) return;
    setSaving(true);
    await onSave(type, note.trim(), time);
    setSaving(false);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Activity" : "Add Activity"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Type picker */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Activity type</label>
            <div className="grid grid-cols-1 gap-1.5">
              {MANUAL_TYPES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all",
                    type === value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">What did you do?</label>
            <Input
              placeholder="e.g. Reviewed sprint board, fixed login bug…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              autoFocus
            />
          </div>

          {/* Time */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Time</label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-36"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !note.trim()}>
            {saving ? "Saving…" : initial ? "Save Changes" : "Add Activity"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const PAGE = 3; // days to load at a time

export default function ActivityLog() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [events, setEvents]             = useState<ActivityEvent[]>([]);
  const [loading, setLoading]           = useState(true);
  const [deletingId, setDeletingId]     = useState<string | null>(null);
  const [confirmId, setConfirmId]       = useState<string | null>(null);
  const [editTarget, setEditTarget]     = useState<ActivityEvent | null>(null);
  const [showAdd, setShowAdd]           = useState(false);
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());
  const [daysLoaded, setDaysLoaded]     = useState(PAGE);

  const fetchEvents = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const since = new Date();
    since.setDate(since.getDate() - daysLoaded);
    const { data } = await supabase
      .from("activity_events")
      .select("*")
      .eq("user_id", user.id)
      .gte("timestamp", since.toISOString())
      .order("timestamp", { ascending: false });
    setEvents(data ?? []);
    setLoading(false);
  }, [user, daysLoaded]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Live updates — new activity (from VS Code, Chrome, or manual entries)
  // appears instantly without a page refresh via Supabase Realtime.
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`activity_events:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_events", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setEvents((prev) => {
            if (prev.some((e) => e.id === payload.new.id)) return prev;
            return [payload.new as ActivityEvent, ...prev].sort(
              (a, b) => b.timestamp.localeCompare(a.timestamp)
            );
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "activity_events", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setEvents((prev) => prev.map((e) => (e.id === payload.new.id ? (payload.new as ActivityEvent) : e)));
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "activity_events", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setEvents((prev) => prev.filter((e) => e.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  async function handleAdd(type: ActivityEventType, note: string, time: string) {
    if (!user) return;
    const [h, m]  = time.split(":").map(Number);
    const ts      = new Date();
    ts.setHours(h, m, 0, 0);
    await supabase.from("activity_events").insert({
      user_id:    user.id,
      event_type: type,
      note,
      timestamp:  ts.toISOString(),
    });
    toast("Activity added.", "success");
    fetchEvents();
  }

  async function handleEdit(type: ActivityEventType, note: string, time: string) {
    if (!editTarget) return;
    const [h, m] = time.split(":").map(Number);
    const ts     = new Date(editTarget.timestamp);
    ts.setHours(h, m, 0, 0);
    await supabase.from("activity_events")
      .update({ event_type: type, note, timestamp: ts.toISOString() })
      .eq("id", editTarget.id);
    toast("Activity updated.", "success");
    setEditTarget(null);
    fetchEvents();
  }

  async function handleDelete(id: string) {
    if (confirmId !== id) {
      setConfirmId(id);
      setTimeout(() => setConfirmId((p) => (p === id ? null : p)), 3000);
      return;
    }
    setDeletingId(id);
    await supabase.from("activity_events").delete().eq("id", id);
    setDeletingId(null);
    setConfirmId(null);
    toast("Activity deleted.", "success");
    fetchEvents();
  }

  function toggleDay(day: string) {
    setCollapsedDays((prev) => {
      const next = new Set(prev);
      next.has(day) ? next.delete(day) : next.add(day);
      return next;
    });
  }

  const groups = groupByDay(events);

  return (
    <>
      <Card>
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-muted">
                <ClipboardList className="size-3.5 text-muted-foreground" />
              </div>
              <div>
                <h2 className="font-semibold">Activity Log</h2>
                <p className="text-[11px] text-muted-foreground leading-none mt-0.5">
                  What you worked on, tracked automatically — edit or delete anything before it's submitted
                </p>
              </div>
            </div>
            <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1.5">
              <Plus className="size-3.5" />
              Add activity
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-14 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading activity…
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
                <ClipboardList className="size-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold">No activity yet</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Install the VS Code extension or add entries manually.
                </p>
              </div>
              <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1.5 mt-1">
                <Plus className="size-3.5" /> Add your first entry
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {groups.map(([day, dayEvents]) => {
                const collapsed = collapsedDays.has(day);
                const manualCount = dayEvents.filter((e) => e.event_type.startsWith("manual_")).length;
                const autoCount   = dayEvents.length - manualCount;

                return (
                  <div key={day}>
                    {/* Day header — clickable to collapse */}
                    <button
                      onClick={() => toggleDay(day)}
                      className="flex w-full items-center justify-between bg-muted/30 px-6 py-2.5 text-left hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {dayLabel(day)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {autoCount > 0 && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                              {autoCount} tracked
                            </span>
                          )}
                          {manualCount > 0 && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                              {manualCount} manual
                            </span>
                          )}
                        </div>
                      </div>
                      {collapsed
                        ? <ChevronDown className="size-3.5 text-muted-foreground" />
                        : <ChevronUp className="size-3.5 text-muted-foreground" />}
                    </button>

                    {!collapsed && (
                      <div className="divide-y divide-border/40">
                        {dayEvents.map((event) => {
                          const meta  = EVENT_META[event.event_type] ?? EVENT_META.manual_other;
                          const Icon  = meta.icon;
                          const isManual = event.event_type.startsWith("manual_");
                          const isPending = confirmId === event.id;

                          return (
                            <div
                              key={event.id}
                              className={cn(
                                "group flex items-center gap-4 px-6 py-3 transition-colors",
                                isPending ? "bg-destructive/5" : "hover:bg-muted/20"
                              )}
                            >
                              {/* Icon */}
                              <div className={cn(
                                "flex size-8 shrink-0 items-center justify-center rounded-lg",
                                isManual ? "bg-muted" : "bg-primary/5"
                              )}>
                                <Icon className={cn("size-4", meta.color)} />
                              </div>

                              {/* Content */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className={cn(
                                    "truncate text-sm font-medium",
                                    event.event_type === "git_commit" && "italic"
                                  )}>
                                    {event.event_type === "git_commit" ? `"${eventLabel(event)}"` : eventLabel(event)}
                                  </p>
                                  {typeof event.lines_changed === "number" && event.lines_changed !== 0 && (
                                    <span className={cn(
                                      "shrink-0 rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums",
                                      event.lines_changed > 0
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                        : "bg-red-500/10 text-red-600 dark:text-red-400"
                                    )}>
                                      {event.lines_changed > 0 ? "+" : ""}{event.lines_changed}
                                    </span>
                                  )}
                                  {event.event_type === "browser_visit" && typeof event.metadata?.duration_seconds === "number" && (
                                    <span className="shrink-0 rounded-full bg-muted px-1.5 py-px text-[10px] font-semibold tabular-nums text-muted-foreground">
                                      {friendlyDuration(event.metadata.duration_seconds as number)}
                                    </span>
                                  )}
                                </div>
                                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                                  <span className="tabular-nums">
                                    {format(new Date(event.timestamp), "h:mm a")}
                                  </span>
                                  <span className="opacity-40">·</span>
                                  <span>{meta.label}</span>
                                  {event.language && (
                                    <>
                                      <span className="opacity-40">·</span>
                                      <span className="capitalize">{event.language}</span>
                                    </>
                                  )}
                                  {event.git_branch && (
                                    <>
                                      <span className="opacity-40">·</span>
                                      <span className="inline-flex items-center gap-1">
                                        <GitBranch className="size-2.5" />
                                        {event.git_branch}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Actions — visible on hover or pending delete */}
                              <div className={cn(
                                "flex shrink-0 items-center gap-1 transition-opacity",
                                isPending ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                              )}>
                                {isManual && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7"
                                    onClick={() => setEditTarget(event)}
                                  >
                                    <Pencil className="size-3.5" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={cn(
                                    "size-7",
                                    isPending && "bg-destructive/10 text-destructive hover:bg-destructive/20"
                                  )}
                                  onClick={() => handleDelete(event.id)}
                                  disabled={deletingId === event.id}
                                >
                                  {deletingId === event.id
                                    ? <Loader2 className="size-3.5 animate-spin" />
                                    : <Trash2 className="size-3.5" />}
                                </Button>
                                {isPending && (
                                  <span className="text-[10px] text-destructive font-medium whitespace-nowrap">
                                    Click again to confirm
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Load more */}
              <div className="px-6 py-3 text-center">
                <button
                  onClick={() => setDaysLoaded((d) => d + PAGE)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Load older activity ↓
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add dialog */}
      <EntryDialog
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={handleAdd}
      />

      {/* Edit dialog */}
      <EntryDialog
        open={Boolean(editTarget)}
        initial={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleEdit}
      />
    </>
  );
}
