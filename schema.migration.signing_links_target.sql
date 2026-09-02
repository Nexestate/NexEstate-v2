-- Run once in Supabase SQL Editor (production).
-- Fixes signing_links_target_required and adds a safe insert RPC.

ALTER TABLE public.signing_links ADD COLUMN IF NOT EXISTS property_description TEXT;
ALTER TABLE public.signing_links ADD COLUMN IF NOT EXISTS property_address TEXT;
ALTER TABLE public.signing_links ADD COLUMN IF NOT EXISTS exact_address TEXT;
ALTER TABLE public.signing_links ADD COLUMN IF NOT EXISTS recipient_email TEXT;
ALTER TABLE public.signing_links ADD COLUMN IF NOT EXISTS document_title TEXT;

ALTER TABLE public.signing_links DROP CONSTRAINT IF EXISTS signing_links_target_required;

ALTER TABLE public.signing_links ADD CONSTRAINT signing_links_target_required CHECK (
  property_id IS NOT NULL
  OR (
    NULLIF(TRIM(property_description), '') IS NOT NULL
    AND NULLIF(TRIM(COALESCE(exact_address, property_address)), '') IS NOT NULL
  )
);

CREATE OR REPLACE FUNCTION public.create_broker_signing_link(p_data JSONB)
RETURNS public.signing_links
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.signing_links;
  v_broker_id UUID := auth.uid();
  v_desc TEXT := NULLIF(TRIM(p_data->>'property_description'), '');
  v_addr TEXT := NULLIF(TRIM(COALESCE(p_data->>'exact_address', p_data->>'property_address')), '');
  v_property_id UUID := NULLIF(p_data->>'property_id', '')::UUID;
BEGIN
  IF v_broker_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF v_property_id IS NULL AND (v_desc IS NULL OR v_addr IS NULL) THEN
    RAISE EXCEPTION 'יש לציין נכס: בחר נכס קיים או מלא תיאור נכס וכתובת מדויקת';
  END IF;

  INSERT INTO public.signing_links (
    broker_id,
    token,
    client_name,
    client_phone,
    client_email,
    recipient_email,
    document_title,
    agreement_type,
    commission_percent,
    valid_days,
    expires_at,
    property_id,
    deal_type,
    property_description,
    property_address,
    exact_address,
    show_address_before_signing,
    price,
    hidden_details,
    commission_type,
    minimum_commission,
    payment_days,
    broker_name,
    status
  ) VALUES (
    v_broker_id,
    COALESCE(NULLIF(p_data->>'token', ''), encode(gen_random_bytes(16), 'hex')),
    p_data->>'client_name',
    COALESCE(p_data->>'client_phone', ''),
    p_data->>'client_email',
    COALESCE(p_data->>'recipient_email', p_data->>'client_email'),
    p_data->>'document_title',
    COALESCE(p_data->>'agreement_type', 'exclusive'),
    COALESCE((p_data->>'commission_percent')::NUMERIC, 2),
    COALESCE((p_data->>'valid_days')::INT, 30),
    COALESCE((p_data->>'expires_at')::TIMESTAMPTZ, NOW() + make_interval(days => COALESCE((p_data->>'valid_days')::INT, 30))),
    v_property_id,
    COALESCE(p_data->>'deal_type', 'sale'),
    v_desc,
    v_addr,
    v_addr,
    COALESCE((p_data->>'show_address_before_signing')::BOOLEAN, false),
    NULLIF(p_data->>'price', '')::NUMERIC,
    NULLIF(p_data->>'hidden_details', ''),
    COALESCE(p_data->>'commission_type', 'percentage'),
    NULLIF(p_data->>'minimum_commission', '')::NUMERIC,
    COALESCE((p_data->>'payment_days')::INT, 3),
    p_data->>'broker_name',
    COALESCE(p_data->>'status', 'pending')::signing_status
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_broker_signing_link(JSONB) TO authenticated;
