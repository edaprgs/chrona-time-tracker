"use client";

import { useEffect, useState } from "react";
import { Play, Square, GitCommit, FileCode2, Globe, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type Phase = "idle" | "recording" | "summary";

interface ActivityItem {
  icon: typeof FileCode2;
  label: string;
  color: string;
}

const ACTIVITIES: ActivityItem[] = [
  { icon: FileCode2,  label: "Edited Timer.tsx (+18 lines)", color: "text-violet-500" },
  { icon: GitCommit,  label: "Committed: \"fix punch state\"", color: "text-emerald-500" },
  { icon: Globe,      label: "Visited GitHub - 2m 14s",       color: "text-sky-500" },
];

const WEEK_BARS = [40, 55, 35, 70, 0]; // Mon–Fri base heights, last one is "today"

function formatTime(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export default function LandingDemo() {
  const [phase, setPhase]   = useState<Phase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [activityCount, setActivityCount] = useState(0);

  // Auto-play the demo so the hero feels alive even before anyone clicks.
  useEffect(() => {
    if (phase !== "idle") return;
    const t = setTimeout(() => setPhase("recording"), 1400);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "recording") return;
    setSeconds(0);
    setActivityCount(0);

    const tick = setInterval(() => setSeconds((s) => s + 1), 1000);
    const reveal = setInterval(() => {
      setActivityCount((c) => (c < ACTIVITIES.length ? c + 1 : c));
    }, 1600);
    const stop = setTimeout(() => setPhase("summary"), 8000);

    return () => { clearInterval(tick); clearInterval(reveal); clearTimeout(stop); };
  }, [phase]);

  useEffect(() => {
    if (phase !== "summary") return;
    const t = setTimeout(() => setPhase("idle"), 3200);
    return () => clearTimeout(t);
  }, [phase]);

  const isRecording = phase === "recording";
  const isSummary   = phase === "summary";
  const earned      = ((seconds / 3600) * 35).toFixed(2);

  return (
    <div className="w-full max-w-md rounded-2xl border bg-card/95 p-5 shadow-2xl shadow-primary/10 backdrop-blur-sm">
      {/* Fake browser chrome */}
      <div className="mb-4 flex items-center gap-1.5">
        <span className="size-2.5 rounded-full bg-red-400/70" />
        <span className="size-2.5 rounded-full bg-amber-400/70" />
        <span className="size-2.5 rounded-full bg-emerald-400/70" />
        <span className="ml-2 text-[11px] text-muted-foreground">chrona.app</span>
      </div>

      {/* Timer card */}
      <div className={cn(
        "relative overflow-hidden rounded-xl border-2 p-4 transition-colors duration-500",
        isRecording ? "border-primary/40 bg-primary/[0.03]" : "border-border"
      )}>
        <div className="absolute inset-x-0 top-0 h-0.5 transition-colors duration-500"
          style={{ backgroundColor: isRecording ? "var(--primary)" : "transparent" }} />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isRecording && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                Recording
              </span>
            )}
            {!isRecording && !isSummary && (
              <span className="text-[11px] font-medium text-muted-foreground">Ready to start</span>
            )}
            {isSummary && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Session saved
              </span>
            )}
          </div>
          <Zap className="size-3.5 text-amber-500" />
        </div>

        <p className={cn(
          "mt-1 font-mono text-3xl font-bold tabular-nums tracking-tight transition-colors",
          isRecording ? "text-primary" : "text-muted-foreground"
        )}>
          {formatTime(isSummary ? seconds : seconds)}
        </p>

        {isSummary ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Earned this session: <span className="font-semibold text-foreground">${earned}</span>
          </p>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">Fix login bug - Nudgine LLC</p>
        )}

        <button
          disabled
          className={cn(
            "mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-colors",
            isRecording
              ? "bg-destructive/10 text-destructive"
              : "bg-primary text-primary-foreground"
          )}
        >
          {isRecording ? <Square className="size-3.5" /> : <Play className="size-3.5" />}
          {isRecording ? "Punch Out" : "Punch In"}
        </button>
      </div>

      {/* Live activity feed */}
      <div className="mt-4 space-y-1.5">
        <p className="px-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
          Auto-tracked activity
        </p>
        <div className="min-h-[88px] space-y-1">
          {ACTIVITIES.slice(0, activityCount).map(({ icon: Icon, label, color }, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-lg bg-muted/40 px-2.5 py-1.5 text-[11px] animate-in fade-in slide-in-from-bottom-1 duration-300"
            >
              <Icon className={cn("size-3.5 shrink-0", color)} />
              <span className="truncate text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mini weekly chart */}
      <div className="mt-3 flex items-end gap-1.5 px-0.5">
        {WEEK_BARS.map((h, i) => {
          const isToday = i === WEEK_BARS.length - 1;
          const height = isToday ? Math.min(70, (seconds / 8) * 1.2 + 8) : h;
          return (
            <div key={i} className="flex-1">
              <div
                className={cn(
                  "rounded-t-sm transition-all duration-300",
                  isToday ? "bg-primary" : "bg-muted"
                )}
                style={{ height: `${Math.max(4, height)}px` }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
