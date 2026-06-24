/* src/types/session.ts */

export interface Session {
  id: string;
  task: string;
  description: string | null;
  github_pr: string | null;
  duration_minutes: number;
  date: string;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
}