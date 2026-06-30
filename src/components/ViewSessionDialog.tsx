"use client";

import { format, parseISO } from "date-fns";
import type { Session } from "@/types/session";
import { formatDuration } from "@/lib/session-utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Globe, Zap } from "lucide-react";

const PR_STATUS_LABEL: Record<string, string> = {
  open: "Open",
  in_review: "In Review",
  approved: "Approved",
  merged: "Merged",
  done: "Done",
};

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  session?: Session;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

export default function ViewSessionDialog({ open, setOpen, session }: Props) {
  if (!session) return null;

  const focusScore = session.focus_score !== null ? Number(session.focus_score) : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{session.task}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Date">
            {format(parseISO(session.date), "MMM d, yyyy")}
          </Field>
          <Field label="Duration">
            {formatDuration(Number(session.duration_minutes))}
          </Field>

          {session.start_time && (
            <Field label="Start time">
              {format(new Date(session.start_time), "h:mm a")}
            </Field>
          )}
          {session.end_time && (
            <Field label="End time">
              {format(new Date(session.end_time), "h:mm a")}
            </Field>
          )}

          {focusScore !== null && (
            <Field label="Focus score">
              <span className="inline-flex items-center gap-1">
                <Zap className="size-3.5 text-amber-500" />
                {focusScore}%
              </span>
            </Field>
          )}

          <Field label="PR status">
            {PR_STATUS_LABEL[session.pr_status] ?? session.pr_status}
          </Field>

          {session.github_pr && (
            <Field label="GitHub PR">
              <a
                href={session.github_pr}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <Globe className="size-3.5" /> View PR
              </a>
            </Field>
          )}
        </div>

        {session.description && (
          <Field label="Description">
            <p className="whitespace-pre-wrap text-foreground">{session.description}</p>
          </Field>
        )}
      </DialogContent>
    </Dialog>
  );
}
