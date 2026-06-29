"use client";

import { useState, useEffect, useCallback } from "react";

export interface Note {
  id: string;
  title: string;
  content: string; // Tiptap HTML
  color: string;
  pinned: boolean;
  labels: string[];
  createdAt: string;
}

const STORAGE_KEY = "chrona_notes_v2";

function load(): Note[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function save(notes: Note[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    setNotes(load());
  }, []);

  const persist = useCallback((updated: Note[]) => {
    setNotes(updated);
    save(updated);
  }, []);

  function addNote(partial: Omit<Note, "id" | "createdAt">) {
    const note: Note = {
      ...partial,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    persist([note, ...notes]);
    return note.id;
  }

  function updateNote(id: string, changes: Partial<Omit<Note, "id" | "createdAt">>) {
    persist(notes.map((n) => (n.id === id ? { ...n, ...changes } : n)));
  }

  function deleteNote(id: string) {
    persist(notes.filter((n) => n.id !== id));
  }

  function togglePin(id: string) {
    persist(notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)));
  }

  const pinned   = notes.filter((n) => n.pinned);
  const unpinned = notes.filter((n) => !n.pinned);

  return { notes, pinned, unpinned, addNote, updateNote, deleteNote, togglePin };
}
