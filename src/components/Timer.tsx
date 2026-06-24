/* src/components/Timer.tsx */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import SessionDialog from "./SessionDialog";
import { Play, Pause, Square, PlusCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "nudgine_timer";
const IDLE_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 hours
const IDLE_CHECK_MS = 60 * 1000; // check every minute

interface TimerState {
  startedAt: number | null;
  accumulatedSeconds: number;
  isRunning: boolean;
  punchedInAt: string | null;
  lastInteractionAt: number | null; // epoch ms of last user interaction
}

function loadState(): TimerState {
  if (typeof window === "undefined")
    return { startedAt: null, accumulatedSeconds: 0, isRunning: false, punchedInAt: null, lastInteractionAt: null };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { startedAt: null, accumulatedSeconds: 0, isRunning: false, punchedInAt: null, lastInteractionAt: null };
}

function saveState(state: TimerState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}

function computeSeconds(state: TimerState): number {
  if (state.isRunning && state.startedAt !== null) {
    return state.accumulatedSeconds + Math.floor((Date.now() - state.startedAt) / 1000);
  }
  return state.accumulatedSeconds;
}

function formatTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default function Timer() {
  const [timerState, setTimerState] = useState<TimerState>(loadState);
  const [displaySeconds, setDisplaySeconds] = useState(() => computeSeconds(loadState()));
  const [openDialog, setOpenDialog] = useState(false);
  const [openManualDialog, setOpenManualDialog] = useState(false);
  const [showIdleWarning, setShowIdleWarning] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const idleCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Record user interaction (mousemove, keydown, click) to reset idle clock
  const handleInteraction = useCallback(() => {
    setTimerState((prev) => {
      if (!prev.isRunning) return prev;
      const next = { ...prev, lastInteractionAt: Date.now() };
      saveState(next);
      return next;
    });
    setShowIdleWarning(false);
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

  // Tick
  useEffect(() => {
    if (timerState.isRunning) {
      tickRef.current = setInterval(() => {
        setDisplaySeconds(computeSeconds(timerState));
      }, 1000);
    } else {
      if (tickRef.current) clearInterval(tickRef.current);
      setDisplaySeconds(computeSeconds(timerState));
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [timerState]);

  // Idle detection — check every minute if running
  useEffect(() => {
    if (!timerState.isRunning) {
      if (idleCheckRef.current) clearInterval(idleCheckRef.current);
      setShowIdleWarning(false);
      return;
    }

    idleCheckRef.current = setInterval(() => {
      const lastActivity = timerState.lastInteractionAt ?? timerState.startedAt ?? Date.now();
      const idleMs = Date.now() - lastActivity;
      if (idleMs >= IDLE_THRESHOLD_MS) {
        setShowIdleWarning(true);
      }
    }, IDLE_CHECK_MS);

    return () => { if (idleCheckRef.current) clearInterval(idleCheckRef.current); };
  }, [timerState]);

  // Browser tab title
  useEffect(() => {
    document.title = timerState.isRunning
      ? `${formatTime(displaySeconds)} - Nudgine`
      : "Time Tracker";
  }, [displaySeconds, timerState.isRunning]);

  function handleStart() {
    const now = Date.now();
    const next: TimerState = {
      startedAt: now,
      accumulatedSeconds: timerState.accumulatedSeconds,
      isRunning: true,
      punchedInAt: timerState.punchedInAt ?? new Date(now).toISOString(),
      lastInteractionAt: now,
    };
    saveState(next);
    setTimerState(next);
    setShowIdleWarning(false);
  }

  function handlePause() {
    const next: TimerState = {
      startedAt: null,
      accumulatedSeconds: computeSeconds(timerState),
      isRunning: false,
      punchedInAt: timerState.punchedInAt,
      lastInteractionAt: Date.now(),
    };
    saveState(next);
    setTimerState(next);
    setShowIdleWarning(false);
  }

  function handleStop() {
    if (displaySeconds === 0) return;
    const next: TimerState = {
      startedAt: null,
      accumulatedSeconds: computeSeconds(timerState),
      isRunning: false,
      punchedInAt: timerState.punchedInAt,
      lastInteractionAt: Date.now(),
    };
    saveState(next);
    setTimerState(next);
    setOpenDialog(true);
    setShowIdleWarning(false);
  }

  function resetTimer() {
    clearState();
    const fresh: TimerState = {
      startedAt: null,
      accumulatedSeconds: 0,
      isRunning: false,
      punchedInAt: null,
      lastInteractionAt: null,
    };
    setTimerState(fresh);
    setDisplaySeconds(0);
    setShowIdleWarning(false);
  }

  const punchInLabel = timerState.punchedInAt
    ? new Date(timerState.punchedInAt).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="space-y-6">
      <div className="space-y-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <h2 className="text-xl font-semibold">Timer</h2>
          {timerState.isRunning && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
              <span className="size-2 rounded-full bg-primary animate-pulse" />
              Recording
            </span>
          )}
        </div>

        <div
          className={cn(
            "mx-auto flex h-48 w-48 items-center justify-center rounded-full border-4",
            timerState.isRunning ? "border-primary" : "border-border"
          )}
        >
          <span className="text-4xl font-bold tabular-nums text-primary">
            {formatTime(displaySeconds)}
          </span>
        </div>

        {punchInLabel && (
          <p className="text-xs text-muted-foreground">
            Punched in at <span className="font-medium text-foreground">{punchInLabel}</span>
          </p>
        )}
      </div>

      {/* Idle warning banner */}
      {showIdleWarning && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div className="space-y-1">
            <p className="font-medium">Timer still running - are you still working?</p>
            <p className="text-xs opacity-80">
              The timer has been running for 2+ hours with no detected activity. Pause or stop it if you stepped away.
            </p>
          </div>
          <button
            onClick={() => setShowIdleWarning(false)}
            className="ml-auto shrink-0 opacity-60 hover:opacity-100"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex justify-center gap-3">
        <Button onClick={handleStart} disabled={timerState.isRunning} className="gap-2">
          <Play className="size-4" />
          {timerState.punchedInAt ? "Resume" : "Punch In"}
        </Button>

        <Button
          variant="secondary"
          onClick={handlePause}
          disabled={!timerState.isRunning}
          className="gap-2"
        >
          <Pause className="size-4" />
          Pause
        </Button>

        <Button
          variant="destructive"
          onClick={handleStop}
          disabled={displaySeconds === 0}
          className="gap-2"
        >
          <Square className="size-4" />
          Punch Out
        </Button>
      </div>

      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground"
          onClick={() => setOpenManualDialog(true)}
        >
          <PlusCircle className="size-4" />
          Add session manually
        </Button>
      </div>

      <SessionDialog
        open={openDialog}
        setOpen={setOpenDialog}
        durationSeconds={displaySeconds}
        punchedInAt={timerState.punchedInAt ?? undefined}
        resetTimer={resetTimer}
      />

      <SessionDialog
        open={openManualDialog}
        setOpen={setOpenManualDialog}
        isManual
        resetTimer={() => {}}
      />
    </div>
  );
}