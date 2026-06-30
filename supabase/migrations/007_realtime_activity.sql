-- Enable Supabase Realtime on activity_events so the Activity Log updates
-- live (new VS Code / Chrome / manual entries appear without a page refresh).
ALTER PUBLICATION supabase_realtime ADD TABLE activity_events;

-- REPLICA IDENTITY FULL ensures DELETE/UPDATE payloads include all columns
-- (including user_id), which the client-side filter `user_id=eq.<id>` needs —
-- by default only the primary key is included in the old row payload.
ALTER TABLE activity_events REPLICA IDENTITY FULL;
