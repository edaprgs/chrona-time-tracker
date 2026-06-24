/* src/context/SessionsContext.tsx */

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
import { Session } from "@/types/session";

interface SessionsContextValue {
  sessions: Session[];
  loading: boolean;
  refetch: () => Promise<void>;
}

const SessionsContext = createContext<SessionsContextValue | undefined>(
  undefined
);

export function SessionsProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    }

    setSessions(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <SessionsContext.Provider value={{ sessions, loading, refetch }}>
      {children}
    </SessionsContext.Provider>
  );
}

export function useSessionsContext() {
  const ctx = useContext(SessionsContext);

  if (!ctx) {
    throw new Error("useSessionsContext must be used inside <SessionsProvider>");
  }

  return ctx;
}