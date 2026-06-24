/* src/components/Timer.tsx */

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import SessionDialog from "./SessionDialog";
import { Play, Pause, Square } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Timer() {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  function formatTime() {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  function handleStart() {
    setIsRunning(true);
  }

  function handlePause() {
    setIsRunning(false);
  }

  function handleStop() {
    if (seconds === 0) return;

    setIsRunning(false);
    setOpenDialog(true);
  }

  function resetTimer() {
    setSeconds(0);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <h2 className="text-xl font-semibold">Timer</h2>

          {isRunning && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
              <span className="size-2 rounded-full bg-primary animate-pulse" />
              Recording
            </span>
          )}
        </div>

        <div
          className={cn(
            "mx-auto flex h-48 w-48 items-center justify-center rounded-full border-4",
            isRunning ? "border-primary" : "border-border"
          )}
        >
          <span className="text-4xl font-bold tabular-nums text-primary">
            {formatTime()}
          </span>
        </div>
      </div>

      <div className="flex justify-center gap-3">
        <Button onClick={handleStart} disabled={isRunning} className="gap-2">
          <Play className="size-4" />
          Start
        </Button>

        <Button
          variant="secondary"
          onClick={handlePause}
          disabled={!isRunning}
          className="gap-2"
        >
          <Pause className="size-4" />
          Pause
        </Button>

        <Button
          variant="destructive"
          onClick={handleStop}
          disabled={seconds === 0}
          className="gap-2"
        >
          <Square className="size-4" />
          Stop
        </Button>
      </div>

      <SessionDialog
        open={openDialog}
        setOpen={setOpenDialog}
        durationSeconds={seconds}
        resetTimer={resetTimer}
      />
    </div>
  );
}