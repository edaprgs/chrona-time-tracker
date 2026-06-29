export interface WorkspaceConfig {
  id: string;
  user_id: string;
  workspace_name: string;
  contractor_name: string;
  client_name: string;
  hourly_rate_usd: number;
  weekly_hour_cap: number;
  invoice_cycle_days: number;
  is_active: boolean;
  color: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}
