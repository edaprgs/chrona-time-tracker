export type PrStatus = "open" | "in_review" | "approved" | "merged" | "done";

export interface Session {
  id: string;
  user_id: string | null;
  task: string;
  description: string | null;
  github_pr: string | null;
  pr_status: PrStatus;
  duration_minutes: number | string; // Supabase returns numeric columns as strings — always use Number()
  date: string;
  start_time: string | null;
  end_time: string | null;
  parent_session_id: string | null;
  is_split: boolean;
  workspace_id: string | null;
  focus_score: number | string | null; // same reason
  created_at: string;
}
