-- שלב 1: הרץ קודם את הקובץ הזה בלבד, ואז 02-import-data.sql
-- Postgres דורש commit לפני שימוש בערכי enum חדשים

DO $$ BEGIN
  CREATE TYPE property_status AS ENUM ('for_sale', 'for_rent', 'sold', 'rented');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE property_status ADD VALUE IF NOT EXISTS 'for_sale';
ALTER TYPE property_status ADD VALUE IF NOT EXISTS 'for_rent';
ALTER TYPE property_status ADD VALUE IF NOT EXISTS 'sold';
ALTER TYPE property_status ADD VALUE IF NOT EXISTS 'rented';

DO $$ BEGIN
  CREATE TYPE property_kind AS ENUM ('apartment', 'house', 'office', 'commercial', 'industrial', 'land');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE property_kind ADD VALUE IF NOT EXISTS 'apartment';
ALTER TYPE property_kind ADD VALUE IF NOT EXISTS 'house';
ALTER TYPE property_kind ADD VALUE IF NOT EXISTS 'office';
ALTER TYPE property_kind ADD VALUE IF NOT EXISTS 'commercial';
ALTER TYPE property_kind ADD VALUE IF NOT EXISTS 'industrial';
ALTER TYPE property_kind ADD VALUE IF NOT EXISTS 'land';

DO $$ BEGIN
  CREATE TYPE property_visibility AS ENUM ('private', 'public', 'off_market', 'auction');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE property_visibility ADD VALUE IF NOT EXISTS 'private';
ALTER TYPE property_visibility ADD VALUE IF NOT EXISTS 'public';
ALTER TYPE property_visibility ADD VALUE IF NOT EXISTS 'off_market';
ALTER TYPE property_visibility ADD VALUE IF NOT EXISTS 'auction';

DO $$ BEGIN
  CREATE TYPE unit_status AS ENUM ('available', 'occupied', 'maintenance', 'reserved');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE unit_status ADD VALUE IF NOT EXISTS 'available';
ALTER TYPE unit_status ADD VALUE IF NOT EXISTS 'occupied';
ALTER TYPE unit_status ADD VALUE IF NOT EXISTS 'maintenance';
ALTER TYPE unit_status ADD VALUE IF NOT EXISTS 'reserved';

DO $$ BEGIN
  CREATE TYPE unit_type AS ENUM ('office', 'industrial', 'storage', 'residential', 'commercial', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE unit_type ADD VALUE IF NOT EXISTS 'office';
ALTER TYPE unit_type ADD VALUE IF NOT EXISTS 'industrial';
ALTER TYPE unit_type ADD VALUE IF NOT EXISTS 'storage';
ALTER TYPE unit_type ADD VALUE IF NOT EXISTS 'residential';
ALTER TYPE unit_type ADD VALUE IF NOT EXISTS 'commercial';
ALTER TYPE unit_type ADD VALUE IF NOT EXISTS 'other';

DO $$ BEGIN
  CREATE TYPE tenant_status AS ENUM ('active', 'ending', 'ended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE tenant_status ADD VALUE IF NOT EXISTS 'active';
ALTER TYPE tenant_status ADD VALUE IF NOT EXISTS 'ending';
ALTER TYPE tenant_status ADD VALUE IF NOT EXISTS 'ended';

DO $$ BEGIN
  CREATE TYPE tenant_type AS ENUM ('sole_proprietor', 'company');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE tenant_type ADD VALUE IF NOT EXISTS 'sole_proprietor';
ALTER TYPE tenant_type ADD VALUE IF NOT EXISTS 'company';

DO $$ BEGIN
  CREATE TYPE tenant_rating AS ENUM ('new', 'good', 'excellent', 'warning', 'bad');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE tenant_rating ADD VALUE IF NOT EXISTS 'new';
ALTER TYPE tenant_rating ADD VALUE IF NOT EXISTS 'good';
ALTER TYPE tenant_rating ADD VALUE IF NOT EXISTS 'excellent';
ALTER TYPE tenant_rating ADD VALUE IF NOT EXISTS 'warning';
ALTER TYPE tenant_rating ADD VALUE IF NOT EXISTS 'bad';

SELECT 'enum values ready' AS status;