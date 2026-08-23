-- Run once in Supabase SQL Editor.
-- Lets invited users claim shares + role on login (bypasses RLS on property_shares insert).

CREATE OR REPLACE FUNCTION public.claim_my_pending_invites()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_email text;
  v_current_role user_role;
  v_best_role user_role := 'buyer';
  v_priority int := 0;
  v_current_priority int := 0;
  v_invite RECORD;
  v_role_map int;
  v_claimed int := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT email, role INTO v_email, v_current_role FROM profiles WHERE id = v_user_id;
  IF v_email IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_profile');
  END IF;

  v_current_priority := CASE v_current_role::text
    WHEN 'owner' THEN 3 WHEN 'manager' THEN 2 WHEN 'partner' THEN 1 ELSE 0 END;

  FOR v_invite IN
    SELECT * FROM pending_invites pi
    WHERE lower(pi.email) = lower(v_email)
      AND pi.property_id IS NOT NULL
      AND COALESCE(pi.status, 'pending') = 'pending'
      AND (pi.expires_at IS NULL OR pi.expires_at > NOW())
  LOOP
    INSERT INTO property_shares (property_id, shared_with, shared_by, permission_level)
    VALUES (v_invite.property_id, v_user_id, v_invite.invited_by, v_invite.permission_level)
    ON CONFLICT (property_id, shared_with) DO UPDATE
      SET permission_level = EXCLUDED.permission_level;

    UPDATE pending_invites
    SET status = 'claimed', accepted_at = NOW(), claimed_at = NOW()
    WHERE id = v_invite.id;

    v_claimed := v_claimed + 1;

    v_role_map := CASE v_invite.intended_role::text
      WHEN 'owner' THEN 3 WHEN 'manager' THEN 2 WHEN 'partner' THEN 1 ELSE 0 END;
    IF v_role_map > v_priority THEN
      v_priority := v_role_map;
      v_best_role := v_invite.intended_role;
    END IF;
  END LOOP;

  IF v_priority > v_current_priority AND v_best_role <> 'buyer' THEN
    UPDATE profiles SET role = v_best_role WHERE id = v_user_id;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'claimed', v_claimed,
    'role', (SELECT role FROM profiles WHERE id = v_user_id)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_my_pending_invites() TO authenticated;
