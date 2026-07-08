ALTER TABLE workspace_config
  ADD COLUMN IF NOT EXISTS meal_break_billable boolean NOT NULL DEFAULT true;
