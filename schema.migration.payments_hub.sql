-- Payment & Invoicing Hub — MVP
-- Run once in Supabase SQL Editor after prior migrations.

-- ─── Enums ───────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE payment_request_type AS ENUM ('rent', 'vaad_bayit', 'one_off', 'repair');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_provider_type AS ENUM ('acquiring', 'invoicing');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_provider_vendor AS ENUM (
    'grow', 'tranzila', 'meshulam', 'icount', 'morning', 'invoice4u'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE integration_status AS ENUM ('disconnected', 'connected', 'error');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Integrations ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payment_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_type payment_provider_type NOT NULL,
  vendor payment_provider_vendor NOT NULL,
  display_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  is_sandbox BOOLEAN NOT NULL DEFAULT TRUE,
  credentials JSONB NOT NULL DEFAULT '{}',
  settings JSONB NOT NULL DEFAULT '{}',
  status integration_status NOT NULL DEFAULT 'disconnected',
  last_error TEXT,
  connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (owner_id, provider_type, vendor)
);

CREATE INDEX IF NOT EXISTS idx_payment_integrations_owner ON public.payment_integrations(owner_id);

ALTER TABLE public.payment_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners manage payment integrations" ON public.payment_integrations;
CREATE POLICY "Owners manage payment integrations" ON public.payment_integrations
  FOR ALL USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Admins full access payment integrations" ON public.payment_integrations;
CREATE POLICY "Admins full access payment integrations" ON public.payment_integrations
  FOR ALL USING (public.is_admin());

-- ─── Outbound webhooks ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.outbound_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret TEXT,
  events TEXT[] NOT NULL DEFAULT ARRAY['payment.success'],
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.outbound_webhooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners manage outbound webhooks" ON public.outbound_webhooks;
CREATE POLICY "Owners manage outbound webhooks" ON public.outbound_webhooks
  FOR ALL USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Admins full access outbound webhooks" ON public.outbound_webhooks;
CREATE POLICY "Admins full access outbound webhooks" ON public.outbound_webhooks
  FOR ALL USING (public.is_admin());

-- ─── Payment events log ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  delivered BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_events_payment ON public.payment_events(payment_id);

ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers read payment events" ON public.payment_events;
CREATE POLICY "Managers read payment events" ON public.payment_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lease_payments lp
      JOIN public.leases l ON l.id = lp.lease_id
      WHERE lp.id = payment_id AND l.manager_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.lease_payments lp
      WHERE lp.id = payment_id AND lp.manager_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins full access payment events" ON public.payment_events;
CREATE POLICY "Admins full access payment events" ON public.payment_events
  FOR ALL USING (public.is_admin());

-- ─── Extend lease_payments ───────────────────────────────────────────────────
ALTER TABLE public.lease_payments
  ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'rent',
  ADD COLUMN IF NOT EXISTS checkout_slug TEXT,
  ADD COLUMN IF NOT EXISTS pdf_invoice_url TEXT,
  ADD COLUMN IF NOT EXISTS invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS provider_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_invoice_id TEXT,
  ADD COLUMN IF NOT EXISTS transfer_proof_url TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failure_reason TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_lease_payments_checkout_slug
  ON public.lease_payments(checkout_slug) WHERE checkout_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lease_payments_manager ON public.lease_payments(manager_id);

UPDATE public.lease_payments lp SET
  property_id = l.property_id,
  tenant_id = l.tenant_id,
  manager_id = l.manager_id
FROM public.leases l
WHERE l.id = lp.lease_id
  AND lp.property_id IS NULL;

-- ─── Tenants & profiles billing fields ───────────────────────────────────────
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS preferred_payment_method TEXT,
  ADD COLUMN IF NOT EXISTS recurring_token TEXT,
  ADD COLUMN IF NOT EXISTS recurring_provider TEXT,
  ADD COLUMN IF NOT EXISTS recurring_last4 TEXT,
  ADD COLUMN IF NOT EXISTS recurring_expires_at DATE;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS business_name TEXT,
  ADD COLUMN IF NOT EXISTS tax_id TEXT,
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_branch TEXT,
  ADD COLUMN IF NOT EXISTS bank_account TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_holder TEXT,
  ADD COLUMN IF NOT EXISTS invoice_footer TEXT;

