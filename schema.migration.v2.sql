-- =============================================================================
-- NexEstate Schema Migration v2 → Full Spec
-- Run AFTER schema.sql on existing projects (idempotent — safe to re-run)
-- =============================================================================

-- ─── New enums ───────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE unit_type AS ENUM (
    'office', 'industrial', 'storage', 'residential', 'commercial', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE invite_status AS ENUM ('pending', 'claimed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Profiles ────────────────────────────────────────────────────────────────

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ─── Properties ──────────────────────────────────────────────────────────────

ALTER TABLE properties ADD COLUMN IF NOT EXISTS bathrooms INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS total_floors INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS parking_spots INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS year_built INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS lat NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS lng NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

-- ─── Pending invites (spec fields) ─────────────────────────────────────────────

ALTER TABLE pending_invites ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE pending_invites ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE pending_invites ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
ALTER TABLE pending_invites ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

UPDATE pending_invites SET status = 'claimed', accepted_at = claimed_at
WHERE claimed_at IS NOT NULL AND (status IS NULL OR status = 'pending');

-- ─── Clients ─────────────────────────────────────────────────────────────────

ALTER TABLE clients ADD COLUMN IF NOT EXISTS preferred_kinds property_kind[];
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ─── Leads ───────────────────────────────────────────────────────────────────

ALTER TABLE leads ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS interest TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes TEXT;

-- ─── Tasks ───────────────────────────────────────────────────────────────────

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ─── Tenants ─────────────────────────────────────────────────────────────────

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS broker_id UUID REFERENCES profiles(id);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS id_number TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS mobile TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS bank_branch TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS bank_account TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS tags TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ─── Property units ──────────────────────────────────────────────────────────

ALTER TABLE property_units ADD COLUMN IF NOT EXISTS broker_id UUID REFERENCES profiles(id);
ALTER TABLE property_units ADD COLUMN IF NOT EXISTS unit_type unit_type DEFAULT 'office';
ALTER TABLE property_units ADD COLUMN IF NOT EXISTS building TEXT;
ALTER TABLE property_units ADD COLUMN IF NOT EXISTS floor INTEGER;
ALTER TABLE property_units ADD COLUMN IF NOT EXISTS rooms INTEGER;
ALTER TABLE property_units ADD COLUMN IF NOT EXISTS bathrooms INTEGER;
ALTER TABLE property_units ADD COLUMN IF NOT EXISTS price NUMERIC;
ALTER TABLE property_units ADD COLUMN IF NOT EXISTS management_fee NUMERIC;
ALTER TABLE property_units ADD COLUMN IF NOT EXISTS amenities JSONB;
ALTER TABLE property_units ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE property_units ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE property_units ADD COLUMN IF NOT EXISTS status property_status;
ALTER TABLE property_units ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ─── Leases (extended) ───────────────────────────────────────────────────────

ALTER TABLE leases ADD COLUMN IF NOT EXISTS signed_date DATE;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS terminated_date DATE;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS termination_reason TEXT;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS deposit_months INTEGER;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS include_vat BOOLEAN DEFAULT false;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS vat_rate NUMERIC DEFAULT 17;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS payment_day INTEGER;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS payment_frequency TEXT DEFAULT 'monthly';
ALTER TABLE leases ADD COLUMN IF NOT EXISTS check_amount NUMERIC;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS checks_remaining INTEGER;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS next_check_date DATE;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS index_linked BOOLEAN DEFAULT false;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS index_base NUMERIC;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS rent_increase_type TEXT;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS rent_increase_value NUMERIC;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS rent_increase_frequency TEXT;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS prepayment_discount_type TEXT;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS prepayment_discount_value NUMERIC;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS security_deposit_type TEXT;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS security_deposit_amount NUMERIC;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS security_deposit_details TEXT;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS security_check_amount NUMERIC;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS security_check_details TEXT;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS lease_number TEXT;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS unit_marking TEXT;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS equipment_included TEXT;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS special_terms TEXT;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS notice_period_days INTEGER DEFAULT 90;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS documents TEXT[];
ALTER TABLE leases ADD COLUMN IF NOT EXISTS agreement_document_url TEXT;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS agreement_signed_at TIMESTAMPTZ;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ─── Signing links (extended) ────────────────────────────────────────────────

ALTER TABLE signing_links ADD COLUMN IF NOT EXISTS signer_id_number TEXT;
ALTER TABLE signing_links ADD COLUMN IF NOT EXISTS signer_company_name TEXT;
ALTER TABLE signing_links ADD COLUMN IF NOT EXISTS signer_address TEXT;
ALTER TABLE signing_links ADD COLUMN IF NOT EXISTS deal_type TEXT DEFAULT 'sale';
ALTER TABLE signing_links ADD COLUMN IF NOT EXISTS property_description TEXT;
ALTER TABLE signing_links ADD COLUMN IF NOT EXISTS exact_address TEXT;
ALTER TABLE signing_links ADD COLUMN IF NOT EXISTS show_address_before_signing BOOLEAN DEFAULT false;
ALTER TABLE signing_links ADD COLUMN IF NOT EXISTS price NUMERIC;
ALTER TABLE signing_links ADD COLUMN IF NOT EXISTS hidden_details TEXT;
ALTER TABLE signing_links ADD COLUMN IF NOT EXISTS commission_type TEXT DEFAULT 'percentage';
ALTER TABLE signing_links ADD COLUMN IF NOT EXISTS minimum_commission NUMERIC;
ALTER TABLE signing_links ADD COLUMN IF NOT EXISTS payment_days INTEGER DEFAULT 3;
ALTER TABLE signing_links ADD COLUMN IF NOT EXISTS valid_days INTEGER DEFAULT 30;
ALTER TABLE signing_links ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE signing_links ADD COLUMN IF NOT EXISTS broker_name TEXT;
ALTER TABLE signing_links ADD COLUMN IF NOT EXISTS custom_agreement_text TEXT;
ALTER TABLE signing_links ADD COLUMN IF NOT EXISTS whatsapp_verified BOOLEAN DEFAULT false;

-- ─── Notifications (spec aliases) ────────────────────────────────────────────

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;

UPDATE notifications SET body = message WHERE body IS NULL AND message IS NOT NULL;
UPDATE notifications SET read = is_read WHERE read IS NULL;

-- ─── Auctions (rename + extend) ──────────────────────────────────────────────

DO $$ BEGIN
  ALTER TABLE auctions RENAME COLUMN created_by TO creator_id;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE auctions RENAME COLUMN current_bid TO current_price;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

ALTER TABLE auctions ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES profiles(id);
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS current_price NUMERIC;
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS reserve_price NUMERIC;
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS min_increment NUMERIC;
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS winning_bid_id UUID;
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS receiver_managed BOOLEAN DEFAULT false;
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ─── Lease payments (new table) ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lease_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID REFERENCES leases(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  due_date DATE,
  payment_date DATE NOT NULL,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  receipt_number TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lease_payments_lease ON lease_payments(lease_id);

ALTER TABLE lease_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers manage lease payments" ON lease_payments;
DROP POLICY IF EXISTS "Admins full access lease payments" ON lease_payments;

CREATE POLICY "Managers manage lease payments" ON lease_payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM leases l
      WHERE l.id = lease_id AND l.manager_id = auth.uid()
    )
  );

CREATE POLICY "Admins full access lease payments" ON lease_payments
  FOR ALL USING (public.is_admin());

-- ─── Auction bids (new table) ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS auction_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID REFERENCES auctions(id) ON DELETE CASCADE NOT NULL,
  bidder_id UUID REFERENCES profiles(id) NOT NULL,
  amount NUMERIC NOT NULL,
  is_winning BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auction_bids_auction ON auction_bids(auction_id);

ALTER TABLE auction_bids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone view auction bids" ON auction_bids;
DROP POLICY IF EXISTS "Bidders place bids" ON auction_bids;
DROP POLICY IF EXISTS "Admins full access auction bids" ON auction_bids;

CREATE POLICY "Anyone view auction bids" ON auction_bids
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auctions a
      WHERE a.id = auction_id AND a.status IN ('scheduled', 'active', 'ended')
    )
  );

