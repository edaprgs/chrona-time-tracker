-- Work schedule: which days of the week are working days.
-- work_start_day and work_end_day use ISO weekday numbers:
--   0 = Sunday, 1 = Monday, 2 = Tuesday, ..., 6 = Saturday
-- Default: Monday (1) to Friday (5) = 5-day work week.

ALTER TABLE workspace_config
  ADD COLUMN IF NOT EXISTS work_start_day integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS work_end_day   integer NOT NULL DEFAULT 5;
