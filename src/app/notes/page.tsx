"use client";

import { useState } from "react";
import { StickyNote, Plus } from "lucide-react";
import { useNotes, type Note } from "@/hooks/useNotes";
import NoteCard from "@/components/NoteCard";
import NoteEditorDialog from "@/components/NoteEditorDialog";
import PageHeader from "@/components/PageHeader";

export default function NotesPage() {
  const { pinned, unpinned, addNote, updateNote, deleteNote, togglePin } = useNotes();
  const [editing, setEditing] = useState<Note | null | "new">(null);

  const open = editing !== null;
  const note = editing === "new" ? null : editing;

  return (
    <main className="min-h-screen bg-background">
      <PageHeader
        icon={StickyNote}
        title="Notes"
        subtitle="Your personal notes and reminders"
        actions={
          <button
            onClick={() => setEditing("new")}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">New note</span>
          </button>
        }
      />

      <div className="mx-auto max-w-5xl space-y-8 px-4 py-6 md:px-8 md:py-8">
        {/* Compose bar */}
        <button
          onClick={() => setEditing("new")}
          className="flex w-full items-center gap-3 rounded-2xl border bg-card px-5 py-4 text-left text-sm text-muted-foreground shadow-sm hover:shadow-md transition-shadow"
        >
          <Plus className="size-4 shrink-0" />
          Take a note…
        </button>

        {pinned.length === 0 && unpinned.length === 0 && (
          <div className="py-20 text-center text-muted-foreground">
            <StickyNote className="mx-auto mb-3 size-10 opacity-20" />
            <p className="font-medium">No notes yet</p>
            <p className="text-sm">Click "Take a note" to create your first note or checklist.</p>
          </div>
        )}

        {pinned.length > 0 && (
          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Pinned</p>
            <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
              {pinned.map((n) => (
                <div key={n.id} className="mb-4 break-inside-avoid">
                  <NoteCard
                    note={n}
                    onClick={() => setEditing(n)}
                    onDelete={() => deleteNote(n.id)}
                    onTogglePin={() => togglePin(n.id)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {unpinned.length > 0 && (
          <section>
            {pinned.length > 0 && (
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Other notes</p>
            )}
            <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
              {unpinned.map((n) => (
                <div key={n.id} className="mb-4 break-inside-avoid">
                  <NoteCard
                    note={n}
                    onClick={() => setEditing(n)}
                    onDelete={() => deleteNote(n.id)}
                    onTogglePin={() => togglePin(n.id)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <NoteEditorDialog
        open={open}
        note={note}
        onClose={() => setEditing(null)}
        onSave={(id, changes) => updateNote(id, changes)}
        onCreate={(partial) => addNote(partial)}
      />
    </main>
  );
}
