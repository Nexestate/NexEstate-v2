-- =============================================================================
-- NexEstate fix_schema.sql  (FINAL)
-- Prerequisites: run fix_enums.sql FIRST (separate query), then this file.
-- Do NOT wrap in BEGIN/COMMIT.
-- Safe to re-run.
-- =============================================================================

-- ─── Helper: rename legacy col → target, or leave if target exists ───────────

CREATE OR REPLACE FUNCTION public._nex_ensure_rename(
  p_table TEXT,
  p_target TEXT,
  p_candidates TEXT[]
) RETURNS VOID
LANGUAGE plpgsql AS $$
DECLARE
  v_cand TEXT;
BEGIN
  IF to_regclass('public.' || p_table) IS NULL THEN
    RETURN;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = p_table AND column_name = p_target
  ) THEN
    RETURN;
  END IF;
  FOREACH v_cand IN ARRAY p_candidates LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = p_table AND column_name = v_cand
    ) THEN
      EXECUTE format('ALTER TABLE public.%I RENAME COLUMN %I TO %I', p_table, v_cand, p_target);
      RETURN;
    END IF;
  END LOOP;
END;
$$;

-- ─── 1. Drop triggers ────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS on_profile_claim_invites ON public.profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS properties_updated_at ON public.properties;
DROP TRIGGER IF EXISTS leads_updated_at ON public.leads;

-- ─── 2. Drop all public RLS policies ─────────────────────────────────────────

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Public read property images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Owner update property images" ON storage.objects;
DROP POLICY IF EXISTS "Owner delete property images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated read signed contracts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload signed contracts" ON storage.objects;

DROP VIEW IF EXISTS public.property_shares_view CASCADE;
DROP VIEW IF EXISTS public.shared_properties CASCADE;
DROP VIEW IF EXISTS public.v_property_shares CASCADE;

