-- Allow authenticated role to hit RLS policies. Users still only see their own rows.
GRANT SELECT, INSERT, UPDATE ON notifications TO authenticated;
