-- =============================================================================
-- NexEstate fix_enums.sql
-- RUN THIS FIRST (alone), then run fix_schema.sql
--
-- Postgres rule: new enum values must be COMMITTEd before they can be used.
-- Do NOT wrap this file in BEGIN/COMMIT with fix_schema.sql.
-- =============================================================================

-- property_visibility
DO $$ BEGIN
  CREATE TYPE property_visibility AS ENUM ('private', 'public', 'off_market', 'auction');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE property_visibility ADD VALUE IF NOT EXISTS 'private';
ALTER TYPE property_visibility ADD VALUE IF NOT EXISTS 'public';
ALTER TYPE property_visibility ADD VALUE IF NOT EXISTS 'off_market';
ALTER TYPE property_visibility ADD VALUE IF NOT EXISTS 'auction';

-- auction_status
DO $$ BEGIN
  CREATE TYPE auction_status AS ENUM ('draft', 'scheduled', 'active', 'ended', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE auction_status ADD VALUE IF NOT EXISTS 'draft';
ALTER TYPE auction_status ADD VALUE IF NOT EXISTS 'scheduled';
ALTER TYPE auction_status ADD VALUE IF NOT EXISTS 'active';
ALTER TYPE auction_status ADD VALUE IF NOT EXISTS 'ended';
ALTER TYPE auction_status ADD VALUE IF NOT EXISTS 'cancelled';

-- user_role
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'superadmin', 'admin', 'broker', 'buyer', 'developer',
    'owner', 'investor', 'manager', 'receiver', 'partner'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superadmin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'broker';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'buyer';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'developer';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'owner';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'investor';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'receiver';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'partner';

-- unit_type
DO $$ BEGIN
  CREATE TYPE unit_type AS ENUM (
    'office', 'industrial', 'storage', 'residential', 'commercial', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE unit_type ADD VALUE IF NOT EXISTS 'office';
ALTER TYPE unit_type ADD VALUE IF NOT EXISTS 'industrial';
ALTER TYPE unit_type ADD VALUE IF NOT EXISTS 'storage';
ALTER TYPE unit_type ADD VALUE IF NOT EXISTS 'residential';
ALTER TYPE unit_type ADD VALUE IF NOT EXISTS 'commercial';
ALTER TYPE unit_type ADD VALUE IF NOT EXISTS 'other';

-- invite_status (legacy; status column may later be converted to TEXT)
DO $$ BEGIN
  CREATE TYPE invite_status AS ENUM ('pending', 'claimed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE invite_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE invite_status ADD VALUE IF NOT EXISTS 'claimed';
ALTER TYPE invite_status ADD VALUE IF NOT EXISTS 'cancelled';

-- Verify
SELECT t.typname AS enum_name, e.enumlabel AS value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname IN (
  'property_visibility', 'auction_status', 'user_role', 'unit_type', 'invite_status'
)
ORDER BY 1, e.enumsortorder;
