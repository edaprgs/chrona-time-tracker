-- Run in Supabase SQL Editor after 001_schema.sql
-- ============================================================
-- 1. Allow multiple workspaces per user (drop the unique constraint)
-- ============================================================
ALTER TABLE workspace_config DROP CONSTRAINT IF EXISTS workspace_config_user_id_key;

-- ============================================================
-- 2. Add fields to workspace_config
-- ============================================================
ALTER TABLE workspace_config
  ADD COLUMN IF NOT EXISTS is_active   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS color       text    NOT NULL DEFAULT '#6366f1',  -- accent color per workspace
  ADD COLUMN IF NOT EXISTS description text;

-- ============================================================
-- 3. Add workspace_id to sessions so sessions belong to a workspace
-- ============================================================
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspace_config(id);

-- ============================================================
-- 4. Add workspace_id to activity_events
-- ============================================================
ALTER TABLE activity_events
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspace_config(id);

-- ============================================================
-- 5. Enforce only one active workspace per user via partial unique index
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_workspace_per_user
  ON workspace_config(user_id)
  WHERE is_active = true;

-- ============================================================
-- 6. Updated RLS — users can only touch their own workspaces
-- ============================================================
DROP POLICY IF EXISTS "own_workspace_config" ON workspace_config;
CREATE POLICY "own_workspace_config" ON workspace_config
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Sessions RLS already scoped by user_id — workspace_id is additional filter done in app layer
-- ============================================================
-- 7. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_sessions_workspace ON sessions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_config_user ON workspace_config(user_id);
