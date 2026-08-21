-- =============================================================================
-- google_oauth_setup.sql
-- Run once in Supabase SQL Editor after enabling Google provider in Dashboard.
-- Updates profile trigger so Google OAuth users get full_name from metadata.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role user_role := 'buyer';
  v_role_text TEXT;
  v_full_name TEXT;
BEGIN
  v_role_text := NULLIF(TRIM(NEW.raw_user_meta_data->>'role'), '');
  IF v_role_text IS NOT NULL THEN
    BEGIN
      v_role := v_role_text::user_role;
    EXCEPTION WHEN invalid_text_representation OR OTHERS THEN
      v_role := 'buyer';
    END;
  END IF;

  v_full_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'given_name'), ''),
    ''
  );

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, v_full_name, v_role)
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

SELECT 'google_oauth_setup OK' AS status;