-- ─── 3. Drop dependent functions ─────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.complete_signing_by_token(TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.complete_signing_by_token(TEXT, TEXT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.get_signing_link_by_token(TEXT);
DROP FUNCTION IF EXISTS public.can_read_property(UUID);
DROP FUNCTION IF EXISTS public.has_property_share(UUID, TEXT);
DROP FUNCTION IF EXISTS public.has_property_share(UUID);
DROP FUNCTION IF EXISTS public.owns_property(UUID);
DROP FUNCTION IF EXISTS public.is_broker_staff();
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.current_user_role();
DROP FUNCTION IF EXISTS public.claim_pending_invites() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;

-- ─── 4. Legacy renames (only if target missing) ──────────────────────────────

SELECT public._nex_ensure_rename('property_shares', 'shared_with',
  ARRAY['user_id', 'recipient_id', 'shared_to', 'buyer_id']);
SELECT public._nex_ensure_rename('property_shares', 'shared_by',
  ARRAY['sharer_id', 'created_by', 'owner_id', 'inviter_id']);
SELECT public._nex_ensure_rename('property_shares', 'permission_level',
  ARRAY['permission', 'access_level']);

-- Owner columns for tasks/notifications FIRST (before any user_id → broker_id rename)
SELECT public._nex_ensure_rename('tasks', 'user_id',
  ARRAY['assigned_to', 'owner_id', 'created_by', 'profile_id', 'assignee_id']);
SELECT public._nex_ensure_rename('notifications', 'user_id',
  ARRAY['recipient_id', 'profile_id', 'owner_id', 'to_user_id', 'assigned_to']);

SELECT public._nex_ensure_rename('properties', 'broker_id',
  ARRAY['agent_id', 'listed_by', 'created_by']);
SELECT public._nex_ensure_rename('properties', 'owner_id',
  ARRAY['property_owner_id', 'landlord_id']);

SELECT public._nex_ensure_rename('clients', 'broker_id',
  ARRAY['agent_id', 'created_by', 'profile_id', 'user_id']);
SELECT public._nex_ensure_rename('leads', 'broker_id',
  ARRAY['agent_id', 'created_by', 'profile_id', 'user_id']);
SELECT public._nex_ensure_rename('leads', 'full_name',
  ARRAY['name', 'client_name']);

SELECT public._nex_ensure_rename('signing_links', 'broker_id',
  ARRAY['agent_id', 'created_by', 'profile_id', 'user_id']);

SELECT public._nex_ensure_rename('tenants', 'manager_id',
  ARRAY['managed_by', 'created_by', 'owner_id']);
SELECT public._nex_ensure_rename('leases', 'manager_id',
  ARRAY['managed_by', 'created_by', 'owner_id']);

SELECT public._nex_ensure_rename('auctions', 'creator_id',
  ARRAY['created_by', 'broker_id', 'owner_id']);
SELECT public._nex_ensure_rename('auctions', 'current_price',
  ARRAY['current_bid', 'price']);

SELECT public._nex_ensure_rename('pending_invites', 'invited_by',
  ARRAY['created_by', 'sharer_id', 'broker_id']);

-- ─── 5. Ensure tables exist (minimal) ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.property_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  shared_with UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  shared_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  permission_level TEXT DEFAULT 'view',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pending_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES public.profiles(id),
  email TEXT NOT NULL DEFAULT '',
  permission_level TEXT DEFAULT 'view',
  intended_role user_role DEFAULT 'owner',
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lease_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID REFERENCES public.leases(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  due_date DATE,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  receipt_number TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.auction_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  is_winning BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 6. ADD COLUMN IF NOT EXISTS — every column used by policies/app ─────────

-- profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'buyer';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS broker_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS visibility property_visibility DEFAULT 'private';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS city TEXT DEFAULT '';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS rooms INTEGER;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS bathrooms INTEGER;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS area_sqm NUMERIC;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS floor INTEGER;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS total_floors INTEGER;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS parking_spots INTEGER;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS year_built INTEGER;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS lat NUMERIC;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS lng NUMERIC;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS documents TEXT[] DEFAULT '{}';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- property_shares
ALTER TABLE public.property_shares ADD COLUMN IF NOT EXISTS property_id UUID;
ALTER TABLE public.property_shares ADD COLUMN IF NOT EXISTS shared_with UUID;
ALTER TABLE public.property_shares ADD COLUMN IF NOT EXISTS shared_by UUID;
ALTER TABLE public.property_shares ADD COLUMN IF NOT EXISTS permission_level TEXT DEFAULT 'view';
ALTER TABLE public.property_shares ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE public.property_shares ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- pending_invites
ALTER TABLE public.pending_invites ADD COLUMN IF NOT EXISTS property_id UUID;
ALTER TABLE public.pending_invites ADD COLUMN IF NOT EXISTS invited_by UUID;
ALTER TABLE public.pending_invites ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.pending_invites ADD COLUMN IF NOT EXISTS permission_level TEXT DEFAULT 'view';
ALTER TABLE public.pending_invites ADD COLUMN IF NOT EXISTS intended_role user_role DEFAULT 'owner';
ALTER TABLE public.pending_invites ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.pending_invites ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.pending_invites ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
ALTER TABLE public.pending_invites ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;
ALTER TABLE public.pending_invites ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE public.pending_invites ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Convert invite_status enum → TEXT if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pending_invites'
      AND column_name = 'status' AND udt_name = 'invite_status'
  ) THEN
    ALTER TABLE public.pending_invites ALTER COLUMN status TYPE TEXT USING status::text;
    ALTER TABLE public.pending_invites ALTER COLUMN status SET DEFAULT 'pending';
  END IF;
END $$;

UPDATE public.pending_invites
SET status = 'claimed', accepted_at = COALESCE(accepted_at, claimed_at)
WHERE claimed_at IS NOT NULL AND COALESCE(status::text, 'pending') = 'pending';

-- clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS broker_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS preferred_kinds property_kind[];
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS preferred_cities TEXT[] DEFAULT '{}';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS budget_min NUMERIC;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS budget_max NUMERIC;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS broker_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS property_id UUID;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS interest TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'phone'
  ) THEN
    EXECUTE $q$UPDATE public.leads SET full_name = COALESCE(full_name, phone, 'ליד') WHERE full_name IS NULL$q$;
  ELSE
    UPDATE public.leads SET full_name = 'ליד' WHERE full_name IS NULL;
  END IF;
END $$;

-- tasks  ★ was missing user_id
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS status task_status DEFAULT 'open';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS priority task_priority DEFAULT 'medium';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS property_id UUID;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- notifications  ★ was missing user_id
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'system';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'info';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'message'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'body'
  ) THEN
    UPDATE public.notifications SET body = message WHERE body IS NULL AND message IS NOT NULL;
    UPDATE public.notifications SET message = body WHERE message IS NULL AND body IS NOT NULL;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'is_read'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'read'
  ) THEN
    UPDATE public.notifications SET read = COALESCE(read, is_read);
    UPDATE public.notifications SET is_read = COALESCE(is_read, read, false);
  END IF;
