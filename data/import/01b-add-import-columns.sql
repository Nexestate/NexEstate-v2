-- שלב 1b: הרץ אחרי 01-fix-enums.sql ולפני 02-import-data.sql
-- מוסיף עמודות חסרות בסכמה הישנה של Supabase

-- properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id);

-- tenants
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS tenant_type tenant_type DEFAULT 'sole_proprietor';
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS bank_branch TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS bank_account TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS status tenant_status DEFAULT 'active';
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS rating tenant_rating DEFAULT 'new';
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS tags TEXT;

-- property_units
ALTER TABLE public.property_units ADD COLUMN IF NOT EXISTS unit_name TEXT;
ALTER TABLE public.property_units ADD COLUMN IF NOT EXISTS unit_type unit_type DEFAULT 'office';
ALTER TABLE public.property_units ADD COLUMN IF NOT EXISTS unit_status unit_status DEFAULT 'available';
ALTER TABLE public.property_units ADD COLUMN IF NOT EXISTS monthly_rent NUMERIC;
ALTER TABLE public.property_units ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.property_units ADD COLUMN IF NOT EXISTS building TEXT;
ALTER TABLE public.property_units ADD COLUMN IF NOT EXISTS floor INTEGER;
ALTER TABLE public.property_units ADD COLUMN IF NOT EXISTS rooms INTEGER;
ALTER TABLE public.property_units ADD COLUMN IF NOT EXISTS bathrooms INTEGER DEFAULT 1;
ALTER TABLE public.property_units ADD COLUMN IF NOT EXISTS price NUMERIC;
ALTER TABLE public.property_units ADD COLUMN IF NOT EXISTS management_fee NUMERIC;
ALTER TABLE public.property_units ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.property_units ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.property_units ADD COLUMN IF NOT EXISTS notes TEXT;
-- Live DB already has status as unit_status (occupied/available).
-- Do not add it as property_status — that would conflict if the column exists.

DO $$
BEGIN
  ALTER TABLE public.tenants ALTER COLUMN first_name DROP NOT NULL;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.tenants ALTER COLUMN last_name DROP NOT NULL;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.property_units ALTER COLUMN status DROP NOT NULL;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

-- leases
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS signed_date DATE;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS terminated_date DATE;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS termination_reason TEXT;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS deposit_months INTEGER DEFAULT 0;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS include_vat BOOLEAN DEFAULT true;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS vat_rate NUMERIC DEFAULT 18;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS payment_day INTEGER DEFAULT 1;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS payment_frequency TEXT DEFAULT 'monthly';
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS check_amount NUMERIC;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS checks_remaining INTEGER DEFAULT 0;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS next_check_date DATE;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS index_linked BOOLEAN DEFAULT false;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS index_base NUMERIC;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS rent_increase_type TEXT DEFAULT 'none';
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS rent_increase_value NUMERIC;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS rent_increase_frequency TEXT DEFAULT 'yearly';
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS prepayment_discount_type TEXT;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS prepayment_discount_value NUMERIC;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS security_deposit_type TEXT;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS security_deposit_amount NUMERIC DEFAULT 0;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS security_deposit_details TEXT;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS security_check_amount NUMERIC DEFAULT 0;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS security_check_details TEXT;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS lease_number TEXT;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS unit_marking TEXT;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS equipment_included TEXT;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS special_terms TEXT;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS notice_period_days INTEGER DEFAULT 60;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS agreement_document_url TEXT;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS documents TEXT[] DEFAULT '{}';

SELECT 'import columns ready' AS status;
