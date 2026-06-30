-- Real-time punch state, written by Timer.tsx on every punch-in/pause/resume/
-- punch-out. The `sessions` table only gets a row at punch-out (after the
-- confirmation dialog), so it can never answer "is the user punched in right
-- now" — this table is the actual live signal the VS Code extension polls
-- to decide whether to track activity at all.
CREATE TABLE IF NOT EXISTS live_status (
  user_id        uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_punched_in  boolean NOT NULL DEFAULT false,
  is_paused      boolean NOT NULL DEFAULT false,
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE live_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own live status"
  ON live_status FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert their own live status"
  ON live_status FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own live status"
  ON live_status FOR UPDATE
  USING (auth.uid() = user_id);
