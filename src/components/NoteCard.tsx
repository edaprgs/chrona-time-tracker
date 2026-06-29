"use client";

import { useState } from "react";
import { Pin, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Note } from "@/hooks/useNotes";
import { NOTE_COLORS } from "@/components/NoteEditorDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  note: Note;
  onClick: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}

export default function NoteCard({ note, onClick, onDelete, onTogglePin }: Props) {
  const [hovered, setHovered]         = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { bg, border } = NOTE_COLORS.find((c) => c.value === note.color) ?? NOTE_COLORS[0];

  const hasContent = note.content && note.content !== "<p></p>";

  return (
    <>
      <div
        className={cn("group relative cursor-pointer rounded-2xl border p-4 transition-shadow hover:shadow-md", bg, border)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onClick}
      >
        {note.pinned && (
          <Pin className="absolute -top-1.5 right-3 size-3.5 text-muted-foreground" />
        )}

        {note.title && (
          <p className="mb-1.5 text-sm font-semibold leading-snug">{note.title}</p>
        )}

        {hasContent && (
          <div
            className="tiptap-content pointer-events-none max-h-48 overflow-hidden text-xs text-muted-foreground [&_*]:pointer-events-none"
            dangerouslySetInnerHTML={{ __html: note.content }}
          />
        )}

        {!note.title && !hasContent && (
          <p className="text-xs italic text-muted-foreground/50">Empty note</p>
        )}

        {note.labels.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {note.labels.map((l) => (
              <span key={l} className="rounded-full border bg-muted/60 px-2 py-0.5 text-[10px] font-medium">
                {l}
              </span>
            ))}
          </div>
        )}

        {/* Hover actions */}
        <div
          className={cn("mt-3 flex items-center justify-between transition-opacity", hovered ? "opacity-100" : "opacity-0")}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onTogglePin}
            title={note.pinned ? "Unpin" : "Pin"}
            className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10"
          >
            <Pin className="size-3.5" />
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            title="Delete"
            className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-sm" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Delete this note?</DialogTitle>
            <DialogDescription>
              {note.title
                ? <>The note <span className="font-medium">"{note.title}"</span> will be permanently deleted.</>
                : "This note will be permanently deleted and cannot be recovered."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1 gap-2"
              onClick={() => { setConfirmDelete(false); onDelete(); }}
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
