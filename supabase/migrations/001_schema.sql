-- Run this in your Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================
-- 1. Enable UUID extension (already enabled in most Supabase projects)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 2. Add new columns to the existing sessions table
-- ============================================================
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS user_id       uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS pr_status     text NOT NULL DEFAULT 'open'
    CHECK (pr_status IN ('open','in_review','approved','merged','done')),
  ADD COLUMN IF NOT EXISTS parent_session_id uuid REFERENCES sessions(id),
  ADD COLUMN IF NOT EXISTS is_split      boolean NOT NULL DEFAULT false;

-- ============================================================
-- 3. Pause logs — one row per pause interval within a session
-- ============================================================
CREATE TABLE IF NOT EXISTS pause_logs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       uuid REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  paused_at        timestamptz NOT NULL,
  resumed_at       timestamptz,
  reason           text,
  duration_minutes numeric GENERATED ALWAYS AS (
    CASE
      WHEN resumed_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (resumed_at - paused_at)) / 60
      ELSE NULL
    END
  ) STORED,
  created_at       timestamptz DEFAULT now()
);

-- ============================================================
-- 4. Activity events — VS Code companion extension feeds this
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    uuid REFERENCES sessions(id) ON DELETE CASCADE,
  user_id       uuid REFERENCES auth.users(id),
  event_type    text NOT NULL,           -- file_open | file_save | file_edit | terminal | git_commit | debug
  file_path     text,
  workspace     text,
  language      text,
  lines_changed integer,
  git_branch    text,
  timestamp     timestamptz NOT NULL DEFAULT now(),
  metadata      jsonb,
  created_at    timestamptz DEFAULT now()
);

-- ============================================================
-- 5. Workspace config — per-user settings (replaces hardcoded constants)
-- ============================================================
CREATE TABLE IF NOT EXISTS workspace_config (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid REFERENCES auth.users(id) UNIQUE NOT NULL,
  workspace_name      text NOT NULL DEFAULT 'My Workspace',
  contractor_name     text NOT NULL DEFAULT '',
  client_name         text NOT NULL DEFAULT '',
  hourly_rate_usd     numeric NOT NULL DEFAULT 7,
  weekly_hour_cap     integer NOT NULL DEFAULT 40,
  invoice_cycle_days  integer NOT NULL DEFAULT 14,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- ============================================================
-- 6. Row Level Security — each user only sees their own data
-- ============================================================
ALTER TABLE sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE pause_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_config ENABLE ROW LEVEL SECURITY;

-- Sessions
DROP POLICY IF EXISTS "own_sessions" ON sessions;
CREATE POLICY "own_sessions" ON sessions
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Pause logs (via parent session ownership)
DROP POLICY IF EXISTS "own_pause_logs" ON pause_logs;
CREATE POLICY "own_pause_logs" ON pause_logs
  FOR ALL USING (
    session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid())
  )
  WITH CHECK (
    session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid())
  );

-- Activity events
DROP POLICY IF EXISTS "own_activity_events" ON activity_events;
CREATE POLICY "own_activity_events" ON activity_events
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Workspace config
DROP POLICY IF EXISTS "own_workspace_config" ON workspace_config;
CREATE POLICY "own_workspace_config" ON workspace_config
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 7. Indexes for common query patterns
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_sessions_user_date     ON sessions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_sessions_user_created  ON sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pause_logs_session     ON pause_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_session ON activity_events(session_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_user   ON activity_events(user_id, timestamp DESC);