CREATE POLICY "Bidders place bids" ON auction_bids
  FOR INSERT WITH CHECK (bidder_id = auth.uid());

CREATE POLICY "Admins full access auction bids" ON auction_bids
  FOR ALL USING (public.is_admin());

-- ─── Updated claim trigger (status-based) ────────────────────────────────────

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
  END LOOP;

  IF v_best_role <> 'buyer' AND NEW.role = 'buyer' THEN
    UPDATE profiles SET role = v_best_role WHERE id = NEW.id;
    NEW.role := v_best_role;
  END IF;

  RETURN NEW;
END;
$$;

-- ─── Extended complete_signing RPC ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.complete_signing_by_token(
  p_token TEXT,
  p_client_name TEXT,
  p_client_phone TEXT,
  p_client_email TEXT,
  p_signature_data JSONB,
  p_signer_id_number TEXT DEFAULT NULL,
  p_signer_company_name TEXT DEFAULT NULL,
  p_signer_address TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INT;
BEGIN
  UPDATE signing_links
  SET
    status = 'signed',
    signed_at = NOW(),
    client_name = p_client_name,
    client_phone = p_client_phone,
    client_email = p_client_email,
    signature_data = p_signature_data,
    signer_id_number = COALESCE(p_signer_id_number, signer_id_number),
    signer_company_name = COALESCE(p_signer_company_name, signer_company_name),
    signer_address = COALESCE(p_signer_address, signer_address)
  WHERE token = p_token
    AND status IN ('pending', 'sent')
    AND (expires_at IS NULL OR expires_at > NOW());

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_signing_by_token(TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT) TO anon, authenticated;