-- ─── Public checkout RPC ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_payment_checkout_by_slug(p_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment lease_payments;
  v_lease leases;
  v_tenant tenants;
  v_property properties;
  v_manager profiles;
BEGIN
  SELECT * INTO v_payment FROM lease_payments
  WHERE checkout_slug = p_slug
    AND payment_status NOT IN ('paid', 'cancelled');
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT * INTO v_lease FROM leases WHERE id = v_payment.lease_id;
  SELECT * INTO v_tenant FROM tenants WHERE id = COALESCE(v_payment.tenant_id, v_lease.tenant_id);
  SELECT * INTO v_property FROM properties WHERE id = COALESCE(v_payment.property_id, v_lease.property_id);
  SELECT * INTO v_manager FROM profiles WHERE id = COALESCE(v_payment.manager_id, v_lease.manager_id);

  RETURN jsonb_build_object(
    'id', v_payment.id,
    'amount', v_payment.amount,
    'due_date', v_payment.due_date,
    'payment_type', COALESCE(v_payment.payment_type, 'rent'),
    'payment_status', v_payment.payment_status,
    'notes', v_payment.notes,
    'tenant_name', COALESCE(v_tenant.full_name, ''),
    'property_title', COALESCE(v_property.title, ''),
    'property_address', COALESCE(v_property.address, ''),
    'unit_number', (SELECT unit_number FROM property_units WHERE id = v_lease.unit_id),
    'manager_name', COALESCE(v_manager.business_name, v_manager.full_name, v_manager.company, ''),
    'bank_name', v_manager.bank_name,
    'bank_branch', v_manager.bank_branch,
    'bank_account', v_manager.bank_account,
    'bank_account_holder', v_manager.bank_account_holder
  );
END;
$$;

-- ─── Submit bank transfer proof (public) ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.submit_payment_transfer_proof(
  p_slug TEXT,
  p_proof_url TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INT;
BEGIN
  UPDATE lease_payments SET
    transfer_proof_url = p_proof_url,
    payment_status = 'pending_verification',
    payment_method = 'transfer',
    updated_at = NOW()
  WHERE checkout_slug = p_slug
    AND payment_status IN ('pending', 'overdue', 'failed');
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

-- ─── Mark paid (manager confirms transfer / webhook) ─────────────────────────
CREATE OR REPLACE FUNCTION public.complete_payment_checkout(
  p_slug TEXT,
  p_method TEXT DEFAULT 'credit',
  p_invoice_url TEXT DEFAULT NULL,
  p_invoice_number TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_manager UUID;
  v_amount NUMERIC;
  v_tenant_name TEXT;
BEGIN
  UPDATE lease_payments SET
    payment_status = 'paid',
    payment_method = COALESCE(p_method, payment_method),
    pdf_invoice_url = COALESCE(p_invoice_url, pdf_invoice_url),
    invoice_number = COALESCE(p_invoice_number, invoice_number),
    paid_at = NOW(),
    payment_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE checkout_slug = p_slug
    AND payment_status NOT IN ('paid', 'cancelled')
  RETURNING id, manager_id, amount INTO v_id, v_manager, v_amount;

  IF v_id IS NULL THEN RETURN NULL; END IF;

  SELECT t.full_name INTO v_tenant_name
  FROM lease_payments lp
  LEFT JOIN tenants t ON t.id = lp.tenant_id
  WHERE lp.id = v_id;

  IF v_manager IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, severity, link)
    VALUES (
      v_manager,
      'payment',
      'תשלום התקבל',
      COALESCE(v_tenant_name, 'שוכר') || ' שילם/ה ' || v_amount::TEXT || ' ₪',
      'info',
      '/broker/payments'
    );
  END IF;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_payment_checkout_by_slug(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_payment_transfer_proof(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_payment_checkout(TEXT, TEXT, TEXT, TEXT) TO authenticated;
