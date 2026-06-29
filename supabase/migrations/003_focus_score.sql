-- Add focus_score column to sessions (nullable, 0-100)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS focus_score numeric(5,2) DEFAULT NULL;
