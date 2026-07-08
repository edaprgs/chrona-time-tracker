"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SessionDialog from "./SessionDialog";
import PauseReasonDialog from "./PauseReasonDialog";
import {
  Play, Pause, Square, PlusCircle, Coffee, Utensils,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PauseEntry } from "@/types/activity";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useStats } from "@/hooks/useStats";
import { useToast } from "@/hooks/useToast";
import { supabase } from "@/lib/supabase";

const STORAGE_KEY = "chrona_timer";

interface TimerState {
  startedAt: number | null;
  accumulatedSeconds: number;
  isRunning: boolean;
  isMealBreak: boolean;
  mealBreakStartedAt: number | null;
  punchedInAt: string | null;
  pauseLog: PauseEntry[];
  currentPauseStartedAt: string | null;
}

function loadState(): TimerState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...emptyState(), ...JSON.parse(raw) };
  } catch {}
  return emptyState();
}

function emptyState(): TimerState {
  return {
    startedAt: null,
    accumulatedSeconds: 0,
    isRunning: false,
    isMealBreak: false,
    mealBreakStartedAt: null,
    punchedInAt: null,
    pauseLog: [],
    currentPauseStartedAt: null,
  };
}

function saveState(state: TimerState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}

function broadcastTimerEvent(type: "punch-in" | "pause" | "resume" | "punch-out") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(`chrona:${type}`, { detail: { storageKey: STORAGE_KEY } }));
  pushLiveStatus(type);
}

async function pushLiveStatus(type: "punch-in" | "pause" | "resume" | "punch-out") {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) return;
  const is_punched_in = type !== "punch-out";
  const is_paused     = type === "pause";
  await supabase
    .from("live_status")
    .upsert({ user_id: userId, is_punched_in, is_paused, updated_at: new Date().toISOString() });
}

function computeSeconds(state: TimerState): number {
  if (state.isRunning && state.startedAt !== null) {
    return state.accumulatedSeconds + Math.floor((Date.now() - state.startedAt) / 1000);
  }
  return state.accumulatedSeconds;
}

