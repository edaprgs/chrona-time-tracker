-- Backfill user_id on sessions that were created before the user_id column was added.
-- Run this ONCE in the Supabase SQL Editor while logged in as the service role.
--
-- Step 1: Find your user ID
-- SELECT id, email FROM auth.users;
--
-- Step 2: Replace 'YOUR_USER_ID' and 'YOUR_WORKSPACE_ID' below with real values,
--         then run the UPDATE.
--
-- Find your workspace ID:
-- SELECT id, workspace_name FROM workspace_config LIMIT 10;

UPDATE sessions
SET
  user_id      = 'YOUR_USER_ID',
  workspace_id = 'YOUR_WORKSPACE_ID'
WHERE user_id IS NULL;