END $$;

-- tenants
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS broker_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS id_number TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS company_number TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS mobile TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- leases
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS property_id UUID;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS unit_id UUID;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS monthly_rent NUMERIC;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS deposit NUMERIC;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS total_checks INTEGER;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- property_units
ALTER TABLE public.property_units ADD COLUMN IF NOT EXISTS property_id UUID;
ALTER TABLE public.property_units ADD COLUMN IF NOT EXISTS broker_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.property_units ADD COLUMN IF NOT EXISTS unit_number TEXT;
ALTER TABLE public.property_units ADD COLUMN IF NOT EXISTS unit_name TEXT;
ALTER TABLE public.property_units ADD COLUMN IF NOT EXISTS unit_type unit_type DEFAULT 'office';
ALTER TABLE public.property_units ADD COLUMN IF NOT EXISTS unit_status unit_status DEFAULT 'available';
ALTER TABLE public.property_units ADD COLUMN IF NOT EXISTS area_sqm NUMERIC;
ALTER TABLE public.property_units ADD COLUMN IF NOT EXISTS monthly_rent NUMERIC;
ALTER TABLE public.property_units ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.property_units ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.property_units ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- signing_links
ALTER TABLE public.signing_links ADD COLUMN IF NOT EXISTS broker_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.signing_links ADD COLUMN IF NOT EXISTS token TEXT;
ALTER TABLE public.signing_links ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE public.signing_links ADD COLUMN IF NOT EXISTS client_phone TEXT DEFAULT '';
ALTER TABLE public.signing_links ADD COLUMN IF NOT EXISTS client_email TEXT;
ALTER TABLE public.signing_links ADD COLUMN IF NOT EXISTS signer_id_number TEXT;
ALTER TABLE public.signing_links ADD COLUMN IF NOT EXISTS signer_company_name TEXT;
ALTER TABLE public.signing_links ADD COLUMN IF NOT EXISTS signer_address TEXT;
ALTER TABLE public.signing_links ADD COLUMN IF NOT EXISTS deal_type TEXT DEFAULT 'sale';
ALTER TABLE public.signing_links ADD COLUMN IF NOT EXISTS agreement_type TEXT DEFAULT 'exclusive';
ALTER TABLE public.signing_links ADD COLUMN IF NOT EXISTS property_id UUID;
ALTER TABLE public.signing_links ADD COLUMN IF NOT EXISTS property_description TEXT;
ALTER TABLE public.signing_links ADD COLUMN IF NOT EXISTS property_address TEXT;
ALTER TABLE public.signing_links ADD COLUMN IF NOT EXISTS exact_address TEXT;
ALTER TABLE public.signing_links ADD COLUMN IF NOT EXISTS show_address_before_signing BOOLEAN DEFAULT false;
ALTER TABLE public.signing_links ADD COLUMN IF NOT EXISTS price NUMERIC;
ALTER TABLE public.signing_links ADD COLUMN IF NOT EXISTS hidden_details TEXT;
ALTER TABLE public.signing_links ADD COLUMN IF NOT EXISTS commission_type TEXT DEFAULT 'percentage';
ALTER TABLE public.signing_links ADD COLUMN IF NOT EXISTS commission_percent NUMERIC DEFAULT 2;
ALTER TABLE public.signing_links ADD COLUMN IF NOT EXISTS minimum_commission NUMERIC;
ALTER TABLE public.signing_links ADD COLUMN IF NOT EXISTS payment_days INTEGER DEFAULT 3;
ALTER TABLE public.signing_links ADD COLUMN IF NOT EXISTS valid_days INTEGER DEFAULT 30;
ALTER TABLE public.signing_links ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE public.signing_links ADD COLUMN IF NOT EXISTS status signing_status DEFAULT 'pending';
ALTER TABLE public.signing_links ADD COLUMN IF NOT EXISTS signature_data JSONB;
ALTER TABLE public.signing_links ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;
ALTER TABLE public.signing_links ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE public.signing_links ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE public.signing_links ADD COLUMN IF NOT EXISTS broker_name TEXT;
ALTER TABLE public.signing_links ADD COLUMN IF NOT EXISTS custom_agreement_text TEXT;
ALTER TABLE public.signing_links ADD COLUMN IF NOT EXISTS whatsapp_verified BOOLEAN DEFAULT false;
ALTER TABLE public.signing_links ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- auctions
ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS property_id UUID;
ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS start_price NUMERIC;
ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS current_price NUMERIC;
ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS reserve_price NUMERIC;
ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS min_increment NUMERIC;
ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS status auction_status DEFAULT 'draft';
ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ;
ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ;
ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS winning_bid_id UUID;
ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS receiver_managed BOOLEAN DEFAULT false;
ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'auctions' AND column_name = 'current_bid'
  ) THEN
    UPDATE public.auctions SET current_price = current_bid
    WHERE current_price IS NULL AND current_bid IS NOT NULL;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'auctions' AND column_name = 'created_by'
  ) THEN
    UPDATE public.auctions SET creator_id = created_by
    WHERE creator_id IS NULL AND created_by IS NOT NULL;
  END IF;