function formatTime(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function Timer() {
  const { workspaceName, dailyTargetHours, weeklyHourCap, mealBreakMaxMinutes } = useWorkspace();
  const { weeklyHoursRaw, todayHoursRaw } = useStats();
  const { toast } = useToast();
  const [mounted, setMounted]         = useState(false);
  const [timerState, setTimerState]   = useState<TimerState>(loadState);
  const [displaySeconds, setDisplaySeconds] = useState(() => computeSeconds(loadState()));
  const [openDialog, setOpenDialog]         = useState(false);
  const [openManualDialog, setOpenManualDialog] = useState(false);
  const [showPauseDialog, setShowPauseDialog]   = useState(false);

  const tickRef             = useRef<ReturnType<typeof setInterval> | null>(null);
  const dailyCapNotifiedRef = useRef(false);
  const weeklyCapNotifiedRef = useRef(false);

  useEffect(() => { setMounted(true); }, []);

  // Tick
  useEffect(() => {
    if (timerState.isRunning) {
      tickRef.current = setInterval(() => setDisplaySeconds(computeSeconds(timerState)), 1000);
    } else {
      if (tickRef.current) clearInterval(tickRef.current);
      setDisplaySeconds(computeSeconds(timerState));
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [timerState]);

  // Soft daily cap notification — counts already-logged sessions today + current session
  useEffect(() => {
    if (!timerState.isRunning || dailyCapNotifiedRef.current) return;
    const capSeconds = dailyTargetHours * 3600;
    const alreadyTodaySeconds = todayHoursRaw * 3600;
    if (capSeconds > 0 && alreadyTodaySeconds + displaySeconds >= capSeconds) {
      dailyCapNotifiedRef.current = true;
      toast(
        `Daily target of ${dailyTargetHours.toFixed(1)}h reached. Punch out when you're ready — or keep going.`,
        "default"
      );
    }
  }, [displaySeconds, timerState.isRunning, dailyTargetHours, todayHoursRaw, toast]);

  // Soft weekly cap notification — same: timer keeps running
  useEffect(() => {
    if (!timerState.isRunning || weeklyCapNotifiedRef.current) return;
    const weeklyCapSeconds = weeklyHourCap * 3600;
    const alreadyLoggedSeconds = weeklyHoursRaw * 3600;
    if (weeklyCapSeconds > 0 && alreadyLoggedSeconds + displaySeconds >= weeklyCapSeconds) {
      weeklyCapNotifiedRef.current = true;
      toast(
        `Weekly cap of ${weeklyHourCap}h reached. Punch out when ready — or keep going.`,
        "default"
      );
    }
  }, [displaySeconds, timerState.isRunning, weeklyHourCap, weeklyHoursRaw, toast]);

  // Meal break auto-stop when max minutes reached
  useEffect(() => {
    if (!timerState.isMealBreak || mealBreakMaxMinutes === 0) return;
    const startedAt = timerState.mealBreakStartedAt;
    if (!startedAt) return;
    const elapsedMinutes = (Date.now() - startedAt) / 60000;
    if (elapsedMinutes >= mealBreakMaxMinutes) {
      toast(`Meal break of ${mealBreakMaxMinutes} min reached — ending break automatically.`, "default");
      const now = new Date().toISOString();
      const next: TimerState = {
        ...timerState,
        isMealBreak: false,
        mealBreakStartedAt: null,
        pauseLog: timerState.currentPauseStartedAt
          ? [
              ...timerState.pauseLog.slice(0, -1),
              { ...timerState.pauseLog[timerState.pauseLog.length - 1], resumedAt: now },
            ]
          : timerState.pauseLog,
        currentPauseStartedAt: null,
      };
      saveState(next);
      setTimerState(next);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displaySeconds]);

  useEffect(() => {
    document.title = timerState.isRunning
      ? `${formatTime(displaySeconds)} · ${workspaceName}`
      : "Chrona";
  }, [displaySeconds, timerState.isRunning, workspaceName]);

  function handleStart() {
    const now = Date.now();
    const isFirstStart = !timerState.punchedInAt;
    if (isFirstStart) {
      dailyCapNotifiedRef.current  = false;
      weeklyCapNotifiedRef.current = false;
    }
    const next: TimerState = {
      ...timerState,
      startedAt: now,
      isRunning: true,
      isMealBreak: false,
      mealBreakStartedAt: null,
      punchedInAt: timerState.punchedInAt ?? new Date(now).toISOString(),
      pauseLog: timerState.currentPauseStartedAt
        ? [
            ...timerState.pauseLog.slice(0, -1),
            { ...timerState.pauseLog[timerState.pauseLog.length - 1], resumedAt: new Date(now).toISOString() },
          ]
        : timerState.pauseLog,
      currentPauseStartedAt: null,
    };
    saveState(next);
    setTimerState(next);
    broadcastTimerEvent(isFirstStart ? "punch-in" : "resume");
  }

  function handlePauseRequest() {
    setShowPauseDialog(true);
  }

  function handlePauseConfirmed(reason: string) {
    const now = new Date().toISOString();
    const newEntry: PauseEntry = { pausedAt: now, resumedAt: null, reason, isMealBreak: false };
    const next: TimerState = {
      startedAt: null,
      accumulatedSeconds: computeSeconds(timerState),
      isRunning: false,
      isMealBreak: false,
      mealBreakStartedAt: null,
      punchedInAt: timerState.punchedInAt,
      pauseLog: [...timerState.pauseLog, newEntry],
      currentPauseStartedAt: now,
    };
    saveState(next);
    setTimerState(next);
    setShowPauseDialog(false);
    broadcastTimerEvent("pause");
  }

  // Meal break: clock keeps running, just marks the state
  function handleMealBreak() {
    const now = new Date().toISOString();
    const newEntry: PauseEntry = {
      pausedAt: now,
      resumedAt: null,
      reason: "Meal break",
      isMealBreak: true,
    };
    const next: TimerState = {
      ...timerState,
      isMealBreak: true,
      mealBreakStartedAt: Date.now(),
      pauseLog: [...timerState.pauseLog, newEntry],
      currentPauseStartedAt: now,
    };
    saveState(next);
    setTimerState(next);
    // VS Code extension: still punched in, just on meal break
    broadcastTimerEvent("resume");
  }

  function handleEndMealBreak() {
    const now = new Date().toISOString();
    const next: TimerState = {
      ...timerState,
      isMealBreak: false,
      mealBreakStartedAt: null,
      pauseLog: timerState.currentPauseStartedAt
        ? [
            ...timerState.pauseLog.slice(0, -1),
            { ...timerState.pauseLog[timerState.pauseLog.length - 1], resumedAt: now },
          ]
        : timerState.pauseLog,
      currentPauseStartedAt: null,
    };
    saveState(next);
    setTimerState(next);
  }

  function handleStop() {
    if (displaySeconds === 0) return;
    const next: TimerState = {
      ...timerState,
      startedAt: null,
      accumulatedSeconds: computeSeconds(timerState),
      isRunning: false,
      isMealBreak: false,
      pauseLog: timerState.currentPauseStartedAt
        ? [
            ...timerState.pauseLog.slice(0, -1),
            { ...timerState.pauseLog[timerState.pauseLog.length - 1], resumedAt: new Date().toISOString() },
          ]
        : timerState.pauseLog,
      currentPauseStartedAt: null,
    };
    saveState(next);
    setTimerState(next);
    setOpenDialog(true);
    broadcastTimerEvent("punch-out");
  }

  function resetTimer() {
    clearState();
    dailyCapNotifiedRef.current  = false;
    weeklyCapNotifiedRef.current = false;
    setTimerState(emptyState());
    setDisplaySeconds(0);
  }

  const punchInLabel = timerState.punchedInAt
    ? new Date(timerState.punchedInAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : null;

  const regularPauses = timerState.pauseLog.filter((p) => !p.isMealBreak);
  const pauseCount    = regularPauses.length;
  const isIdle        = !timerState.isRunning && !timerState.punchedInAt;
  const isPaused      = !timerState.isRunning && !!timerState.punchedInAt;
  const isMealBreak   = timerState.isRunning && timerState.isMealBreak;
  const isRecording   = timerState.isRunning && !timerState.isMealBreak;

  const capSeconds       = dailyTargetHours * 3600;
  const totalTodaySeconds = todayHoursRaw * 3600 + displaySeconds;
  const capProgress      = capSeconds > 0 ? Math.min(1, totalTodaySeconds / capSeconds) : 0;
  const weeklyRemaining  = Math.max(0, weeklyHourCap - weeklyHoursRaw);
  const weeklyCapHit     = weeklyHourCap > 0 && weeklyHoursRaw >= weeklyHourCap;

  return (
    <>
      <Card
        className={cn(
          "relative overflow-hidden border-2 transition-colors duration-500",
          mounted && isRecording
            ? "border-primary/40 bg-primary/[0.03]"
            : mounted && isMealBreak
            ? "border-emerald-400/40 bg-emerald-50/30 dark:bg-emerald-950/10"
            : mounted && isPaused
            ? "border-amber-400/40 bg-amber-50/40 dark:bg-amber-950/10"
            : "border-border"
        )}
      >
        {/* Top accent bar */}
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-0.5 transition-colors duration-500",
            mounted && isRecording ? "bg-primary"
            : mounted && isMealBreak ? "bg-emerald-400"
            : mounted && isPaused ? "bg-amber-400"
            : "bg-transparent"
          )}
        />

        {/* Daily cap progress bar */}
        {mounted && capSeconds > 0 && (timerState.isRunning || timerState.punchedInAt) && (
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-muted">
            <div
              className={cn(
                "h-full transition-all duration-1000",
                capProgress >= 1 ? "bg-destructive" : capProgress >= 0.9 ? "bg-amber-400" : "bg-primary/40"
              )}
              style={{ width: `${capProgress * 100}%` }}
            />
          </div>
        )}

        <CardContent className="px-4 py-5 md:px-8 md:py-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            {/* Left — time display */}
            <div className="flex items-center gap-3 md:gap-6">
              <div className="relative shrink-0">
                {mounted && (isRecording || isMealBreak) && (
                  <span className={cn(
                    "absolute inset-0 rounded-2xl animate-ping duration-1000",
                    isMealBreak ? "bg-emerald-400/15" : "bg-primary/15"
                  )} />
                )}
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"
                  className="size-14 md:size-20 drop-shadow-sm">
                  <style>{`
                    .clock-hand-min { transform-origin: 16px 20px; animation: clockSweepMin 3600s linear infinite; }
                    .clock-hand-sec { transform-origin: 16px 20px; animation: clockTickSec 60s steps(60,end) infinite; }
                    .clock-center-pulse { animation: clockCenterPulse 1s ease-in-out infinite; }
                    @keyframes clockSweepMin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
                    @keyframes clockTickSec  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
                    @keyframes clockCenterPulse { 0%,100%{opacity:1;r:1.2} 50%{opacity:.6;r:1.6} }
                  `}</style>
                  <rect width="32" height="32" rx="7" fill={
                    !mounted || isIdle ? "#e2e8f0"
                    : isRecording ? "#ec4899"
                    : isMealBreak ? "#10b981"
                    : "#f59e0b"
                  }/>
                  <rect width="32" height="32" rx="7" fill="white" fillOpacity="0.1"/>
                  <path d="M11 6h10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M16 6v3" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M23 14l1.4-1.4" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                  <circle cx="16" cy="20" r="8.5" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="1.8"/>
                  <g className="clock-hand-min">
                    <line x1="16" y1="20" x2="16" y2="13.5" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
                  </g>
                  <g className={mounted && (isRecording || isMealBreak) ? "clock-hand-sec" : ""}>
                    <line x1="16" y1="20" x2="20.5" y2="16" stroke="white" strokeWidth="1" strokeLinecap="round"
                      opacity={!mounted || isIdle ? 0.3 : 0.9}/>
                  </g>
                  <circle cx="16" cy="20" r="1.2" fill="white"
                    className={mounted && (isRecording || isMealBreak) ? "clock-center-pulse" : ""}/>
                </svg>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {mounted && isRecording && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      <span className="size-1.5 rounded-full bg-primary animate-pulse" /> Recording
                    </span>
                  )}
                  {mounted && isMealBreak && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                      <Utensils className="size-3" /> Meal Break
                    </span>
                  )}
                  {mounted && isPaused && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                      <Coffee className="size-3" /> Paused
                    </span>
                  )}
                  {(!mounted || isIdle) && (
                    <span className="text-xs font-medium text-muted-foreground">Ready to start</span>
                  )}
                </div>

                <p className={cn(
                  "font-mono text-4xl md:text-5xl font-bold tabular-nums leading-none tracking-tight",
                  mounted && isRecording ? "text-primary"
                  : mounted && isMealBreak ? "text-emerald-600 dark:text-emerald-400"
                  : mounted && isPaused ? "text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground"
                )}>
                  {mounted ? formatTime(displaySeconds) : "00:00:00"}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-0.5">
                  {mounted && punchInLabel && (
                    <span className="text-xs text-muted-foreground">
                      Punched in <span className="font-medium text-foreground">{punchInLabel}</span>
                    </span>
                  )}
                  {mounted && pauseCount > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      <Coffee className="size-3" />
                      {pauseCount} pause{pauseCount !== 1 ? "s" : ""}
                    </span>
                  )}
                  {mounted && capSeconds > 0 && totalTodaySeconds > 0 && (
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs",
                      capProgress >= 1 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : capProgress >= 0.9 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      : "bg-muted text-muted-foreground"
                    )}>
                      {(totalTodaySeconds / 3600).toFixed(2)}h / {dailyTargetHours.toFixed(1)}h today
                    </span>
                  )}
                  {mounted && weeklyCapHit && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2 py-0.5 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      Weekly cap hit
                    </span>
                  )}
                  {mounted && !weeklyCapHit && weeklyHourCap > 0 && weeklyRemaining < 2 && weeklyRemaining > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      {weeklyRemaining.toFixed(1)}h left this week
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right — actions */}
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center">

                {/* Punch In / Resume — always visible */}
                <Button
                  size="lg"
                  onClick={isMealBreak ? handleEndMealBreak : handleStart}
                  disabled={!mounted || isRecording}
                  className={cn(
                    "col-span-2 gap-2 md:col-span-1",
                    mounted && isMealBreak && "bg-emerald-600 hover:bg-emerald-700 text-white"
                  )}
                >
                  <Play className="size-4" />
                  {!mounted || isIdle ? "Punch In"
                    : isMealBreak ? "End Break"
                    : isPaused ? "Resume"
                    : "Punch In"}
                </Button>

                {/* Pause — shown when recording */}
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={handlePauseRequest}
                  disabled={!mounted || !isRecording}
                  className="gap-2"
                >
                  <Pause className="size-4" /> Pause
                </Button>

                {/* Meal Break — shown when recording, hidden during meal break */}
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleMealBreak}
                  disabled={!mounted || !isRecording}
                  className={cn(
                    "gap-2",
                    mounted && isRecording
                      ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                      : ""
                  )}
                >
                  <Utensils className="size-4" /> Meal Break
                </Button>

                {/* Punch Out — always visible */}
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleStop}
                  disabled={!mounted || displaySeconds === 0}
                  className="col-span-2 gap-2 md:col-span-1 border-destructive/30 text-destructive hover:bg-destructive/10 disabled:border-border disabled:text-muted-foreground"
                >
                  <Square className="size-4" /> Punch Out
                </Button>
              </div>

              <Button variant="ghost" size="sm" className="gap-2 justify-start text-muted-foreground text-xs"
                onClick={() => setOpenManualDialog(true)}>
                <PlusCircle className="size-3.5" /> Add session manually
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <PauseReasonDialog
        open={showPauseDialog}
        onConfirm={handlePauseConfirmed}
        onCancel={() => setShowPauseDialog(false)}
      />

      <SessionDialog
        open={openDialog}
        setOpen={setOpenDialog}
        durationSeconds={displaySeconds}
        punchedInAt={timerState.punchedInAt ?? undefined}
        pauseLog={timerState.pauseLog}
        resetTimer={resetTimer}
      />

      <SessionDialog
        open={openManualDialog}
        setOpen={setOpenManualDialog}
        isManual
        resetTimer={() => {}}
      />
    </>
  );
}
