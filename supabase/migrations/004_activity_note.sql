-- Add note column to activity_events for manual log entries
ALTER TABLE activity_events ADD COLUMN IF NOT EXISTS note text DEFAULT NULL;
