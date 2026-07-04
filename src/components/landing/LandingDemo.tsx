"use client";

import { useEffect, useState } from "react";
import { Play, Square, Pause, GitCommit, FileCode2, Globe, Zap, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";

type Phase = "idle" | "recording" | "paused" | "summary";

interface ActivityItem {
  icon: typeof FileCode2;
  label: string;
  color: string;
}

const ACTIVITIES: ActivityItem[] = [
  { icon: FileCode2, label: "Edited Timer.tsx (+18 lines)",    color: "text-violet-500" },
  { icon: GitCommit, label: 'Committed: "fix punch state"',    color: "text-emerald-500" },
  { icon: Globe,     label: "Visited GitHub - 2m 14s",         color: "text-sky-500" },
  { icon: FileCode2, label: "Edited InvoiceTable.tsx (+9)",    color: "text-violet-500" },
];

const WEEK_BARS = [40, 55, 30, 70, 0];

function formatTime(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export default function LandingDemo() {
  const [phase, setPhase]           = useState<Phase>("idle");
  const [seconds, setSeconds]       = useState(0);
  const [activityCount, setActivityCount] = useState(0);
  const [focusScore, setFocusScore] = useState(0);

  useEffect(() => {
    if (phase !== "idle") return;
    const t = setTimeout(() => setPhase("recording"), 1200);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "recording") return;
    setSeconds(0); setActivityCount(0); setFocusScore(0);

    const tick    = setInterval(() => setSeconds((s) => s + 1), 1000);
    const reveal  = setInterval(() => setActivityCount((c) => Math.min(c + 1, ACTIVITIES.length)), 1800);
    const focus   = setInterval(() => setFocusScore((f) => Math.min(f + 7, 87)), 900);
    const pause   = setTimeout(() => setPhase("paused"), 7200);
    return () => { clearInterval(tick); clearInterval(reveal); clearInterval(focus); clearTimeout(pause); };
  }, [phase]);

  useEffect(() => {
    if (phase !== "paused") return;
    const t = setTimeout(() => setPhase("summary"), 2000);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "summary") return;
    const t = setTimeout(() => setPhase("idle"), 3400);
    return () => clearTimeout(t);
  }, [phase]);

  const isRecording = phase === "recording";
  const isPaused    = phase === "paused";
  const isSummary   = phase === "summary";
  const earned      = ((seconds / 3600) * 35).toFixed(2);

  return (
    <div className="w-full max-w-sm rounded-2xl border bg-card/95 p-5 shadow-2xl shadow-primary/10 backdrop-blur-sm">
      {/* Fake browser chrome */}
      <div className="mb-4 flex items-center gap-1.5">
        <span className="size-2.5 rounded-full bg-red-400/70" />
        <span className="size-2.5 rounded-full bg-amber-400/70" />
        <span className="size-2.5 rounded-full bg-emerald-400/70" />
        <span className="ml-2 text-[11px] text-muted-foreground">chrona.app/dashboard</span>
      </div>

      {/* Timer card */}
      <div className={cn(
        "relative overflow-hidden rounded-xl border-2 p-4 transition-all duration-500",
        isRecording ? "border-primary/50 bg-primary/[0.03]" : isPaused ? "border-amber-400/50 bg-amber-500/[0.03]" : "border-border"
      )}>
        <div className="absolute inset-x-0 top-0 h-0.5 transition-all duration-500"
          style={{ backgroundColor: isRecording ? "var(--primary)" : isPaused ? "rgb(251 191 36 / 0.8)" : "transparent" }} />

        <div className="flex items-center justify-between">
          <div>
            {isRecording && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                Recording
              </span>
            )}
            {isPaused && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                <Coffee className="size-3" /> Paused
              </span>
            )}
            {isSummary && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Session saved
              </span>
            )}
            {!isRecording && !isPaused && !isSummary && (
              <span className="text-[11px] font-medium text-muted-foreground">Ready</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {focusScore > 0 && (
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold transition-all duration-300",
                focusScore >= 80 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              )}>
                <Zap className="size-2.5" />{focusScore}%
              </span>
            )}
          </div>
        </div>

        <p className={cn(
          "mt-1 font-mono text-3xl font-bold tabular-nums tracking-tight transition-colors duration-300",
          isRecording ? "text-primary" : isPaused ? "text-amber-500" : "text-muted-foreground"
        )}>
          {formatTime(seconds)}
        </p>

        {isSummary ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Earned: <span className="font-semibold text-foreground">${earned}</span>
          </p>
        ) : (
          <p className="mt-1 truncate text-xs text-muted-foreground">Fix login bug - Nudgine LLC</p>
        )}

        <div className="mt-3 flex gap-2">
          <button disabled className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-colors",
            isRecording ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            : isPaused ? "bg-primary/10 text-primary"
            : "bg-primary text-primary-foreground"
          )}>
            {isRecording ? <><Pause className="size-3" /> Pause</> : isPaused ? <><Play className="size-3" /> Resume</> : <><Play className="size-3" /> Punch In</>}
          </button>
          {(isRecording || isPaused) && (
            <button disabled className="flex items-center justify-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive">
              <Square className="size-3" /> Out
            </button>
          )}
        </div>
      </div>

      {/* Live activity feed */}
      <div className="mt-3 space-y-1">
        <p className="px-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          Auto-tracked
        </p>
        <div className="min-h-[76px] space-y-1">
          {ACTIVITIES.slice(0, activityCount).map(({ icon: Icon, label, color }, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg bg-muted/40 px-2.5 py-1.5 text-[11px] animate-in fade-in slide-in-from-bottom-1 duration-300">
              <Icon className={cn("size-3.5 shrink-0", color)} />
              <span className="truncate text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mini weekly chart */}
      <div className="mt-3 space-y-1">
        <p className="px-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">This week</p>
        <div className="flex items-end gap-1 px-0.5" style={{ height: 44 }}>
          {WEEK_BARS.map((h, i) => {
            const isToday = i === WEEK_BARS.length - 1;
            const height  = isToday ? Math.min(44, (seconds / 8) * 1.4 + 6) : h * 0.55;
            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-0.5">
                <div
                  className={cn("w-full rounded-t-sm transition-all duration-500", isToday ? "bg-primary" : "bg-muted")}
                  style={{ height: Math.max(4, height) }}
                />
                <span className="text-[8px] text-muted-foreground/50">
                  {["M","T","W","T","F"][i]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
