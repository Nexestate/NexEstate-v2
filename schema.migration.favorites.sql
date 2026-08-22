-- =============================================================================
-- property_favorites — buyer saved listings
-- Run in Supabase SQL Editor (idempotent)
-- =============================================================================

CREATE TABLE IF NOT EXISTS property_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_property_favorites_user ON property_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_property_favorites_property ON property_favorites(property_id);

ALTER TABLE property_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own favorites" ON property_favorites;
CREATE POLICY "Users manage own favorites" ON property_favorites
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

SELECT 'schema.migration.favorites OK' AS status;
