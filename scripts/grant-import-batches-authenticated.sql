-- Allow authenticated role to hit RLS policies. Non-admins still blocked by RLS.
GRANT SELECT, INSERT, UPDATE ON import_batches TO authenticated;
