/**
 * Import CSV exports from data/import/ into Supabase under a target user profile.
 *
 * Usage:
 *   npm run import:csv
 *   npx tsx scripts/import-csv.ts
 *
 * Env (.env.local):
 *   VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional:
 *   IMPORT_TARGET_EMAIL=nexuservice@gmail.com
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const IMPORT_DIR = resolve(process.cwd(), 'data/import');
const TARGET_EMAIL = (process.env.IMPORT_TARGET_EMAIL ?? 'nexuservice@gmail.com').toLowerCase();

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
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
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
    headers.forEach((header, i) => {
      row[header] = cells[i] ?? '';
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
  if (match) return resolve(IMPORT_DIR, match);
  throw new Error(`לא נמצא ${baseName}.csv ב-${IMPORT_DIR}`);
}

function opt(value: string | undefined): string | null {
  const v = value?.trim();
  return v ? v : null;
}

function num(value: string | undefined): number | null {
  const v = value?.trim();
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function int(value: string | undefined): number | null {
  const n = num(value);
  return n === null ? null : Math.trunc(n);
}

function bool(value: string | undefined, fallback = false): boolean {
  const v = value?.trim().toLowerCase();
  if (!v) return fallback;
  return v === 'true' || v === '1' || v === 'כן' || v === 'yes';
}

function normalizeUrl(raw: string | undefined): string {
  return (raw ?? '').replace(/\/rest\/v1\/?$/i, '').replace(/\/$/, '');
}

function validateServiceKey(key: string): void {
  if (key.startsWith('sb_publishable_')) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY מכיל מפתח publishable (anon). ' +
        'העתק מ-Supabase Dashboard → Settings → API → Secret key (sb_secret_...)',
    );
  }
  if (!key.startsWith('sb_secret_') && !key.startsWith('eyJ')) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY לא תקין. צריך sb_secret_... או JWT service_role.');
  }
}

async function resolveTargetUserId(
  client: ReturnType<typeof createClient>,
): Promise<{ id: string; email: string; role: string }> {
  const { data: profile, error } = await client
    .from('profiles')
    .select('id, email, role')
    .ilike('email', TARGET_EMAIL)
    .maybeSingle();

  if (error) throw new Error(`profiles: ${error.message}`);
  if (profile) {
    return { id: profile.id, email: profile.email, role: profile.role };
  }

  const { data: authData, error: authError } = await client.auth.admin.listUsers({ perPage: 1000 });
  if (authError) throw new Error(`auth.admin: ${authError.message}`);

  const authUser = authData.users.find((u) => u.email?.toLowerCase() === TARGET_EMAIL);
  if (!authUser) {
    throw new Error(`לא נמצא משתמש עם אימייל ${TARGET_EMAIL}. הרשם/התחבר פעם אחת ואז הרץ שוב.`);
  }

  const fullName =
    (authUser.user_metadata?.full_name as string | undefined) ??
    (authUser.user_metadata?.name as string | undefined) ??
    TARGET_EMAIL.split('@')[0];

  const role = (authUser.user_metadata?.intended_role as string | undefined) ?? 'broker';

  const { error: insertError } = await client.from('profiles').upsert(
    {
      id: authUser.id,
      email: TARGET_EMAIL,
      full_name: fullName,
      role,
    },
    { onConflict: 'id' },
  );
  if (insertError) throw new Error(`יצירת פרופיל: ${insertError.message}`);

  return { id: authUser.id, email: TARGET_EMAIL, role };
}

async function upsertBatch(
  client: ReturnType<typeof createClient>,
  table: string,
  rows: Record<string, unknown>[],
) {
  if (!rows.length) return;
  const chunkSize = 100;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await client.from(table).upsert(chunk, { onConflict: 'id' });
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

async function main() {
  const supabaseUrl = normalizeUrl(process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL);
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('חסר VITE_SUPABASE_URL או SUPABASE_SERVICE_ROLE_KEY ב-.env.local');
    console.error('חלופה: npx tsx scripts/generate-import-sql.ts והרץ ב-SQL Editor');
    process.exit(1);
  }

  validateServiceKey(serviceKey);

  const client = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`מחפש משתמש: ${TARGET_EMAIL}...`);
  const target = await resolveTargetUserId(client);
  console.log(`משתמש נמצא: ${target.email} (${target.id})`);

  if (!['broker', 'owner', 'manager', 'admin', 'superadmin', 'partner'].includes(target.role)) {
    const { error } = await client.from('profiles').update({ role: 'broker' }).eq('id', target.id);
    if (error) throw new Error(`עדכון תפקיד: ${error.message}`);
    console.log('תפקיד עודכן ל-broker');
  }

  const propertiesPath = findImportFile('properties');
  const unitsPath = findImportFile('property_units');
  const tenantsPath = findImportFile('tenants');
  const leasesPath = findImportFile('leases');

  const properties = readCsvFile(propertiesPath);
  const units = readCsvFile(unitsPath);
  const tenants = readCsvFile(tenantsPath);
  const leases = readCsvFile(leasesPath);

  console.log(
    `\nמייבא: ${properties.length} נכסים, ${units.length} יחידות, ${tenants.length} שוכרים, ${leases.length} חוזים`,
  );

  const propertyRows = properties.map((p) => ({
    id: p.id,
    title: p.title?.trim() || 'נכס ללא שם',
    address: opt(p.address) ?? '',
    city: opt(p.city) ?? '',
    kind: opt(p.kind) ?? 'commercial',
    status: opt(p.status) ?? 'for_rent',
    visibility: opt(p.visibility) ?? 'private',
    price: num(p.price) ?? 0,
    rooms: int(p.rooms),
    bathrooms: int(p.bathrooms),
    area_sqm: num(p.area_sqm),
    floor: int(p.floor),
    total_floors: int(p.total_floors),
    parking_spots: int(p.parking_spots) ?? 0,
    year_built: int(p.year_built),
    lat: num(p.lat),
    lng: num(p.lng),
    description: opt(p.description),
    featured: bool(p.featured),
    broker_id: target.id,
    owner_id: opt(p.owner_id) ?? target.id,
    created_by: target.id,
    images: [],
    documents: [],
    features: {},
  }));

  const tenantRows = tenants.map((t) => {
    const fullName = t.full_name?.trim() || t.company_name?.trim() || 'שוכר ללא שם';
    return {
    id: t.id,
    manager_id: target.id,
    broker_id: target.id,
    full_name: fullName,
    first_name: fullName,
    last_name: t.contact_name?.trim() || '',
    tenant_type: opt(t.tenant_type) ?? 'sole_proprietor',
    id_number: opt(t.id_number),
    company_name: opt(t.company_name),
    company_number: opt(t.company_number),
    contact_name: opt(t.contact_name),
    phone: opt(t.phone),
    mobile: opt(t.mobile),
    email: opt(t.email),
    address: opt(t.address),
    city: opt(t.city),
    bank_name: opt(t.bank_name),
    bank_branch: opt(t.bank_branch),
    bank_account: opt(t.bank_account),
    status: opt(t.status) ?? 'active',
    rating: opt(t.rating) ?? 'new',
    tags: opt(t.tags),
    notes: opt(t.notes),
    };
  });

  const tenantIds = new Set(tenantRows.map((t) => t.id));

  const unitRows = units.map((u) => ({
    id: u.id,
    property_id: u.property_id,
    broker_id: target.id,
    unit_number: u.unit_number?.trim() || '0',
    unit_name: opt(u.unit_name),
    unit_type: opt(u.unit_type) ?? 'office',
    unit_status: opt(u.unit_status) ?? 'available',
    building: opt(u.building),
    floor: int(u.floor),
    area_sqm: num(u.area_sqm),
    rooms: int(u.rooms),
    bathrooms: int(u.bathrooms) ?? 1,
    monthly_rent: num(u.monthly_rent),
    price: num(u.price),
    management_fee: num(u.management_fee),
    amenities: [],
    description: opt(u.description),
    notes: opt(u.notes),
    tenant_id: u.tenant_id && tenantIds.has(u.tenant_id) ? u.tenant_id : null,
  }));

  const unitIds = new Set(unitRows.map((u) => u.id));
  const propertyIds = new Set(propertyRows.map((p) => p.id));

  const leaseRows = leases
    .filter((l) => propertyIds.has(l.property_id))
    .map((l) => ({
      id: l.id,
      property_id: l.property_id,
      unit_id: l.unit_id && unitIds.has(l.unit_id) ? l.unit_id : null,
      tenant_id: l.tenant_id && tenantIds.has(l.tenant_id) ? l.tenant_id : null,
      manager_id: target.id,
      start_date: l.start_date,
      end_date: l.end_date,
      signed_date: opt(l.signed_date),
      terminated_date: opt(l.terminated_date),
      termination_reason: opt(l.termination_reason),
      monthly_rent: num(l.monthly_rent) ?? 0,
      deposit: num(l.deposit),
      deposit_months: int(l.deposit_months) ?? 0,
      include_vat: bool(l.include_vat, true),
      vat_rate: num(l.vat_rate) ?? 18,
      payment_day: int(l.payment_day) ?? 1,
      payment_frequency: opt(l.payment_frequency) ?? 'monthly',
      payment_method: opt(l.payment_method),
      check_amount: num(l.check_amount),
      total_checks: int(l.total_checks) ?? 0,
      checks_remaining: int(l.checks_remaining) ?? 0,
      next_check_date: opt(l.next_check_date),
      index_linked: bool(l.index_linked),
      index_base: num(l.index_base),
      rent_increase_type: opt(l.rent_increase_type) ?? 'none',
      rent_increase_value: num(l.rent_increase_value),
      rent_increase_frequency: opt(l.rent_increase_frequency) ?? 'yearly',
      prepayment_discount_type: opt(l.prepayment_discount_type),
      prepayment_discount_value: num(l.prepayment_discount_value),
      security_deposit_type: opt(l.security_deposit_type),
      security_deposit_amount: num(l.security_deposit_amount) ?? 0,
      security_deposit_details: opt(l.security_deposit_details),
      security_check_amount: num(l.security_check_amount) ?? 0,
      security_check_details: opt(l.security_check_details),
      lease_number: opt(l.lease_number),
      unit_marking: opt(l.unit_marking),
      equipment_included: opt(l.equipment_included),
      special_terms: opt(l.special_terms),
      notice_period_days: int(l.notice_period_days) ?? 60,
      agreement_document_url: opt(l.agreement_document_url),
      notes: opt(l.notes),
      is_active: bool(l.is_active, true),
      documents: [],
    }));

  console.log('שומר נכסים...');
  await upsertBatch(client, 'properties', propertyRows);

  console.log('שומר שוכרים...');
  await upsertBatch(client, 'tenants', tenantRows);

  console.log('שומר יחידות...');
  await upsertBatch(client, 'property_units', unitRows);

  console.log('שומר חוזים...');
  await upsertBatch(client, 'leases', leaseRows);

  console.log('\n✅ הייבוא הושלם בהצלחה!');
  console.log(`   פרופיל: ${target.email}`);
  console.log(`   נכסים: ${propertyRows.length} | יחידות: ${unitRows.length} | שוכרים: ${tenantRows.length} | חוזים: ${leaseRows.length}`);
  console.log(`   לוח בקרה: /broker`);
}

main().catch((err) => {
  console.error('\nשגיאה בייבוא:', err instanceof Error ? err.message : err);
  console.error('\nחלופה: הרץ npx tsx scripts/generate-import-sql.ts');
  console.error('והדבק את data/import/run-in-supabase.sql ב-Supabase SQL Editor');
  process.exit(1);
});