END $$;

-- Unique on property_shares
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'property_shares_property_id_shared_with_key'
      AND conrelid = 'public.property_shares'::regclass
  ) THEN
    BEGIN
      ALTER TABLE public.property_shares
        ADD CONSTRAINT property_shares_property_id_shared_with_key UNIQUE (property_id, shared_with);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Skip unique property_shares: %', SQLERRM;
    END;
  END IF;
END $$;

-- ─── 7. Helper functions ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM profiles WHERE id = auth.uid(); $$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_broker_staff()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('broker', 'owner', 'manager', 'partner', 'developer', 'admin', 'superadmin')
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_property(p_property_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM properties
    WHERE id = p_property_id AND (broker_id = auth.uid() OR owner_id = auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.has_property_share(p_property_id UUID, p_min_level TEXT DEFAULT 'view')
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
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
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
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

CREATE OR REPLACE FUNCTION public.get_signing_link_by_token(p_token TEXT)
RETURNS SETOF signing_links
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
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
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_updated INT;
BEGIN
  UPDATE signing_links SET
    status = 'signed', signed_at = NOW(),
    client_name = p_client_name, client_phone = p_client_phone, client_email = p_client_email,
    signature_data = p_signature_data,
    signer_id_number = COALESCE(p_signer_id_number, signer_id_number),
    signer_company_name = COALESCE(p_signer_company_name, signer_company_name),
    signer_address = COALESCE(p_signer_address, signer_address)
  WHERE token = p_token AND status IN ('pending', 'sent')
    AND (expires_at IS NULL OR expires_at > NOW());
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_signing_link_by_token(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_signing_by_token(TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'buyer')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name),
    role = COALESCE(EXCLUDED.role, profiles.role);
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.claim_pending_invites()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
END; $$;

-- ─── 8. RLS policies ─────────────────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.is_admin());

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view public properties" ON public.properties
  FOR SELECT USING (visibility IN ('public', 'auction'));
CREATE POLICY "Shared users can view properties" ON public.properties
  FOR SELECT USING (public.has_property_share(id, 'view'));
CREATE POLICY "Brokers and owners can view own properties" ON public.properties
  FOR SELECT USING (broker_id = auth.uid() OR owner_id = auth.uid());
CREATE POLICY "Admins full access properties" ON public.properties FOR ALL USING (public.is_admin());
CREATE POLICY "Brokers and owners can insert properties" ON public.properties
  FOR INSERT WITH CHECK (broker_id = auth.uid() OR owner_id = auth.uid() OR public.is_broker_staff());
CREATE POLICY "Brokers and owners can update properties" ON public.properties
  FOR UPDATE USING (broker_id = auth.uid() OR owner_id = auth.uid() OR public.has_property_share(id, 'edit'));
CREATE POLICY "Brokers and owners can delete properties" ON public.properties
  FOR DELETE USING (broker_id = auth.uid() OR owner_id = auth.uid());

ALTER TABLE public.property_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Units readable via property access" ON public.property_units
  FOR SELECT USING (public.can_read_property(property_id));
CREATE POLICY "Units manageable by property owner" ON public.property_units
  FOR ALL USING (public.owns_property(property_id) OR public.has_property_share(property_id, 'edit'));
CREATE POLICY "Admins full access units" ON public.property_units FOR ALL USING (public.is_admin());

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers can manage tenants" ON public.tenants FOR ALL USING (manager_id = auth.uid());
CREATE POLICY "Admins full access tenants" ON public.tenants FOR ALL USING (public.is_admin());

ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers can manage leases" ON public.leases FOR ALL USING (manager_id = auth.uid());
CREATE POLICY "Admins full access leases" ON public.leases FOR ALL USING (public.is_admin());

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Brokers can manage clients" ON public.clients FOR ALL USING (broker_id = auth.uid());
CREATE POLICY "Admins full access clients" ON public.clients FOR ALL USING (public.is_admin());

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Brokers can manage leads" ON public.leads FOR ALL USING (broker_id = auth.uid());
CREATE POLICY "Admins full access leads" ON public.leads FOR ALL USING (public.is_admin());

ALTER TABLE public.signing_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Brokers can manage signing links" ON public.signing_links FOR ALL USING (broker_id = auth.uid());
CREATE POLICY "Admins full access signing links" ON public.signing_links FOR ALL USING (public.is_admin());

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tasks" ON public.tasks FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admins full access tasks" ON public.tasks FOR ALL USING (public.is_admin());

ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active auctions" ON public.auctions
  FOR SELECT USING (status IN ('scheduled', 'active', 'ended'));
CREATE POLICY "Creators manage auctions" ON public.auctions
  FOR ALL USING (creator_id = auth.uid() OR public.is_broker_staff());
CREATE POLICY "Admins full access auctions" ON public.auctions FOR ALL USING (public.is_admin());

ALTER TABLE public.property_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Share participants can view" ON public.property_shares
  FOR SELECT USING (shared_with = auth.uid() OR shared_by = auth.uid() OR public.is_admin());
CREATE POLICY "Sharers can manage shares" ON public.property_shares
  FOR ALL USING (shared_by = auth.uid() OR public.owns_property(property_id));
CREATE POLICY "Admins full access shares" ON public.property_shares FOR ALL USING (public.is_admin());

ALTER TABLE public.pending_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Inviters manage pending invites" ON public.pending_invites
  FOR ALL USING (invited_by = auth.uid() OR public.is_broker_staff());
CREATE POLICY "Admins full access pending invites" ON public.pending_invites
  FOR ALL USING (public.is_admin());

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admins full access notifications" ON public.notifications FOR ALL USING (public.is_admin());

ALTER TABLE public.lease_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers manage lease payments" ON public.lease_payments FOR ALL USING (
  EXISTS (SELECT 1 FROM leases l WHERE l.id = lease_id AND l.manager_id = auth.uid())
);
CREATE POLICY "Admins full access lease payments" ON public.lease_payments FOR ALL USING (public.is_admin());

