-- Meal break max duration per workspace (default 60 min)
ALTER TABLE workspace_config
  ADD COLUMN IF NOT EXISTS meal_break_max_minutes integer NOT NULL DEFAULT 60;
