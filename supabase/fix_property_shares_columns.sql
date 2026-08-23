-- Run once in Supabase SQL Editor BEFORE claim_invites_rpc / manual share insert.
-- Aligns legacy column names (shared_with_user_id) with the app (shared_with).

DO $$
BEGIN
  -- shared_with
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'property_shares' AND column_name = 'shared_with_user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'property_shares' AND column_name = 'shared_with'
  ) THEN
    ALTER TABLE public.property_shares RENAME COLUMN shared_with_user_id TO shared_with;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'property_shares' AND column_name = 'shared_with_user_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'property_shares' AND column_name = 'shared_with'
  ) THEN
    UPDATE public.property_shares
    SET shared_with = COALESCE(shared_with, shared_with_user_id)
    WHERE shared_with IS NULL AND shared_with_user_id IS NOT NULL;
    ALTER TABLE public.property_shares DROP COLUMN shared_with_user_id;
  END IF;

  -- shared_by
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'property_shares' AND column_name = 'shared_by_user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'property_shares' AND column_name = 'shared_by'
  ) THEN
    ALTER TABLE public.property_shares RENAME COLUMN shared_by_user_id TO shared_by;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'property_shares' AND column_name = 'shared_by_user_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'property_shares' AND column_name = 'shared_by'
  ) THEN
    UPDATE public.property_shares
    SET shared_by = COALESCE(shared_by, shared_by_user_id)
    WHERE shared_by IS NULL AND shared_by_user_id IS NOT NULL;
    ALTER TABLE public.property_shares DROP COLUMN shared_by_user_id;
  END IF;
END $$;

-- Ensure unique constraint for ON CONFLICT in RPC
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'property_shares_property_id_shared_with_key'
  ) THEN
    ALTER TABLE public.property_shares
      ADD CONSTRAINT property_shares_property_id_shared_with_key
      UNIQUE (property_id, shared_with);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'property_shares unique constraint: %', SQLERRM;
END $$;

-- Repair share for Michael (after column rename)
INSERT INTO public.property_shares (property_id, shared_with, shared_by, permission_level)
SELECT
  'a0000001-0000-0000-0000-000000000001'::uuid,
  p.id,
  pr.broker_id,
  'view'
FROM public.profiles p
JOIN public.properties pr ON pr.id = 'a0000001-0000-0000-0000-000000000001'::uuid
WHERE lower(p.email) = 'viner.michael@gmail.com'
ON CONFLICT (property_id, shared_with) DO UPDATE
  SET permission_level = EXCLUDED.permission_level;

UPDATE public.profiles
SET role = 'partner'
WHERE lower(email) = 'viner.michael@gmail.com';
