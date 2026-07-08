export type ActivityEventType =
  | "file_open"
  | "file_save"
  | "file_edit"
  | "terminal"
  | "git_commit"
  | "debug"
  | "test_run"
  | "browser_visit"
  | "app_focus"
  | "manual_browser"
  | "manual_meeting"
  | "manual_sprint"
  | "manual_review"
  | "manual_other";

export interface ActivityEvent {
  id: string;
  session_id: string | null;
  user_id: string;
  event_type: ActivityEventType;
  file_path: string | null;
  workspace: string | null;
  language: string | null;
  lines_changed: number | null;
  git_branch: string | null;
  timestamp: string;
  note: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface PauseLog {
  id: string;
  session_id: string;
  paused_at: string;
  resumed_at: string | null;
  reason: string | null;
  duration_minutes: number | null;
  created_at: string;
}

export interface PauseEntry {
  pausedAt: string;
  resumedAt: string | null;
  reason: string;
  isMealBreak?: boolean; // meal breaks keep the clock running and don't reduce billed time
}
