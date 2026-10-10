-- Phase 1: support tickets + import batch audit log
-- Idempotent / production-safe: CREATE IF NOT EXISTS, no DROP TABLE, no destructive ALTER.

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  admin_notes TEXT,
  assigned_admin UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users insert own support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users select own support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users update own support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins full access support tickets" ON support_tickets;

CREATE POLICY "Users insert own support tickets" ON support_tickets
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users select own support tickets" ON support_tickets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users update own support tickets" ON support_tickets
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins full access support tickets" ON support_tickets
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

REVOKE ALL ON support_tickets FROM anon;
GRANT SELECT, INSERT, UPDATE ON support_tickets TO authenticated;
GRANT ALL ON support_tickets TO service_role;

CREATE TABLE IF NOT EXISTS import_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  imported_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  filename TEXT NOT NULL DEFAULT 'import.csv',
  total_rows INT NOT NULL DEFAULT 0,
  imported_rows INT NOT NULL DEFAULT 0,
  failed_rows INT NOT NULL DEFAULT 0,
  duplicate_rows INT NOT NULL DEFAULT 0,
  error_summary JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE import_batches ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed';

CREATE INDEX IF NOT EXISTS idx_import_batches_user ON import_batches(imported_by);

ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage import batches" ON import_batches;

CREATE POLICY "Admins manage import batches" ON import_batches
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

REVOKE ALL ON import_batches FROM anon;
GRANT SELECT ON import_batches TO authenticated;
GRANT ALL ON import_batches TO service_role;
