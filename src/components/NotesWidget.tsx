"use client";

import Link from "next/link";
import { StickyNote, Plus, ArrowRight, Pin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useNotes } from "@/hooks/useNotes";
import { cn } from "@/lib/utils";

const COLOR_BG: Record<string, string> = {
  default: "",
  yellow:  "bg-yellow-50 dark:bg-yellow-950/30",
  green:   "bg-green-50 dark:bg-green-950/30",
  blue:    "bg-blue-50 dark:bg-blue-950/30",
  pink:    "bg-pink-50 dark:bg-pink-950/30",
  purple:  "bg-purple-50 dark:bg-purple-950/30",
};

export default function NotesWidget() {
  const { notes, pinned } = useNotes();

  const preview = pinned.length > 0
    ? pinned.slice(0, 3)
    : notes.slice(0, 3);

  function plainText(html: string) {
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
  }

  return (
    <Card>
      <CardContent className="p-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-muted">
              <StickyNote className="size-3.5 text-muted-foreground" />
            </div>
            <h2 className="font-semibold">Notes</h2>
          </div>
          <Link
            href="/notes"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all <ArrowRight className="size-3" />
          </Link>
        </div>

        {notes.length === 0 ? (
          /* Empty state — big tap target to create first note */
          <Link
            href="/notes"
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
          >
            <StickyNote className="size-6 opacity-30" />
            <span>No notes yet — click to add one</span>
          </Link>
        ) : (
          <div className="space-y-2">
            {preview.map((note) => {
              const body = plainText(note.content);

              return (
                <Link
                  key={note.id}
                  href="/notes"
                  className={cn(
                    "block rounded-xl border px-3 py-2.5 transition-shadow hover:shadow-sm",
                    COLOR_BG[note.color] || ""
                  )}
                >
                  <div className="flex items-start gap-2">
                    {note.pinned && <Pin className="mt-0.5 size-3 shrink-0 text-muted-foreground" />}
                    <div className="min-w-0 flex-1">
                      {note.title && (
                        <p className="truncate text-sm font-semibold">{note.title}</p>
                      )}
                      {body && (
                        <p className={cn("truncate text-xs text-muted-foreground", note.title && "mt-0.5")}>
                          {body}
                        </p>
                      )}
                      {!note.title && !body && (
                        <p className="text-xs text-muted-foreground italic">Empty note</p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}

            {notes.length > 3 && (
              <Link
                href="/notes"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed py-2 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
              >
                <Plus className="size-3" /> {notes.length - 3} more note{notes.length - 3 !== 1 ? "s" : ""}
              </Link>
            )}
          </div>
        )}

        {/* Quick-add shortcut */}
        <Link
          href="/notes"
          className="mt-3 flex w-full items-center gap-2 rounded-xl border bg-muted/30 px-3 py-2 text-sm text-muted-foreground hover:bg-muted/60 transition-colors"
        >
          <Plus className="size-4 shrink-0" />
          New note…
        </Link>
      </CardContent>
    </Card>
  );
}
