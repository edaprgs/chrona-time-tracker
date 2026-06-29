"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SessionDialog from "./SessionDialog";
import PauseReasonDialog from "./PauseReasonDialog";
import {
  Play, Pause, Square, PlusCircle, Coffee,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PauseEntry } from "@/types/activity";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useToast } from "@/hooks/useToast";

const STORAGE_KEY = "chrona_timer";
const IDLE_AUTO_PAUSE_MS = 30 * 60 * 1000; // auto-pause after 30 min idle
const IDLE_CHECK_MS = 60 * 1000;

interface TimerState {
  startedAt: number | null;
  accumulatedSeconds: number;
  isRunning: boolean;
  punchedInAt: string | null;
  lastInteractionAt: number | null;
  pauseLog: PauseEntry[];
  currentPauseStartedAt: string | null;
}

function loadState(): TimerState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return emptyState();
}

function emptyState(): TimerState {
  return {
    startedAt: null,
    accumulatedSeconds: 0,
    isRunning: false,
    punchedInAt: null,
    lastInteractionAt: null,
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
  const { workspaceName } = useWorkspace();
  const { toast } = useToast();
  const [timerState, setTimerState] = useState<TimerState>(loadState);
  const [displaySeconds, setDisplaySeconds] = useState(() => computeSeconds(loadState()));
  const [openDialog, setOpenDialog] = useState(false);
  const [openManualDialog, setOpenManualDialog] = useState(false);
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const idleCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleInteraction = useCallback(() => {
    setTimerState((prev) => {
      if (!prev.isRunning) return prev;
      const next = { ...prev, lastInteractionAt: Date.now() };
      saveState(next);
      return next;
    });
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleInteraction, { passive: true });
    window.addEventListener("keydown", handleInteraction, { passive: true });
    window.addEventListener("click", handleInteraction, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
      window.removeEventListener("click", handleInteraction);
    };
  }, [handleInteraction]);

  useEffect(() => {
    if (timerState.isRunning) {
      tickRef.current = setInterval(() => setDisplaySeconds(computeSeconds(timerState)), 1000);
    } else {
      if (tickRef.current) clearInterval(tickRef.current);
      setDisplaySeconds(computeSeconds(timerState));
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [timerState]);

  useEffect(() => {
    if (!timerState.isRunning) {
      if (idleCheckRef.current) clearInterval(idleCheckRef.current);
      return;
    }
    idleCheckRef.current = setInterval(() => {
      const lastActivity = timerState.lastInteractionAt ?? timerState.startedAt ?? Date.now();
      const idleMs = Date.now() - lastActivity;
      if (idleMs >= IDLE_AUTO_PAUSE_MS) {
        const idleMin = Math.round(idleMs / 60000);
        const reason = `Auto-paused: ${idleMin}min idle`;
        const now = new Date().toISOString();
        const newEntry: PauseEntry = { pausedAt: now, resumedAt: null, reason };
        setTimerState((prev) => {
          if (!prev.isRunning) return prev;
          const next: TimerState = {
            startedAt: null,
            accumulatedSeconds: computeSeconds(prev),
            isRunning: false,
            punchedInAt: prev.punchedInAt,
            lastInteractionAt: Date.now(),
            pauseLog: [...prev.pauseLog, newEntry],
            currentPauseStartedAt: now,
          };
          saveState(next);
          return next;
        });
        toast(`Timer auto-paused — no activity for ${idleMin} min. Resume when you're back.`, "destructive");
        broadcastTimerEvent("pause");
      }
    }, IDLE_CHECK_MS);
    return () => { if (idleCheckRef.current) clearInterval(idleCheckRef.current); };
  }, [timerState, toast]);

  useEffect(() => {
    document.title = timerState.isRunning
      ? `${formatTime(displaySeconds)} · ${workspaceName}`
      : "Chrona";
  }, [displaySeconds, timerState.isRunning, workspaceName]);

  function handleStart() {
    const now = Date.now();
    const isFirstStart = !timerState.punchedInAt;
    const next: TimerState = {
      ...timerState,
      startedAt: now,
      isRunning: true,
      punchedInAt: timerState.punchedInAt ?? new Date(now).toISOString(),
      lastInteractionAt: now,
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
    const newEntry: PauseEntry = { pausedAt: now, resumedAt: null, reason };
    const next: TimerState = {
      startedAt: null,
      accumulatedSeconds: computeSeconds(timerState),
      isRunning: false,
      punchedInAt: timerState.punchedInAt,
      lastInteractionAt: Date.now(),
      pauseLog: [...timerState.pauseLog, newEntry],
      currentPauseStartedAt: now,
    };
    saveState(next);
    setTimerState(next);
    setShowPauseDialog(false);
    broadcastTimerEvent("pause");
  }

  function handleStop() {
    if (displaySeconds === 0) return;
    const next: TimerState = {
      ...timerState,
      startedAt: null,
      accumulatedSeconds: computeSeconds(timerState),
      isRunning: false,
      lastInteractionAt: Date.now(),
    };
    saveState(next);
    setTimerState(next);
    setOpenDialog(true);
    broadcastTimerEvent("punch-out");
  }

  function resetTimer() {
    clearState();
    const fresh = emptyState();
    setTimerState(fresh);
    setDisplaySeconds(0);
  }

  const punchInLabel = timerState.punchedInAt
    ? new Date(timerState.punchedInAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : null;

  const pauseCount = timerState.pauseLog.length;
  const isIdle = !timerState.isRunning && !timerState.punchedInAt;
  const isPaused = !timerState.isRunning && !!timerState.punchedInAt;
  const isRecording = timerState.isRunning;

  return (
    <>
      <Card
        className={cn(
          "relative overflow-hidden border-2 transition-colors duration-500",
          isRecording
            ? "border-primary/40 bg-primary/[0.03]"
            : isPaused
            ? "border-amber-400/40 bg-amber-50/40 dark:bg-amber-950/10"
            : "border-border"
        )}
      >
        {/* Subtle top accent bar */}
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-0.5 transition-colors duration-500",
            isRecording ? "bg-primary" : isPaused ? "bg-amber-400" : "bg-transparent"
          )}
        />

        <CardContent className="px-4 py-5 md:px-8 md:py-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            {/* Left — time display + status */}
            <div className="flex items-center gap-4 md:gap-6">
              {/* Animated clock face */}
              <div className="relative shrink-0">
                {isRecording && (
                  <span className="absolute inset-0 rounded-2xl animate-ping bg-primary/15 duration-1000" />
                )}
                <svg
                  viewBox="0 0 32 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="size-20 drop-shadow-sm"
                >
                  <style>{`
                    .clock-bg-rec   { fill: #ec4899; }
                    .clock-bg-pause { fill: #f59e0b; }
                    .clock-bg-idle  { fill: #e2e8f0; }
                    .clock-hand-min {
                      transform-origin: 16px 20px;
                      animation: clockSweepMin 3600s linear infinite;
                    }
                    .clock-hand-sec {
                      transform-origin: 16px 20px;
                      animation: clockTickSec 60s steps(60, end) infinite;
                    }
                    .clock-hand-sec-paused {
                      transform-origin: 16px 20px;
                      animation: none;
                    }
                    .clock-center-pulse {
                      animation: clockCenterPulse 1s ease-in-out infinite;
                    }
                    @keyframes clockSweepMin {
                      from { transform: rotate(0deg); }
                      to   { transform: rotate(360deg); }
                    }
                    @keyframes clockTickSec {
                      from { transform: rotate(0deg); }
                      to   { transform: rotate(360deg); }
                    }
                    @keyframes clockCenterPulse {
                      0%, 100% { opacity: 1; r: 1.2; }
                      50%      { opacity: 0.6; r: 1.6; }
                    }
                  `}</style>

                  {/* Background */}
                  <rect
                    width="32" height="32" rx="7"
                    className={isRecording ? "clock-bg-rec" : isPaused ? "clock-bg-pause" : "clock-bg-idle"}
                  />
                  <rect width="32" height="32" rx="7" fill="white" fillOpacity="0.1" />

                  {/* Crown bar */}
                  <path d="M11 6h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  {/* Stem */}
                  <path d="M16 6v3" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  {/* Side button */}
                  <path d="M23 14l1.4-1.4" stroke="white" strokeWidth="1.8" strokeLinecap="round" />

                  {/* Clock body */}
                  <circle cx="16" cy="20" r="8.5" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="1.8" />

                  {/* Minute hand */}
                  <g className="clock-hand-min">
                    <line x1="16" y1="20" x2="16" y2="13.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
                  </g>

                  {/* Second hand — only animates when recording */}
                  <g className={isRecording ? "clock-hand-sec" : "clock-hand-sec-paused"}>
                    <line
                      x1="16" y1="20" x2="20.5" y2="16"
                      stroke="white" strokeWidth="1" strokeLinecap="round"
                      opacity={isIdle ? 0.3 : 0.9}
                    />
                  </g>

                  {/* Center dot */}
                  <circle cx="16" cy="20" r="1.2" fill="white" className={isRecording ? "clock-center-pulse" : ""} />
                </svg>
              </div>

              {/* Time + meta */}
              <div className="space-y-1">
                {/* Status chip */}
                <div className="flex items-center gap-2">
                  {isRecording && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                      Recording
                    </span>
                  )}
                  {isPaused && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                      <Coffee className="size-3" />
                      Paused
                    </span>
                  )}
                  {isIdle && (
                    <span className="text-xs font-medium text-muted-foreground">Ready to start</span>
                  )}
                </div>

                {/* Big time */}
                <p
                  className={cn(
                    "font-mono text-5xl font-bold tabular-nums leading-none tracking-tight",
                    isRecording ? "text-primary" : isPaused ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                  )}
                >
                  {formatTime(displaySeconds)}
                </p>

                {/* Context pills */}
                <div className="flex flex-wrap items-center gap-3 pt-0.5">
                  {punchInLabel && (
                    <span className="text-xs text-muted-foreground">
                      Punched in <span className="font-medium text-foreground">{punchInLabel}</span>
                    </span>
                  )}
                  {pauseCount > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      <Coffee className="size-3" />
                      {pauseCount} pause{pauseCount !== 1 ? "s" : ""}
                    </span>
                  )}
                  {displaySeconds > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {(displaySeconds / 3600).toFixed(2)}h elapsed
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right — actions */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="lg"
                  onClick={handleStart}
                  disabled={isRecording}
                  className="gap-2 px-6"
                >
                  <Play className="size-4" />
                  {timerState.punchedInAt ? "Resume" : "Punch In"}
                </Button>

                <Button
                  size="lg"
                  variant="secondary"
                  onClick={handlePauseRequest}
                  disabled={!isRecording}
                  className="gap-2"
                >
                  <Pause className="size-4" />
                  Pause
                </Button>

                <Button
                  size="lg"
                  variant={isPaused ? "default" : "outline"}
                  onClick={handleStop}
                  disabled={displaySeconds === 0}
                  className={cn("gap-2", isPaused && "border-destructive/30 bg-destructive text-destructive-foreground hover:bg-destructive/90")}
                >
                  <Square className="size-4" />
                  Punch Out
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="gap-2 justify-start text-muted-foreground text-xs"
                onClick={() => setOpenManualDialog(true)}
              >
                <PlusCircle className="size-3.5" />
                Add session manually
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
