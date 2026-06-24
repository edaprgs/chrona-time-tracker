/* src/components/SessionDialog.tsx */

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSessionsContext } from "@/context/SessionsContext";
import { useToast } from "@/hooks/useToast";
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
  durationSeconds?: number;
  punchedInAt?: string;
  resetTimer?: () => void;
  session?: Session;
  isManual?: boolean;
}

export default function SessionDialog({
  open,
  setOpen,
  durationSeconds,
  punchedInAt,
  resetTimer,
  session,
  isManual,
}: Props) {
  const { refetch } = useSessionsContext();
  const { toast } = useToast();
  const isEditMode = Boolean(session);

  const [task, setTask] = useState("");
  const [description, setDescription] = useState("");
  const [githubPR, setGithubPR] = useState("");
  const [minutes, setMinutes] = useState(0);
  const [manualDate, setManualDate] = useState("");
  const [manualStart, setManualStart] = useState("");
  const [manualEnd, setManualEnd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (session) {
      setTask(session.task);
      setDescription(session.description || "");
      setGithubPR(session.github_pr || "");
      setMinutes(session.duration_minutes);
    } else if (isManual) {
      setTask(""); setDescription(""); setGithubPR(""); setMinutes(0);
      setManualDate(new Date().toISOString().split("T")[0]);
      setManualStart(""); setManualEnd("");
    } else {
      setTask(""); setDescription(""); setGithubPR("");
      setMinutes(Math.round((durationSeconds || 0) / 60));
    }
    setError("");
  }, [open, session, durationSeconds, isManual]);

  useEffect(() => {
    if (!isManual || !manualDate || !manualStart || !manualEnd) return;
    const start = new Date(`${manualDate}T${manualStart}`);
    const end = new Date(`${manualDate}T${manualEnd}`);
    const diff = Math.round((end.getTime() - start.getTime()) / 60000);
    if (diff > 0) setMinutes(diff);
  }, [isManual, manualDate, manualStart, manualEnd]);

  async function saveSession() {
    if (!task.trim()) { setError("Task title is required"); return; }
    setLoading(true); setError("");

    if (isEditMode && session) {
      const { error: err } = await supabase
        .from("sessions")
        .update({ task, description, github_pr: githubPR, duration_minutes: minutes })
        .eq("id", session.id);
      setLoading(false);
      if (err) { setError(err.message); return; }
      toast("Session updated.", "success");

    } else if (isManual) {
      if (minutes <= 0) { setError("Duration must be greater than 0"); setLoading(false); return; }
      const startISO = manualDate && manualStart ? new Date(`${manualDate}T${manualStart}`).toISOString() : null;
      const endISO   = manualDate && manualEnd   ? new Date(`${manualDate}T${manualEnd}`).toISOString()   : null;
      const { error: err } = await supabase.from("sessions").insert({
        task, description, github_pr: githubPR, duration_minutes: minutes,
        date: manualDate || new Date().toISOString().split("T")[0],
        start_time: startISO, end_time: endISO,
      });
      setLoading(false);
      if (err) { setError(err.message); return; }
      toast("Session saved.", "success");

    } else {
      const now = new Date();
      const { error: err } = await supabase.from("sessions").insert({
        task, description, github_pr: githubPR,
        duration_minutes: (durationSeconds || 0) / 60,
        date: now.toISOString().split("T")[0],
        start_time: punchedInAt ?? null,
        end_time: now.toISOString(),
      });
      setLoading(false);
      if (err) { setError(err.message); return; }
      toast("Session saved.", "success");
      resetTimer?.();
    }

    setOpen(false);
    refetch();
  }

  const title = isEditMode ? "Edit Session" : isManual ? "Add Session Manually" : "Save Session";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!isEditMode && !isManual && punchedInAt && (
            <div className="rounded-lg bg-muted px-4 py-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Punched in: </span>
              {new Date(punchedInAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              {" → "}
              <span className="font-medium text-foreground">Out: </span>
              {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </div>
          )}

          <div className="space-y-1">
            <Input placeholder="Task title" value={task} onChange={(e) => setTask(e.target.value)} />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />

          <div className="relative">
            <Globe className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Github PR link" value={githubPR} onChange={(e) => setGithubPR(e.target.value)} />
          </div>

          {isManual && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Date</label>
                <Input type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Start time</label>
                  <Input type="time" value={manualStart} onChange={(e) => setManualStart(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">End time</label>
                  <Input type="time" value={manualEnd} onChange={(e) => setManualEnd(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Duration (minutes) — auto-filled from times above</label>
                <Input type="number" min={0} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} />
              </div>
            </div>
          )}

          {isEditMode && (
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Duration (minutes)</label>
              <Input type="number" min={0} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} />
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