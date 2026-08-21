-- =============================================================================
-- NexEstate Database Schema v2
-- Run in Supabase SQL Editor (fresh project or after dropping old policies)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Enums ───────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'superadmin', 'admin', 'broker', 'buyer', 'developer',
    'owner', 'investor', 'manager', 'receiver', 'partner'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE property_kind AS ENUM (
    'apartment', 'house', 'office', 'commercial', 'industrial', 'land'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE property_status AS ENUM ('for_sale', 'for_rent', 'sold', 'rented');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE property_visibility AS ENUM ('private', 'public', 'off_market', 'auction');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE client_type AS ENUM ('buyer', 'seller', 'investor', 'renter', 'landlord');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'won', 'lost');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tenant_status AS ENUM ('active', 'ending', 'ended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tenant_type AS ENUM ('sole_proprietor', 'company');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tenant_rating AS ENUM ('new', 'good', 'excellent', 'warning', 'bad');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE unit_status AS ENUM ('available', 'occupied', 'maintenance', 'reserved');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE signing_status AS ENUM ('pending', 'sent', 'signed', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('open', 'in_progress', 'done');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE auction_status AS ENUM ('draft', 'scheduled', 'active', 'ended', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE unit_type AS ENUM (
    'office', 'industrial', 'storage', 'residential', 'commercial', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Helper functions (RLS) ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_broker_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('broker', 'owner', 'manager', 'partner', 'developer', 'admin', 'superadmin')
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_property(p_property_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM properties
    WHERE id = p_property_id
      AND (broker_id = auth.uid() OR owner_id = auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.has_property_share(p_property_id UUID, p_min_level TEXT DEFAULT 'view')
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM property_shares ps
    WHERE ps.property_id = p_property_id
      AND ps.shared_with = auth.uid()
      AND (ps.expires_at IS NULL OR ps.expires_at > NOW())
      AND (
        p_min_level = 'view'
        OR ps.permission_level IN ('edit', 'admin')
        OR (p_min_level = 'edit' AND ps.permission_level = 'edit')
        OR (p_min_level = 'admin' AND ps.permission_level = 'admin')
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_read_property(p_property_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM properties p
    WHERE p.id = p_property_id
      AND (
        p.visibility IN ('public', 'auction')
        OR p.broker_id = auth.uid()
        OR p.owner_id = auth.uid()
        OR public.is_admin()
        OR public.has_property_share(p.id, 'view')
      )
  );
$$;

-- ─── Profiles ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  role user_role NOT NULL DEFAULT 'buyer',
  company TEXT,
  license_number TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (public.is_admin());

-- ─── Properties ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  kind property_kind NOT NULL DEFAULT 'office',
  status property_status NOT NULL DEFAULT 'for_rent',
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  rooms INT,
  bathrooms INT,
  area_sqm NUMERIC(10, 2),
  floor INT,
  total_floors INT,
  parking_spots INT,
  year_built INT,
  lat NUMERIC,
  lng NUMERIC,
  description TEXT,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  broker_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  visibility property_visibility NOT NULL DEFAULT 'private',
  images TEXT[] DEFAULT '{}',
  documents TEXT[] DEFAULT '{}',
  features JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Brokers and owners can manage properties" ON properties;
DROP POLICY IF EXISTS "Anyone can view public properties" ON properties;
DROP POLICY IF EXISTS "Shared users can view properties" ON properties;
DROP POLICY IF EXISTS "Brokers and owners can insert properties" ON properties;
DROP POLICY IF EXISTS "Brokers and owners can update properties" ON properties;
DROP POLICY IF EXISTS "Brokers and owners can delete properties" ON properties;
DROP POLICY IF EXISTS "Admins full access properties" ON properties;

CREATE POLICY "Anyone can view public properties" ON properties
  FOR SELECT USING (visibility IN ('public', 'auction'));

CREATE POLICY "Shared users can view properties" ON properties
  FOR SELECT USING (public.has_property_share(id, 'view'));

CREATE POLICY "Brokers and owners can view own properties" ON properties
  FOR SELECT USING (broker_id = auth.uid() OR owner_id = auth.uid());

CREATE POLICY "Admins full access properties" ON properties
  FOR ALL USING (public.is_admin());

CREATE POLICY "Brokers and owners can insert properties" ON properties
  FOR INSERT WITH CHECK (
    broker_id = auth.uid() OR owner_id = auth.uid() OR public.is_broker_staff()
  );

CREATE POLICY "Brokers and owners can update properties" ON properties
  FOR UPDATE USING (broker_id = auth.uid() OR owner_id = auth.uid() OR public.has_property_share(id, 'edit'));

CREATE POLICY "Brokers and owners can delete properties" ON properties
  FOR DELETE USING (broker_id = auth.uid() OR owner_id = auth.uid());

-- ─── Property Units ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS property_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  broker_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  unit_number TEXT NOT NULL,
  unit_name TEXT,
  unit_type unit_type NOT NULL DEFAULT 'office',
  unit_status unit_status NOT NULL DEFAULT 'available',
  building TEXT,
  floor INT,
  area_sqm NUMERIC(10, 2),
  rooms INT,
  bathrooms INT,
  monthly_rent NUMERIC(10, 2),
  price NUMERIC(10, 2),
  management_fee NUMERIC(10, 2),
  amenities JSONB DEFAULT '{}',
  description TEXT,
  notes TEXT,
  tenant_id UUID,
  status property_status,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_units_property ON property_units(property_id);

ALTER TABLE property_units ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Property owners can manage units" ON property_units;
DROP POLICY IF EXISTS "Units readable via property access" ON property_units;
DROP POLICY IF EXISTS "Units manageable by property owner" ON property_units;
DROP POLICY IF EXISTS "Admins full access units" ON property_units;

CREATE POLICY "Units readable via property access" ON property_units
  FOR SELECT USING (public.can_read_property(property_id));

CREATE POLICY "Units manageable by property owner" ON property_units
  FOR ALL USING (public.owns_property(property_id) OR public.has_property_share(property_id, 'edit'));

CREATE POLICY "Admins full access units" ON property_units
  FOR ALL USING (public.is_admin());

-- ─── Tenants ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  broker_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  tenant_type tenant_type NOT NULL DEFAULT 'sole_proprietor',
  id_number TEXT,
  company_name TEXT,
  company_number TEXT,
  contact_name TEXT,
  phone TEXT,
  mobile TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  bank_name TEXT,
  bank_branch TEXT,
  bank_account TEXT,
  status tenant_status NOT NULL DEFAULT 'active',
  rating tenant_rating NOT NULL DEFAULT 'new',
  tags TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers can manage tenants" ON tenants;
DROP POLICY IF EXISTS "Admins full access tenants" ON tenants;

CREATE POLICY "Managers can manage tenants" ON tenants
  FOR ALL USING (manager_id = auth.uid());

CREATE POLICY "Admins full access tenants" ON tenants
  FOR ALL USING (public.is_admin());

-- ─── Leases ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS leases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES property_units(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  signed_date DATE,
  terminated_date DATE,
  termination_reason TEXT,
  monthly_rent NUMERIC(12, 2) NOT NULL,
  deposit NUMERIC(12, 2),
  deposit_months INT,
  include_vat BOOLEAN NOT NULL DEFAULT FALSE,
  vat_rate NUMERIC DEFAULT 17,
  payment_day INT,
  payment_frequency TEXT DEFAULT 'monthly',
  payment_method TEXT,
  check_amount NUMERIC(12, 2),
  total_checks INT,
  checks_remaining INT,
  next_check_date DATE,
  index_linked BOOLEAN NOT NULL DEFAULT FALSE,
  index_base NUMERIC,
  rent_increase_type TEXT,
  rent_increase_value NUMERIC,
  rent_increase_frequency TEXT,
  prepayment_discount_type TEXT,
  prepayment_discount_value NUMERIC,
  security_deposit_type TEXT,
  security_deposit_amount NUMERIC,
  security_deposit_details TEXT,
  security_check_amount NUMERIC,
  security_check_details TEXT,
  lease_number TEXT,
  unit_marking TEXT,
  equipment_included TEXT,
  special_terms TEXT,
  notice_period_days INT DEFAULT 90,
  documents TEXT[] DEFAULT '{}',
  agreement_document_url TEXT,
  agreement_signed_at TIMESTAMPTZ,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leases_property ON leases(property_id);
CREATE INDEX IF NOT EXISTS idx_leases_tenant ON leases(tenant_id);

ALTER TABLE leases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers can manage leases" ON leases;
DROP POLICY IF EXISTS "Admins full access leases" ON leases;

CREATE POLICY "Managers can manage leases" ON leases
  FOR ALL USING (manager_id = auth.uid());

CREATE POLICY "Admins full access leases" ON leases
  FOR ALL USING (public.is_admin());

-- ─── Clients ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  broker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  type client_type NOT NULL DEFAULT 'buyer',
  email TEXT,
  phone TEXT,
  budget_min NUMERIC(12, 2),
  budget_max NUMERIC(12, 2),
  preferred_cities TEXT[] DEFAULT '{}',
  preferred_kinds property_kind[] DEFAULT '{}',
  notes TEXT,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_broker ON clients(broker_id);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Brokers can manage clients" ON clients;
DROP POLICY IF EXISTS "Admins full access clients" ON clients;

CREATE POLICY "Brokers can manage clients" ON clients
  FOR ALL USING (broker_id = auth.uid());

CREATE POLICY "Admins full access clients" ON clients
  FOR ALL USING (public.is_admin());

-- ─── Leads ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  broker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL DEFAULT '',
  status lead_status NOT NULL DEFAULT 'new',
  source TEXT,
  interest TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_broker ON leads(broker_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Brokers can manage leads" ON leads;
DROP POLICY IF EXISTS "Admins full access leads" ON leads;

CREATE POLICY "Brokers can manage leads" ON leads
  FOR ALL USING (broker_id = auth.uid());

CREATE POLICY "Admins full access leads" ON leads
  FOR ALL USING (public.is_admin());

-- ─── Signing Links ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS signing_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  broker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL DEFAULT '',
  client_email TEXT,
  signer_id_number TEXT,
  signer_company_name TEXT,
  signer_address TEXT,
  deal_type TEXT NOT NULL DEFAULT 'sale',
  agreement_type TEXT NOT NULL DEFAULT 'exclusive',
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  property_description TEXT,
  property_address TEXT,
  exact_address TEXT,
  show_address_before_signing BOOLEAN NOT NULL DEFAULT FALSE,
  price NUMERIC(12, 2),
  hidden_details TEXT,
  commission_type TEXT NOT NULL DEFAULT 'percentage',
  commission_percent NUMERIC(5, 2) DEFAULT 2,
  minimum_commission NUMERIC(12, 2),
  payment_days INT DEFAULT 3,
  valid_days INT DEFAULT 30,
  expires_at TIMESTAMPTZ,
  status signing_status NOT NULL DEFAULT 'pending',
  signature_data JSONB,
  signed_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  pdf_url TEXT,
  broker_name TEXT,
  custom_agreement_text TEXT,
  whatsapp_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signing_links_token ON signing_links(token);

ALTER TABLE signing_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Brokers can manage signing links" ON signing_links;
DROP POLICY IF EXISTS "Public can read signing link by token" ON signing_links;
DROP POLICY IF EXISTS "Admins full access signing links" ON signing_links;

CREATE POLICY "Brokers can manage signing links" ON signing_links
  FOR ALL USING (broker_id = auth.uid());

CREATE POLICY "Admins full access signing links" ON signing_links
  FOR ALL USING (public.is_admin());

-- Public signing RPCs (no broad SELECT/UPDATE policies for anon)
CREATE OR REPLACE FUNCTION public.get_signing_link_by_token(p_token TEXT)
RETURNS SETOF signing_links
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM signing_links
  WHERE token = p_token
    AND (expires_at IS NULL OR expires_at > NOW())
    AND status <> 'expired';
$$;

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

GRANT EXECUTE ON FUNCTION public.get_signing_link_by_token(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_signing_by_token(TEXT, TEXT, TEXT, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_signing_by_token(TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT) TO anon, authenticated;

-- ─── Tasks ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'open',
  priority task_priority NOT NULL DEFAULT 'medium',
  due_date DATE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own tasks" ON tasks;
DROP POLICY IF EXISTS "Admins full access tasks" ON tasks;

CREATE POLICY "Users manage own tasks" ON tasks
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins full access tasks" ON tasks
  FOR ALL USING (public.is_admin());

-- ─── Auctions ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS auctions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL NOT NULL,
  creator_id UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_price NUMERIC(12, 2) NOT NULL,
  current_price NUMERIC(12, 2),
  reserve_price NUMERIC(12, 2),
  min_increment NUMERIC(12, 2),
  status auction_status NOT NULL DEFAULT 'draft',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  winning_bid_id UUID,
  receiver_managed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active auctions" ON auctions;
DROP POLICY IF EXISTS "Creators manage auctions" ON auctions;
DROP POLICY IF EXISTS "Admins full access auctions" ON auctions;

CREATE POLICY "Anyone can view active auctions" ON auctions
  FOR SELECT USING (status IN ('scheduled', 'active', 'ended'));

CREATE POLICY "Creators manage auctions" ON auctions
  FOR ALL USING (creator_id = auth.uid() OR public.is_broker_staff());

CREATE POLICY "Admins full access auctions" ON auctions
  FOR ALL USING (public.is_admin());

-- ─── Property Shares ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS property_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  shared_with UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permission_level TEXT NOT NULL DEFAULT 'view',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (property_id, shared_with)
);

ALTER TABLE property_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Share participants can view" ON property_shares;
DROP POLICY IF EXISTS "Sharers can manage shares" ON property_shares;
DROP POLICY IF EXISTS "Admins full access shares" ON property_shares;

CREATE POLICY "Share participants can view" ON property_shares
  FOR SELECT USING (shared_with = auth.uid() OR shared_by = auth.uid() OR public.is_admin());

CREATE POLICY "Sharers can manage shares" ON property_shares
  FOR ALL USING (shared_by = auth.uid() OR public.owns_property(property_id));

CREATE POLICY "Admins full access shares" ON property_shares
  FOR ALL USING (public.is_admin());

-- ─── Pending Invites ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pending_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES profiles(id) NOT NULL,
  email TEXT NOT NULL,
  permission_level TEXT NOT NULL DEFAULT 'view',
  intended_role user_role NOT NULL DEFAULT 'owner',
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pending_invites_email ON pending_invites(email);

ALTER TABLE pending_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Inviters manage pending invites" ON pending_invites;
DROP POLICY IF EXISTS "Admins full access pending invites" ON pending_invites;

CREATE POLICY "Inviters manage pending invites" ON pending_invites
  FOR ALL USING (invited_by = auth.uid() OR public.is_broker_staff());

CREATE POLICY "Admins full access pending invites" ON pending_invites
  FOR ALL USING (public.is_admin());

-- ─── Notifications ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'system',
  title TEXT NOT NULL,
  message TEXT,
  body TEXT,
  link TEXT,
  severity TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins full access notifications" ON notifications;

CREATE POLICY "Users can view own notifications" ON notifications
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins full access notifications" ON notifications
  FOR ALL USING (public.is_admin());

-- ─── Lease Payments ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lease_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  due_date DATE,
  payment_date DATE NOT NULL,
  payment_method TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  receipt_number TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lease_payments_lease ON lease_payments(lease_id);

ALTER TABLE lease_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers manage lease payments" ON lease_payments;
DROP POLICY IF EXISTS "Admins full access lease payments" ON lease_payments;

CREATE POLICY "Managers manage lease payments" ON lease_payments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM leases l WHERE l.id = lease_id AND l.manager_id = auth.uid())
  );

CREATE POLICY "Admins full access lease payments" ON lease_payments
  FOR ALL USING (public.is_admin());

-- ─── Auction Bids ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS auction_bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  is_winning BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

-- ─── Auth trigger: auto-create profile ───────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data->>'given_name'), ''),
      ''
    ),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'buyer')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name),
    role = COALESCE(EXCLUDED.role, profiles.role);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Claim pending invites on signup ─────────────────────────────────────────

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
      AND pi.status = 'pending'
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

DROP TRIGGER IF EXISTS on_profile_claim_invites ON profiles;
CREATE TRIGGER on_profile_claim_invites
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.claim_pending_invites();

-- ─── Storage buckets ─────────────────────────────────────────────────────────
-- Create buckets in Dashboard OR run once (requires service role in SQL editor)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'signed-contracts',
  'signed-contracts',
  false,
  10485760,
  ARRAY['application/pdf', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Public read property images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Owner update property images" ON storage.objects;
DROP POLICY IF EXISTS "Owner delete property images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated read signed contracts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload signed contracts" ON storage.objects;

CREATE POLICY "Public read property images" ON storage.objects
  FOR SELECT USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated upload property images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'property-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Owner update property images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'property-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Owner delete property images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'property-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Authenticated read signed contracts" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'signed-contracts'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.is_admin()
    )
  );

CREATE POLICY "Authenticated upload signed contracts" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'signed-contracts'
    AND auth.role() = 'authenticated'
  );

-- ─── Updated_at trigger for properties ───────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS properties_updated_at ON properties;
CREATE TRIGGER properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS leads_updated_at ON leads;
CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
