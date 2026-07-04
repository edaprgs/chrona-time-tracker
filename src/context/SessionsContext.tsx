"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import type { Session } from "@/types/session";
import type { PauseEntry } from "@/types/activity";

interface SessionsContextValue {
  sessions: Session[];
  loading: boolean;
  refetch: () => Promise<void>;
  createSession: (payload: SessionInsertPayload, pauseLogs?: PauseEntry[]) => Promise<Session | null>;
  updateSession: (id: string, patch: Partial<Session>) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
}

export interface SessionInsertPayload {
  task: string;
  description: string;
  github_pr: string;
  duration_minutes: number;
  date: string;
  start_time: string | null;
  end_time: string | null;
  pr_status?: string;
  parent_session_id?: string | null;
  is_split?: boolean;
  focus_score?: number | null;
}

const SessionsContext = createContext<SessionsContextValue | undefined>(undefined);

export function SessionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { active: activeWorkspace } = useWorkspace();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user || !activeWorkspace) { setSessions([]); setLoading(false); return; }
    // Only show the loading spinner on the very first fetch; subsequent
    // refetches silently update the list so the table doesn't flicker.
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("workspace_id", activeWorkspace.id)
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    setSessions(data || []);
    setLoading(false);
  }, [user, activeWorkspace]);

  useEffect(() => { refetch(); }, [refetch]);

  async function createSession(payload: SessionInsertPayload, pauseLogs?: PauseEntry[]) {
    if (!user || !activeWorkspace) return null;
    const { data, error } = await supabase
      .from("sessions")
      .insert({ ...payload, user_id: user.id, workspace_id: activeWorkspace.id, pr_status: payload.pr_status ?? "open" })
      .select()
      .single();
    if (error || !data) { console.error(error); return null; }

    if (pauseLogs && pauseLogs.length > 0) {
      await supabase.from("pause_logs").insert(
        pauseLogs.map((p) => ({
          session_id: data.id,
          paused_at: p.pausedAt,
          resumed_at: p.resumedAt,
          reason: p.reason || null,
        }))
      );
    }

    // Optimistic: prepend the new session without triggering a loading spinner
    setSessions((prev) => [data as Session, ...prev]);
    return data as Session;
  }

  async function updateSession(id: string, patch: Partial<Session>) {
    if (!user) return;
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    await supabase.from("sessions").update(patch).eq("id", id).eq("user_id", user.id);
  }

  async function deleteSession(id: string) {
    if (!user) return;
    // Optimistic: remove immediately, no loading spinner
    setSessions((prev) => prev.filter((s) => s.id !== id));
    await supabase.from("sessions").delete().eq("id", id).eq("user_id", user.id);
  }

  return (
    <SessionsContext.Provider value={{ sessions, loading, refetch, createSession, updateSession, deleteSession }}>
      {children}
    </SessionsContext.Provider>
  );
}

export function useSessionsContext() {
  const ctx = useContext(SessionsContext);
  if (!ctx) throw new Error("useSessionsContext must be used inside <SessionsProvider>");
  return ctx;
}
