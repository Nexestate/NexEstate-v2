-- =============================================================================
-- signing_links target constraint + create_broker_signing_link RPC
-- Run in Supabase SQL Editor (project ynpdtbgmbunntckqmcaf) — idempotent
-- =============================================================================

-- Each link must reference property_id OR have both property_description and address.
DO $$
BEGIN
  IF to_regclass('public.signing_links') IS NOT NULL THEN
    ALTER TABLE public.signing_links DROP CONSTRAINT IF EXISTS signing_links_target_required;
    ALTER TABLE public.signing_links
      ADD CONSTRAINT signing_links_target_required CHECK (
        property_id IS NOT NULL
        OR (
          NULLIF(TRIM(property_description), '') IS NOT NULL
          AND NULLIF(TRIM(COALESCE(exact_address, property_address)), '') IS NOT NULL
        )
      );
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Skip signing_links_target_required: %', SQLERRM;
END $$;

CREATE OR REPLACE FUNCTION public.create_broker_signing_link(p_payload JSONB)
RETURNS public.signing_links
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_broker_id uuid;
  v_property_id uuid;
  v_property_description text;
  v_exact_address text;
  v_client_email text;
  v_row public.signing_links;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  v_broker_id := COALESCE(NULLIF(TRIM(p_payload->>'broker_id'), '')::uuid, v_user_id);
  IF v_broker_id <> v_user_id THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  v_property_id := NULLIF(TRIM(p_payload->>'property_id'), '')::uuid;
  v_property_description := NULLIF(TRIM(p_payload->>'property_description'), '');
  v_exact_address := NULLIF(TRIM(COALESCE(p_payload->>'exact_address', p_payload->>'property_address')), '');
  v_client_email := NULLIF(TRIM(COALESCE(p_payload->>'recipient_email', p_payload->>'client_email')), '');

  IF v_client_email IS NULL THEN
    RAISE EXCEPTION 'client_email_required';
  END IF;

  IF v_property_id IS NULL AND (v_property_description IS NULL OR v_exact_address IS NULL) THEN
    RAISE EXCEPTION 'signing_links_target_required'
      USING HINT = 'Provide property_id or both property_description and exact_address';
  END IF;

  INSERT INTO public.signing_links (
    broker_id,
    token,
    client_name,
    client_phone,
    client_email,
    recipient_email,
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
    document_title,
    status
  ) VALUES (
    v_broker_id,
    COALESCE(NULLIF(TRIM(p_payload->>'token'), ''), encode(gen_random_bytes(16), 'hex')),
    TRIM(p_payload->>'client_name'),
    COALESCE(NULLIF(TRIM(p_payload->>'client_phone'), ''), ''),
    v_client_email,
    v_client_email,
    COALESCE(NULLIF(TRIM(p_payload->>'agreement_type'), ''), 'exclusive'),
    COALESCE((p_payload->>'commission_percent')::numeric, 2),
    COALESCE((p_payload->>'valid_days')::integer, 30),
    COALESCE(
      (p_payload->>'expires_at')::timestamptz,
      NOW() + (COALESCE((p_payload->>'valid_days')::integer, 30) || ' days')::interval
    ),
    v_property_id,
    COALESCE(NULLIF(TRIM(p_payload->>'deal_type'), ''), 'sale'),
    v_property_description,
    v_exact_address,
    v_exact_address,
    COALESCE((p_payload->>'show_address_before_signing')::boolean, false),
    NULLIF(TRIM(p_payload->>'price'), '')::numeric,
    NULLIF(TRIM(p_payload->>'hidden_details'), ''),
    COALESCE(NULLIF(TRIM(p_payload->>'commission_type'), ''), 'percentage'),
    NULLIF(TRIM(p_payload->>'minimum_commission'), '')::numeric,
    COALESCE((p_payload->>'payment_days')::integer, 3),
    NULLIF(TRIM(p_payload->>'broker_name'), ''),
    NULLIF(TRIM(p_payload->>'document_title'), ''),
    COALESCE(NULLIF(TRIM(p_payload->>'status'), ''), 'pending')::signing_status
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_broker_signing_link(JSONB) TO authenticated;

SELECT 'schema.migration.signing_links_target OK' AS status;
