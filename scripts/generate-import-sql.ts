/**
 * Generate SQL to import data/import/*.csv into Supabase (run in SQL Editor).
 *
 * Usage: npx tsx scripts/generate-import-sql.ts
 * Output: data/import/run-in-supabase.sql
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const IMPORT_DIR = resolve(process.cwd(), 'data/import');
const TARGET_EMAIL = 'nexuservice@gmail.com';
const ENUMS_OUTPUT = resolve(IMPORT_DIR, '01-fix-enums.sql');
const IMPORT_OUTPUT = resolve(IMPORT_DIR, '02-import-data.sql');

type CsvRow = Record<string, string>;

function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  const text = content.replace(/^\uFEFF/, '');

  const pushField = () => {
    row.push(field);
    field = '';
  };
  const pushRow = () => {
    if (row.length > 1 || row[0] !== '' || field !== '') {
      pushField();
      rows.push(row);
    }
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') inQuotes = false;
      else field += ch;
      continue;
    }
    if (ch === '"') inQuotes = true;
    else if (ch === ',') pushField();
    else if (ch === '\n') pushRow();
    else if (ch !== '\r') field += ch;
  }
  if (field || row.length) pushRow();
  return rows;
}

function readCsvFile(path: string): CsvRow[] {
  const table = parseCsv(readFileSync(path, 'utf8'));
  if (!table.length) return [];
  const headers = table[0];
  return table.slice(1).map((cells) => {
    const row: CsvRow = {};
    headers.forEach((h, i) => {
      row[h] = cells[i] ?? '';
    });
    return row;
  });
}

function findImportFile(baseName: string): string {
  const exact = resolve(IMPORT_DIR, `${baseName}.csv`);
  if (existsSync(exact)) return exact;
  const match = readdirSync(IMPORT_DIR).find(
    (f) => f.toLowerCase().startsWith(baseName.toLowerCase()) && f.endsWith('.csv'),
  );
  if (!match) throw new Error(`Missing ${baseName}.csv`);
  return resolve(IMPORT_DIR, match);
}

function sqlStr(value: string | undefined): string {
  if (!value?.trim()) return 'NULL';
  return `'${value.replace(/'/g, "''")}'`;
}

function sqlNum(value: string | undefined): string {
  const v = value?.trim();
  if (!v) return 'NULL';
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : 'NULL';
}

function sqlInt(value: string | undefined, fallback?: number): string {
  const v = value?.trim();
  if (!v) return fallback !== undefined ? String(fallback) : 'NULL';
  const n = Number(v);
  return Number.isFinite(n) ? String(Math.trunc(n)) : fallback !== undefined ? String(fallback) : 'NULL';
}

function sqlBool(value: string | undefined, fallback = false): string {
  const v = value?.trim().toLowerCase();
  if (!v) return fallback ? 'true' : 'false';
  return v === 'true' || v === '1' ? 'true' : 'false';
}

function buildEnumsSql(): string {
  const enums: Record<string, string[]> = {
    property_status: ['for_sale', 'for_rent', 'sold', 'rented'],
    property_kind: ['apartment', 'house', 'office', 'commercial', 'industrial', 'land'],
    property_visibility: ['private', 'public', 'off_market', 'auction'],
    unit_status: ['available', 'occupied', 'maintenance', 'reserved'],
    unit_type: ['office', 'industrial', 'storage', 'residential', 'commercial', 'other'],
    tenant_status: ['active', 'ending', 'ended'],
    tenant_type: ['sole_proprietor', 'company'],
    tenant_rating: ['new', 'good', 'excellent', 'warning', 'bad'],
  };

  const lines = [
    '-- שלב 1: הרץ קודם את הקובץ הזה בלבד, ואז 02-import-data.sql',
    '-- Postgres דורש commit לפני שימוש בערכי enum חדשים',
    '',
  ];

  for (const [typeName, values] of Object.entries(enums)) {
    lines.push(`DO $$ BEGIN`);
    lines.push(`  CREATE TYPE ${typeName} AS ENUM (${values.map((v) => `'${v}'`).join(', ')});`);
    lines.push(`EXCEPTION WHEN duplicate_object THEN NULL;`);
    lines.push(`END $$;`);
    lines.push('');
    for (const value of values) {
      lines.push(`ALTER TYPE ${typeName} ADD VALUE IF NOT EXISTS '${value}';`);
    }
    lines.push('');
  }

  lines.push(`SELECT 'enum values ready' AS status;`);
  return lines.join('\n');
}

function main() {
  const properties = readCsvFile(findImportFile('properties'));
  const units = readCsvFile(findImportFile('property_units'));
  const tenants = readCsvFile(findImportFile('tenants'));
  const leases = readCsvFile(findImportFile('leases'));

  const lines: string[] = [
    '-- NexEstate CSV import — שלב 2 (אחרי 01-fix-enums.sql)',
    `-- יעד: ${TARGET_EMAIL}`,
    '',
    'DO $$',
    'DECLARE',
    '  v_user_id uuid;',
    'BEGIN',
    `  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = lower(${sqlStr(TARGET_EMAIL)});`,
    '  IF v_user_id IS NULL THEN',
    `    RAISE EXCEPTION 'משתמש לא נמצא: ${TARGET_EMAIL}. התחבר/הירשם פעם אחת ואז הרץ שוב.';`,
    '  END IF;',
    '',
    '  INSERT INTO public.profiles (id, email, full_name, role)',
    '  VALUES (v_user_id, lower(' + sqlStr(TARGET_EMAIL) + '), COALESCE(',
    '    (SELECT raw_user_meta_data->>\'full_name\' FROM auth.users WHERE id = v_user_id),',
    "    split_part(" + sqlStr(TARGET_EMAIL) + ", '@', 1), 'משתמש'), 'broker')",
    '  ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, email = EXCLUDED.email;',
    '',
  ];

  for (const p of properties) {
    lines.push(
      `  INSERT INTO public.properties (id, title, address, city, kind, status, visibility, price, rooms, bathrooms, area_sqm, floor, total_floors, parking_spots, year_built, lat, lng, description, featured, broker_id, owner_id, created_by, images, documents, features)`,
      `  VALUES (${sqlStr(p.id)}::uuid, ${sqlStr(p.title || 'נכס')}, ${sqlStr(p.address) || "''"}, ${sqlStr(p.city) || "''"}, ${sqlStr(p.kind) || "'commercial'"}, ${sqlStr(p.status) || "'for_rent'"}, ${sqlStr(p.visibility) || "'private'"}, ${sqlNum(p.price) || '0'}, ${sqlInt(p.rooms)}, ${sqlInt(p.bathrooms)}, ${sqlNum(p.area_sqm)}, ${sqlInt(p.floor)}, ${sqlInt(p.total_floors)}, ${sqlInt(p.parking_spots, 0)}, ${sqlInt(p.year_built)}, ${sqlNum(p.lat)}, ${sqlNum(p.lng)}, ${sqlStr(p.description)}, ${sqlBool(p.featured)}, v_user_id, v_user_id, v_user_id, '{}', '{}', '{}')`,
      `  ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, address = EXCLUDED.address, city = EXCLUDED.city, broker_id = v_user_id, owner_id = v_user_id, created_by = v_user_id, area_sqm = EXCLUDED.area_sqm, description = EXCLUDED.description;`,
      '',
    );
  }

  for (const t of tenants) {
    const fullName = t.full_name?.trim() || t.company_name?.trim() || 'שוכר';
    const lastName = t.contact_name?.trim() ? sqlStr(t.contact_name) : "''";
    lines.push(
      `  INSERT INTO public.tenants (id, manager_id, broker_id, full_name, first_name, last_name, tenant_type, id_number, company_name, company_number, contact_name, phone, mobile, email, address, city, bank_name, bank_branch, bank_account, status, rating, tags, notes)`,
      `  VALUES (${sqlStr(t.id)}::uuid, v_user_id, v_user_id, ${sqlStr(fullName)}, ${sqlStr(fullName)}, ${lastName}, ${sqlStr(t.tenant_type) || "'sole_proprietor'"}, ${sqlStr(t.id_number)}, ${sqlStr(t.company_name)}, ${sqlStr(t.company_number)}, ${sqlStr(t.contact_name)}, ${sqlStr(t.phone)}, ${sqlStr(t.mobile)}, ${sqlStr(t.email)}, ${sqlStr(t.address)}, ${sqlStr(t.city)}, ${sqlStr(t.bank_name)}, ${sqlStr(t.bank_branch)}, ${sqlStr(t.bank_account)}, ${sqlStr(t.status) || "'active'"}, ${sqlStr(t.rating) || "'new'"}, ${sqlStr(t.tags)}, ${sqlStr(t.notes)})`,
      `  ON CONFLICT (id) DO UPDATE SET manager_id = v_user_id, broker_id = v_user_id, full_name = EXCLUDED.full_name, first_name = EXCLUDED.first_name, phone = EXCLUDED.phone, mobile = EXCLUDED.mobile, email = EXCLUDED.email, company_name = EXCLUDED.company_name, notes = EXCLUDED.notes;`,
      '',
    );
  }

  const tenantIds = new Set(tenants.map((t) => t.id));

  const UNIT_STATUSES = new Set(['available', 'occupied', 'maintenance', 'reserved']);

  for (const u of units) {
    const tenantId =
      u.tenant_id && tenantIds.has(u.tenant_id) ? `${sqlStr(u.tenant_id)}::uuid` : 'NULL';
    const occupancy = UNIT_STATUSES.has(u.unit_status?.trim() ?? '')
      ? sqlStr(u.unit_status)
      : "'available'";
    // Do not insert CSV status (for_sale) — live property_units.status is unit_status.
    lines.push(
      `  INSERT INTO public.property_units (id, property_id, broker_id, unit_number, unit_name, unit_type, unit_status, building, floor, area_sqm, rooms, bathrooms, monthly_rent, price, management_fee, amenities, description, notes, tenant_id)`,
      `  VALUES (${sqlStr(u.id)}::uuid, ${sqlStr(u.property_id)}::uuid, v_user_id, ${sqlStr(u.unit_number || '0')}, ${sqlStr(u.unit_name)}, ${sqlStr(u.unit_type) || "'office'"}, ${occupancy}, ${sqlStr(u.building)}, ${sqlInt(u.floor)}, ${sqlNum(u.area_sqm)}, ${sqlInt(u.rooms)}, ${sqlInt(u.bathrooms, 1)}, ${sqlNum(u.monthly_rent)}, ${sqlNum(u.price)}, ${sqlNum(u.management_fee)}, '[]'::jsonb, ${sqlStr(u.description)}, ${sqlStr(u.notes)}, ${tenantId})`,
      `  ON CONFLICT (id) DO UPDATE SET broker_id = v_user_id, unit_name = EXCLUDED.unit_name, unit_status = EXCLUDED.unit_status, monthly_rent = EXCLUDED.monthly_rent, area_sqm = EXCLUDED.area_sqm, tenant_id = EXCLUDED.tenant_id, notes = EXCLUDED.notes;`,
      '',
    );
  }

  const unitIds = new Set(units.map((u) => u.id));

  for (const l of leases) {
    const unitId = l.unit_id && unitIds.has(l.unit_id) ? `${sqlStr(l.unit_id)}::uuid` : 'NULL';
    const tenantId =
      l.tenant_id && tenantIds.has(l.tenant_id) ? `${sqlStr(l.tenant_id)}::uuid` : 'NULL';
    lines.push(
      `  INSERT INTO public.leases (id, property_id, unit_id, tenant_id, manager_id, start_date, end_date, signed_date, terminated_date, termination_reason, monthly_rent, deposit, deposit_months, include_vat, vat_rate, payment_day, payment_frequency, payment_method, check_amount, total_checks, checks_remaining, next_check_date, index_linked, index_base, rent_increase_type, rent_increase_value, rent_increase_frequency, prepayment_discount_type, prepayment_discount_value, security_deposit_type, security_deposit_amount, security_deposit_details, security_check_amount, security_check_details, lease_number, unit_marking, equipment_included, special_terms, notice_period_days, agreement_document_url, notes, is_active, documents)`,
      `  VALUES (${sqlStr(l.id)}::uuid, ${sqlStr(l.property_id)}::uuid, ${unitId}, ${tenantId}, v_user_id, ${sqlStr(l.start_date)}::date, ${sqlStr(l.end_date)}::date, ${l.signed_date?.trim() ? `${sqlStr(l.signed_date)}::date` : 'NULL'}, ${l.terminated_date?.trim() ? `${sqlStr(l.terminated_date)}::date` : 'NULL'}, ${sqlStr(l.termination_reason)}, ${sqlNum(l.monthly_rent) || '0'}, ${sqlNum(l.deposit)}, ${sqlInt(l.deposit_months, 0)}, ${sqlBool(l.include_vat, true)}, ${sqlNum(l.vat_rate) || '18'}, ${sqlInt(l.payment_day, 1)}, ${sqlStr(l.payment_frequency) || "'monthly'"}, ${sqlStr(l.payment_method)}, ${sqlNum(l.check_amount)}, ${sqlInt(l.total_checks, 0)}, ${sqlInt(l.checks_remaining, 0)}, ${l.next_check_date?.trim() ? `${sqlStr(l.next_check_date)}::date` : 'NULL'}, ${sqlBool(l.index_linked)}, ${sqlNum(l.index_base)}, ${sqlStr(l.rent_increase_type) || "'none'"}, ${sqlNum(l.rent_increase_value)}, ${sqlStr(l.rent_increase_frequency) || "'yearly'"}, ${sqlStr(l.prepayment_discount_type)}, ${sqlNum(l.prepayment_discount_value)}, ${sqlStr(l.security_deposit_type)}, ${sqlNum(l.security_deposit_amount) || '0'}, ${sqlStr(l.security_deposit_details)}, ${sqlNum(l.security_check_amount) || '0'}, ${sqlStr(l.security_check_details)}, ${sqlStr(l.lease_number)}, ${sqlStr(l.unit_marking)}, ${sqlStr(l.equipment_included)}, ${sqlStr(l.special_terms)}, ${sqlInt(l.notice_period_days, 60)}, ${sqlStr(l.agreement_document_url)}, ${sqlStr(l.notes)}, ${sqlBool(l.is_active, true)}, '{}')`,
      `  ON CONFLICT (id) DO UPDATE SET manager_id = v_user_id, monthly_rent = EXCLUDED.monthly_rent, deposit = EXCLUDED.deposit, start_date = EXCLUDED.start_date, end_date = EXCLUDED.end_date, is_active = EXCLUDED.is_active, notes = EXCLUDED.notes;`,
      '',
    );
  }

  lines.push(
    `  RAISE NOTICE 'ייבוא הושלם: % נכסים, % יחידות, % שוכרים, % חוזים', ${properties.length}, ${units.length}, ${tenants.length}, ${leases.length};`,
    'END $$;',
  );

  writeFileSync(ENUMS_OUTPUT, buildEnumsSql(), 'utf8');
  writeFileSync(IMPORT_OUTPUT, lines.join('\n'), 'utf8');
  console.log(`✅ נוצר: ${ENUMS_OUTPUT}`);
  console.log(`✅ נוצר: ${IMPORT_OUTPUT}`);
  console.log('\nהרצה ב-Supabase SQL Editor:');
  console.log('  1) הרץ 01-fix-enums.sql  → Run');
  console.log('  2) הרץ 02-import-data.sql → Run');
}

main();