ALTER TABLE public.auction_bids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view auction bids" ON public.auction_bids FOR SELECT USING (
  EXISTS (SELECT 1 FROM auctions a WHERE a.id = auction_id AND a.status IN ('scheduled', 'active', 'ended'))
);
CREATE POLICY "Bidders place bids" ON public.auction_bids FOR INSERT WITH CHECK (bidder_id = auth.uid());
CREATE POLICY "Admins full access auction bids" ON public.auction_bids FOR ALL USING (public.is_admin());

CREATE POLICY "Public read property images" ON storage.objects
  FOR SELECT USING (bucket_id = 'property-images');
CREATE POLICY "Authenticated upload property images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');
CREATE POLICY "Owner update property images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner delete property images" ON storage.objects
  FOR DELETE USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Authenticated read signed contracts" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'signed-contracts'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin())
  );
CREATE POLICY "Authenticated upload signed contracts" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'signed-contracts' AND auth.role() = 'authenticated');

-- ─── 9. Triggers ─────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_profile_claim_invites ON public.profiles;
CREATE TRIGGER on_profile_claim_invites
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.claim_pending_invites();

DROP TRIGGER IF EXISTS properties_updated_at ON public.properties;
CREATE TRIGGER properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS leads_updated_at ON public.leads;
CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Cleanup helper
DROP FUNCTION IF EXISTS public._nex_ensure_rename(TEXT, TEXT, TEXT[]);

-- Success check
SELECT 'fix_schema OK' AS status,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema='public' AND table_name='tasks' AND column_name='user_id') AS tasks_user_id,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema='public' AND table_name='notifications' AND column_name='user_id') AS notif_user_id,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema='public' AND table_name='properties' AND column_name='broker_id') AS prop_broker_id,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema='public' AND table_name='property_shares' AND column_name='shared_with') AS shares_shared_with;
