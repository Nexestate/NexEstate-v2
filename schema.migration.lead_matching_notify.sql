-- Run after schema.migration.matching_and_landing.sql
-- Adds property matching count to landing-page lead notifications.

CREATE OR REPLACE FUNCTION public.create_public_lead(
  p_slug TEXT,
  p_full_name TEXT,
  p_phone TEXT,
  p_email TEXT DEFAULT NULL,
  p_interest TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_page property_landing_pages;
  v_prop properties;
  v_lead_id UUID;
  v_match_count INT := 0;
  v_message TEXT;
BEGIN
  IF NULLIF(TRIM(p_full_name), '') IS NULL OR NULLIF(TRIM(p_phone), '') IS NULL THEN
    RAISE EXCEPTION 'name and phone are required';
  END IF;

  SELECT * INTO v_page FROM property_landing_pages
  WHERE slug = p_slug AND is_active = TRUE;
  IF NOT FOUND THEN RAISE EXCEPTION 'landing page not found'; END IF;

  SELECT * INTO v_prop FROM properties WHERE id = v_page.property_id;

  INSERT INTO leads (broker_id, property_id, full_name, phone, email, status, source, interest)
  VALUES (
    v_page.broker_id,
    v_page.property_id,
    TRIM(p_full_name),
    TRIM(p_phone),
    NULLIF(TRIM(p_email), ''),
    'new',
    'דף נחיתה — ' || COALESCE(v_prop.title, 'נכס'),
    NULLIF(TRIM(p_interest), '')
  )
  RETURNING id INTO v_lead_id;

  SELECT COUNT(*)::INT INTO v_match_count
  FROM properties p
  WHERE (p.broker_id = v_page.broker_id OR p.owner_id = v_page.broker_id)
    AND p.id != v_page.property_id
    AND p.status IN ('for_sale', 'for_rent')
    AND (v_prop.kind IS NULL OR p.kind = v_prop.kind)
    AND (
      NULLIF(TRIM(v_prop.city), '') IS NULL
      OR p.city ILIKE '%' || v_prop.city || '%'
      OR v_prop.city ILIKE '%' || p.city || '%'
    )
    AND (
      v_prop.price IS NULL OR v_prop.price <= 0
      OR p.price IS NULL OR p.price <= v_prop.price * 1.1
    )
    AND (v_prop.rooms IS NULL OR p.rooms IS NULL OR p.rooms >= v_prop.rooms)
    AND (v_prop.area_sqm IS NULL OR p.area_sqm IS NULL OR p.area_sqm >= v_prop.area_sqm);

  v_message := TRIM(p_full_name) || ' השאיר/ה פרטים לגבי ' || COALESCE(v_prop.title, 'נכס');
  IF v_match_count > 0 THEN
    v_message := v_message || ' · נמצאו ' || v_match_count || ' נכסים נוספים מתאימים';
  END IF;

  INSERT INTO notifications (user_id, type, title, message, severity, link)
  VALUES (
    v_page.broker_id,
    'lead',
    'ליד חדש מדף נחיתה',
    v_message,
    'info',
    '/broker/leads'
  );

  IF v_match_count > 0 THEN
    INSERT INTO notifications (user_id, type, title, message, severity, link)
    VALUES (
      v_page.broker_id,
      'match',
      'התאמות לליד חדש',
      'נמצאו ' || v_match_count || ' נכסים נוספים מתאימים לפרופיל של ' || TRIM(p_full_name),
      'info',
      '/broker/leads'
    );
  END IF;

  RETURN v_lead_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_public_lead(TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
