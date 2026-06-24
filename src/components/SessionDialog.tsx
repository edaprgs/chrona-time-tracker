/* src/components/SessionDialog.tsx */

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSessionsContext } from "@/context/SessionsContext";
import { Session } from "@/types/session";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

interface Props {
  open: boolean;
  setOpen: (value: boolean) => void;

  // Create mode: passed in by the Timer when a run is stopped.
  durationSeconds?: number;
  resetTimer?: () => void;

  // Edit mode: passed in by the Sessions table.
  session?: Session;
}

export default function SessionDialog({
  open,
  setOpen,
  durationSeconds,
  resetTimer,
  session,
}: Props) {
  const { refetch } = useSessionsContext();
  const isEditMode = Boolean(session);

  const [task, setTask] = useState("");
  const [description, setDescription] = useState("");
  const [githubPR, setGithubPR] = useState("");
  const [minutes, setMinutes] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Re-populate the form every time the dialog opens, for either mode.
  useEffect(() => {
    if (!open) return;

    if (session) {
      setTask(session.task);
      setDescription(session.description || "");
      setGithubPR(session.github_pr || "");
      setMinutes(session.duration_minutes);
    } else {
      setTask("");
      setDescription("");
      setGithubPR("");
      setMinutes(Math.round((durationSeconds || 0) / 60));
    }

    setError("");
  }, [open, session, durationSeconds]);

  async function saveSession() {
    if (!task.trim()) {
      setError("Task title is required");
      return;
    }

    setLoading(true);
    setError("");

    if (isEditMode && session) {
      const { error: updateError } = await supabase
        .from("sessions")
        .update({
          task,
          description,
          github_pr: githubPR,
          duration_minutes: minutes,
        })
        .eq("id", session.id);

      setLoading(false);

      if (updateError) {
        setError(updateError.message);
        return;
      }
    } else {
      const now = new Date();

      const { error: insertError } = await supabase.from("sessions").insert({
        task,
        description,
        github_pr: githubPR,
        duration_minutes: (durationSeconds || 0) / 60,
        date: now.toISOString().split("T")[0],
        start_time: null,
        end_time: now.toISOString(),
      });

      setLoading(false);

      if (insertError) {
        setError(insertError.message);
        return;
      }

      resetTimer?.();
    }

    setOpen(false);
    refetch();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Session" : "Save Session"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Input
              placeholder="Task title"
              value={task}
              onChange={(e) => setTask(e.target.value)}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <Textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="relative">
            <Globe className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Github PR link"
              value={githubPR}
              onChange={(e) => setGithubPR(e.target.value)}
            />
          </div>

          {isEditMode && (
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">
                Duration (minutes)
              </label>
              <Input
                type="number"
                min={0}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
              />
            </div>
          )}

          <Button className="w-full" onClick={saveSession} disabled={loading}>
            {loading ? "Saving..." : isEditMode ? "Save Changes" : "Save Session"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}