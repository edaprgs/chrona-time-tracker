/* src/components/Timer.tsx */

"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import SessionDialog from "./SessionDialog";
import { Play, Pause, Square, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "nudgine_timer";

interface TimerState {
  startedAt: number | null; // epoch ms when timer last started
  accumulatedSeconds: number; // seconds banked before the last pause
  isRunning: boolean;
  punchedInAt: string | null; // ISO string of the very first punch-in
}

function loadState(): TimerState {
  if (typeof window === "undefined")
    return { startedAt: null, accumulatedSeconds: 0, isRunning: false, punchedInAt: null };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}

  return { startedAt: null, accumulatedSeconds: 0, isRunning: false, punchedInAt: null };
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
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tick every second when running
  useEffect(() => {
    if (timerState.isRunning) {
      tickRef.current = setInterval(() => {
        setDisplaySeconds(computeSeconds(timerState));
      }, 1000);
    } else {
      if (tickRef.current) clearInterval(tickRef.current);
      setDisplaySeconds(computeSeconds(timerState));
    }

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [timerState]);

  // Browser tab title
  useEffect(() => {
    if (timerState.isRunning) {
      document.title = `${formatTime(displaySeconds)} - Nudgine`;
    } else {
      document.title = "Time Tracker";
    }
  }, [displaySeconds, timerState.isRunning]);

  function handleStart() {
    const now = Date.now();
    const next: TimerState = {
      startedAt: now,
      accumulatedSeconds: timerState.accumulatedSeconds,
      isRunning: true,
      punchedInAt: timerState.punchedInAt ?? new Date(now).toISOString(),
    };
    saveState(next);
    setTimerState(next);
  }

  function handlePause() {
    const next: TimerState = {
      startedAt: null,
      accumulatedSeconds: computeSeconds(timerState),
      isRunning: false,
      punchedInAt: timerState.punchedInAt,
    };
    saveState(next);
    setTimerState(next);
  }

  function handleStop() {
    if (displaySeconds === 0) return;

    // Snapshot the accumulated time before pausing
    const next: TimerState = {
      startedAt: null,
      accumulatedSeconds: computeSeconds(timerState),
      isRunning: false,
      punchedInAt: timerState.punchedInAt,
    };
    saveState(next);
    setTimerState(next);
    setOpenDialog(true);
  }

  function resetTimer() {
    clearState();
    const fresh: TimerState = {
      startedAt: null,
      accumulatedSeconds: 0,
      isRunning: false,
      punchedInAt: null,
    };
    setTimerState(fresh);
    setDisplaySeconds(0);
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

        {/* Punch-in timestamp */}
        {punchInLabel && (
          <p className="text-xs text-muted-foreground">
            Punched in at <span className="font-medium text-foreground">{punchInLabel}</span>
          </p>
        )}
      </div>

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

      {/* Manual session entry */}
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

      {/* Save dialog — from timer */}
      <SessionDialog
        open={openDialog}
        setOpen={setOpenDialog}
        durationSeconds={displaySeconds}
        punchedInAt={timerState.punchedInAt ?? undefined}
        resetTimer={resetTimer}
      />

      {/* Save dialog — manual entry */}
      <SessionDialog
        open={openManualDialog}
        setOpen={setOpenManualDialog}
        isManual
        resetTimer={() => {}}
      />
    </div>
  );
}