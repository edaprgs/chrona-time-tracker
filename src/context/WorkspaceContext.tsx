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
import { DEFAULTS } from "@/lib/constants";
import type { WorkspaceConfig } from "@/types/workspace";
import { useAuth } from "@/context/AuthContext";

interface WorkspaceContextValue {
  workspaces: WorkspaceConfig[];
  active: WorkspaceConfig | null;
  loading: boolean;
  switchWorkspace: (id: string) => Promise<void>;
  createWorkspace: (data: NewWorkspaceData) => Promise<WorkspaceConfig | null>;
  updateWorkspace: (id: string, patch: Partial<Omit<WorkspaceConfig, "id" | "user_id" | "created_at">>) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  // Resolved values from active workspace (falls back to defaults)
  workspaceName:    string;
  contractorName:   string;
  clientName:       string;
  hourlyRate:       number;
  weeklyHourCap:    number;
  invoiceCycleDays: number;
}

export interface NewWorkspaceData {
  workspace_name: string;
  contractor_name?: string;
  client_name?: string;
  hourly_rate_usd?: number;
  weekly_hour_cap?: number;
  invoice_cycle_days?: number;
  color?: string;
  description?: string;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) { setWorkspaces([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("workspace_config")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    setWorkspaces(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  const active = workspaces.find((w) => w.is_active) ?? workspaces[0] ?? null;

  async function switchWorkspace(id: string) {
    if (!user) return;
    // Deactivate all, then activate selected
    await supabase
      .from("workspace_config")
      .update({ is_active: false })
      .eq("user_id", user.id);
    await supabase
      .from("workspace_config")
      .update({ is_active: true })
      .eq("id", id);
    await fetch();
  }

  async function createWorkspace(data: NewWorkspaceData): Promise<WorkspaceConfig | null> {
    if (!user) return null;
    // Deactivate existing
    await supabase.from("workspace_config").update({ is_active: false }).eq("user_id", user.id);
    const { data: created } = await supabase
      .from("workspace_config")
      .insert({
        user_id:           user.id,
        workspace_name:    data.workspace_name,
        contractor_name:   data.contractor_name   ?? DEFAULTS.CONTRACTOR_NAME,
        client_name:       data.client_name       ?? DEFAULTS.CLIENT_NAME,
        hourly_rate_usd:   data.hourly_rate_usd   ?? DEFAULTS.HOURLY_RATE_USD,
        weekly_hour_cap:   data.weekly_hour_cap   ?? DEFAULTS.WEEKLY_HOUR_CAP,
        invoice_cycle_days: data.invoice_cycle_days ?? DEFAULTS.INVOICE_CYCLE_DAYS,
        color:             data.color             ?? "#ec4899",
        description:       data.description       ?? null,
        is_active:         true,
      })
      .select()
      .single();
    await fetch();
    return created ?? null;
  }

  async function updateWorkspace(id: string, patch: Partial<Omit<WorkspaceConfig, "id" | "user_id" | "created_at">>) {
    if (!user) return;
    await supabase
      .from("workspace_config")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);
    await fetch();
  }

  async function deleteWorkspace(id: string) {
    if (!user || workspaces.length <= 1) return; // never delete the last workspace
    await supabase.from("workspace_config").delete().eq("id", id).eq("user_id", user.id);
    // Activate the first remaining
    const remaining = workspaces.filter((w) => w.id !== id);
    if (remaining.length > 0) {
      await supabase.from("workspace_config").update({ is_active: true }).eq("id", remaining[0].id);
    }
    await fetch();
  }

  return (
    <WorkspaceContext.Provider value={{
      workspaces,
      active,
      loading,
      switchWorkspace,
      createWorkspace,
      updateWorkspace,
      deleteWorkspace,
      workspaceName:    active?.workspace_name    ?? DEFAULTS.WORKSPACE_NAME,
      contractorName:   active?.contractor_name   ?? DEFAULTS.CONTRACTOR_NAME,
      clientName:       active?.client_name       ?? DEFAULTS.CLIENT_NAME,
      hourlyRate:       active?.hourly_rate_usd   ?? DEFAULTS.HOURLY_RATE_USD,
      weeklyHourCap:    active?.weekly_hour_cap   ?? DEFAULTS.WEEKLY_HOUR_CAP,
      invoiceCycleDays: active?.invoice_cycle_days ?? DEFAULTS.INVOICE_CYCLE_DAYS,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  return ctx;
}
