/* src/components/SessionsTable.tsx */

"use client";

import { useState } from "react";
import { format } from "date-fns";

import { useSessionsContext } from "@/context/SessionsContext";
import { supabase } from "@/lib/supabase";
import { Session } from "@/types/session";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import SessionDialog from "./SessionDialog";
import { Pencil, Trash2, Globe, Loader2 } from "lucide-react";

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export default function SessionsTable() {
  const { sessions, loading, refetch } = useSessionsContext();
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Delete this session? This can't be undone.");
    if (!confirmed) return;

    setDeletingId(id);

    const { error } = await supabase.from("sessions").delete().eq("id", id);

    setDeletingId(null);

    if (error) {
      console.error(error);
      return;
    }

    refetch();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading sessions...
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
        No sessions logged yet. Start the timer from the home page to log your first one.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Pull Request</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {sessions.map((session) => (
              <TableRow key={session.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {format(new Date(session.created_at), "MMM d, yyyy")}
                </TableCell>

                <TableCell className="font-medium">{session.task}</TableCell>

                <TableCell className="max-w-xs truncate text-muted-foreground">
                  {session.description || "—"}
                </TableCell>

                <TableCell className="whitespace-nowrap font-medium text-primary">
                  {formatDuration(session.duration_minutes)}
                </TableCell>

                <TableCell>
                  {session.github_pr ? (
                    <a
                      href={session.github_pr}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <Globe className="size-4" />
                      PR
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingSession(session)}
                    >
                      <Pencil className="size-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(session.id)}
                      disabled={deletingId === session.id}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <SessionDialog
        open={Boolean(editingSession)}
        setOpen={(open) => {
          if (!open) setEditingSession(null);
        }}
        session={editingSession || undefined}
      />
    </>
  );
}