-- Realtime for live push notifications when new rows are inserted.
-- Run in Supabase SQL Editor.

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Optional server-side backup (creates duplicate if app also inserts notifications on lead create):
-- See schema.migration.lead_notifications.trigger.sql
