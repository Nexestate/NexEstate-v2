-- =============================================================================
-- fix_signup_trigger.sql
-- Run in Supabase SQL Editor if signup returns HTTP 500 / "database error"
-- Makes profile creation + invite claim resilient so auth.users insert succeeds.
-- =============================================================================

-- Safe role parse — invalid metadata role won't abort signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role user_role := 'buyer';
  v_role_text TEXT;
BEGIN
  v_role_text := NULLIF(TRIM(NEW.raw_user_meta_data->>'role'), '');
  IF v_role_text IS NOT NULL THEN
    BEGIN
      v_role := v_role_text::user_role;
    EXCEPTION WHEN invalid_text_representation OR OTHERS THEN
      v_role := 'buyer';
    END;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), ''),
    v_role
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name),
    role = COALESCE(EXCLUDED.role, profiles.role);

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Invite claim must not block signup
CREATE OR REPLACE FUNCTION public.claim_pending_invites()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_best_role user_role := 'buyer';
  v_priority INT := 0;
  v_invite RECORD;
  v_role_map INT;
BEGIN
  FOR v_invite IN
    SELECT * FROM pending_invites pi
    WHERE lower(pi.email) = lower(NEW.email)
      AND pi.property_id IS NOT NULL
      AND COALESCE(pi.status, 'pending') = 'pending'
      AND (pi.expires_at IS NULL OR pi.expires_at > NOW())
  LOOP
    BEGIN
      INSERT INTO property_shares (property_id, shared_with, shared_by, permission_level)
      VALUES (v_invite.property_id, NEW.id, v_invite.invited_by, v_invite.permission_level)
      ON CONFLICT (property_id, shared_with) DO NOTHING;

      UPDATE pending_invites
      SET status = 'claimed', accepted_at = NOW(), claimed_at = NOW()
      WHERE id = v_invite.id;

      v_role_map := CASE v_invite.intended_role::text
        WHEN 'owner' THEN 3 WHEN 'manager' THEN 2 WHEN 'partner' THEN 1 ELSE 0 END;
      IF v_role_map > v_priority THEN
        v_priority := v_role_map;
        v_best_role := v_invite.intended_role;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'claim_pending_invites row failed: %', SQLERRM;
    END;
  END LOOP;

  IF v_best_role <> 'buyer' AND NEW.role = 'buyer' THEN
    UPDATE profiles SET role = v_best_role WHERE id = NEW.id;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'claim_pending_invites failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_profile_claim_invites ON public.profiles;
CREATE TRIGGER on_profile_claim_invites
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.claim_pending_invites();

-- Ensure unique constraint for ON CONFLICT in property_shares
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

SELECT 'fix_signup_trigger OK' AS status;
