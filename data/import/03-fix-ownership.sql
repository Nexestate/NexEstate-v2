-- אבחון + תיקון: שיוך כל נתוני הייבוא ל-nexuservice@gmail.com
-- הרץ ב-Supabase SQL Editor (שאילתה אחת)

DO $$
DECLARE
  v_user_id uuid;
  v_prop_count int;
  v_unit_count int;
  v_tenant_count int;
  v_lease_count int;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = lower('nexuservice@gmail.com');
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'משתמש לא נמצא: nexuservice@gmail.com';
  END IF;

  -- תיקון שיוך לכל הנתונים שיובאו (לפי מזהי ה-UUID מה-CSV)
  UPDATE public.properties
  SET broker_id = v_user_id, owner_id = v_user_id, created_by = v_user_id
  WHERE id = 'a0000001-0000-0000-0000-000000000001'::uuid;

  UPDATE public.property_units
  SET broker_id = v_user_id
  WHERE property_id = 'a0000001-0000-0000-0000-000000000001'::uuid;

  UPDATE public.tenants
  SET manager_id = v_user_id, broker_id = v_user_id
  WHERE id::text LIKE 'b000000%';

  UPDATE public.leases
  SET manager_id = v_user_id
  WHERE property_id = 'a0000001-0000-0000-0000-000000000001'::uuid;

  -- וידוא פרופיל
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (v_user_id, 'nexuservice@gmail.com', 'מיכאל וינר', 'broker')
  ON CONFLICT (id) DO UPDATE SET role = 'broker', email = EXCLUDED.email;

  SELECT count(*) INTO v_prop_count FROM public.properties WHERE broker_id = v_user_id;
  SELECT count(*) INTO v_unit_count FROM public.property_units WHERE broker_id = v_user_id;
  SELECT count(*) INTO v_tenant_count FROM public.tenants WHERE manager_id = v_user_id;
  SELECT count(*) INTO v_lease_count FROM public.leases WHERE manager_id = v_user_id;

  RAISE NOTICE 'user_id: %', v_user_id;
  RAISE NOTICE 'נכסים: %, יחידות: %, שוכרים: %, חוזים: %', v_prop_count, v_unit_count, v_tenant_count, v_lease_count;
END $$;

-- תצוגת אבחון (אמור להחזיר שורה אחת עם מספרים)
SELECT
  (SELECT count(*) FROM public.properties WHERE id = 'a0000001-0000-0000-0000-000000000001') AS property_exists,
  (SELECT count(*) FROM public.property_units WHERE property_id = 'a0000001-0000-0000-0000-000000000001') AS units,
  (SELECT count(*) FROM public.tenants) AS tenants,
  (SELECT count(*) FROM public.leases WHERE property_id = 'a0000001-0000-0000-0000-000000000001') AS leases,
  (SELECT broker_id FROM public.properties WHERE id = 'a0000001-0000-0000-0000-000000000001') AS property_broker_id,
  (SELECT id FROM auth.users WHERE lower(email) = 'nexuservice@gmail.com') AS your_user_id;
