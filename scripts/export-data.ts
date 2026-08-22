/**
 * Full property-management export: properties + units + tenants + active leases → unified CSV.
 *
 * Usage:
 *   npm run export:data
 *   npx tsx scripts/export-data.ts
 *
 * Env (.env.local):
 *   VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (required — bypasses RLS for full export)
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const OUTPUT_FILE = 'nexestate_full_export_final.csv';

type PropertyRow = {
  id: string;
  title: string;
  city: string | null;
  address: string | null;
  kind: string | null;
  status: string | null;
};

type UnitRow = {
  id: string;
  property_id: string;
  unit_number: string;
  unit_name: string | null;
  floor: number | null;
  area_sqm: number | null;
  monthly_rent: number | null;
  unit_status: string | null;
  status: string | null;
  unit_type: string | null;
  building: string | null;
  rooms: number | null;
  bathrooms: number | null;
  tenant_id: string | null;
  notes: string | null;
};

type TenantRow = {
  id: string;
  full_name: string;
  company_name: string | null;
  company_number: string | null;
  id_number: string | null;
  phone: string | null;
  mobile: string | null;
  email: string | null;
  contact_name: string | null;
  tenant_type: string | null;
  status: string | null;
  address: string | null;
  city: string | null;
  bank_name: string | null;
  bank_branch: string | null;
  bank_account: string | null;
  notes: string | null;
};

type LeaseRow = {
  id: string;
  property_id: string;
  unit_id: string | null;
  tenant_id: string | null;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  deposit: number | null;
  deposit_months: number | null;
  index_linked: boolean | null;
  index_base: number | null;
  special_terms: string | null;
  signed_date: string | null;
  is_active: boolean | null;
  lease_number: string | null;
  payment_day: number | null;
  payment_method: string | null;
  include_vat: boolean | null;
  vat_rate: number | null;
  security_deposit_type: string | null;
  security_deposit_amount: number | null;
  security_deposit_details: string | null;
  security_check_amount: number | null;
  security_check_details: string | null;
  notes: string | null;
  notice_period_days: number | null;
  payment_frequency: string | null;
  rent_increase_type: string | null;
  rent_increase_value: number | null;
  rent_increase_frequency: string | null;
};

const HEADERS = [
  // נכס
  'מזהה נכס',
  'שם נכס',
  'עיר נכס',
  'כתובת נכס',
  'סוג נכס',
  'סטטוס נכס',
  // יחידה
  'מזהה יחידה',
  'מספר יחידה',
  'שם יחידה',
  'קומה',
  'שטח (מ"ר)',
  'שכ"ד יחידה',
  'סטטוס יחידה',
  'סוג יחידה',
  'בניין',
  'חדרים',
  'חדרי רחצה',
  'הערות יחידה',
  // שוכר
  'מזהה שוכר',
  'שם מלא',
  'שם חברה',
  'ח.פ / ע.מ',
  'ת.ז.',
  'טלפון',
  'נייד',
  'אימייל',
  'איש קשר',
  'סוג שוכר',
  'סטטוס שוכר',
  'כתובת שוכר',
  'עיר שוכר',
  'בנק',
  'סניף',
  'חשבון בנק',
  'הערות שוכר',
  // חוזה פעיל
  'מזהה חוזה',
  'מספר חוזה',
  'תאריך התחלה',
  'תאריך סיום',
  'שכ"ד חוזה',
  'פיקדון',
  'חודשי פיקדון',
  'הצמדה למדד',
  'בסיס מדד',
  'תנאים מיוחדים',
  'תאריך חתימה',
  'חוזה פעיל',
  'יום תשלום',
  'אמצעי תשלום',
  'כולל מע"מ',
  'שיעור מע"מ',
  'סוג ערבות',
  'סכום ערבות',
  'פרטי ערבות',
  'סכום שיק ערבות',
  'פרטי שיק ערבות',
  'הודעה מוקדמת (ימים)',
  'תדירות תשלום',
  'סוג העלאת שכ"ד',
  'ערך העלאת שכ"ד',
  'תדירות העלאת שכ"ד',
  'הערות חוזה',
] as const;

function normalizeUrl(raw: string | undefined): string {
  return (raw ?? '').replace(/\/rest\/v1\/?$/i, '').replace(/\/$/, '');
}

function cell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'כן' : 'לא';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  if (Array.isArray(value)) return value.map(String).join('; ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value).replace(/\r?\n/g, ' ').trim();
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

async function fetchAll<T>(client: ReturnType<typeof createClient>, table: string): Promise<T[]> {
  const pageSize = 1000;
  let from = 0;
  const rows: T[] = [];

  while (true) {
    const { data, error } = await client.from(table).select('*').range(from, from + pageSize - 1);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('permission denied') || error.code === '42501') {
        throw new Error(
          `${table}: אין הרשאה (RLS). הוסף SUPABASE_SERVICE_ROLE_KEY ל-.env.local — ` +
            'Supabase Dashboard → Project Settings → API → service_role (secret)',
        );
      }
      throw new Error(`${table}: ${error.message}`);
    }
    if (!data?.length) break;
    rows.push(...(data as T[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

function pickActiveLease(leases: LeaseRow[]): LeaseRow | null {
  if (!leases.length) return null;

  const active = leases.filter((l) => l.is_active !== false);
  const pool = active.length ? active : leases;

  return [...pool].sort((a, b) => {
    const endDiff = new Date(b.end_date).getTime() - new Date(a.end_date).getTime();
    if (endDiff !== 0) return endDiff;
    return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
  })[0];
}

function buildRow(
  unit: UnitRow,
  property: PropertyRow | undefined,
  tenant: TenantRow | undefined,
  lease: LeaseRow | null,
): string[] {
  return [
    cell(property?.id),
    cell(property?.title),
    cell(property?.city),
    cell(property?.address),
    cell(property?.kind),
    cell(property?.status),
    cell(unit.id),
    cell(unit.unit_number),
    cell(unit.unit_name),
    cell(unit.floor),
    cell(unit.area_sqm),
    cell(unit.monthly_rent),
    cell(unit.unit_status ?? unit.status),
    cell(unit.unit_type),
    cell(unit.building),
    cell(unit.rooms),
    cell(unit.bathrooms),
    cell(unit.notes),
    cell(tenant?.id),
    cell(tenant?.full_name),
    cell(tenant?.company_name),
    cell(tenant?.company_number),
    cell(tenant?.id_number),
    cell(tenant?.phone),
    cell(tenant?.mobile),
    cell(tenant?.email),
    cell(tenant?.contact_name),
    cell(tenant?.tenant_type),
    cell(tenant?.status),
    cell(tenant?.address),
    cell(tenant?.city),
    cell(tenant?.bank_name),
    cell(tenant?.bank_branch),
    cell(tenant?.bank_account),
    cell(tenant?.notes),
    cell(lease?.id),
    cell(lease?.lease_number),
    cell(lease?.start_date),
    cell(lease?.end_date),
    cell(lease?.monthly_rent),
    cell(lease?.deposit),
    cell(lease?.deposit_months),
    cell(lease?.index_linked),
    cell(lease?.index_base),
    cell(lease?.special_terms),
    cell(lease?.signed_date),
    cell(lease?.is_active),
    cell(lease?.payment_day),
    cell(lease?.payment_method),
    cell(lease?.include_vat),
    cell(lease?.vat_rate),
    cell(lease?.security_deposit_type),
    cell(lease?.security_deposit_amount),
    cell(lease?.security_deposit_details),
    cell(lease?.security_check_amount),
    cell(lease?.security_check_details),
    cell(lease?.notice_period_days),
    cell(lease?.payment_frequency),
    cell(lease?.rent_increase_type),
    cell(lease?.rent_increase_value),
    cell(lease?.rent_increase_frequency),
    cell(lease?.notes),
  ];
}

async function main() {
  const supabaseUrl = normalizeUrl(process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL);
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error(
      'חסרות הגדרות לייצוא מלא.\n\n' +
        'צור/עדכן .env.local בשורש הפרויקט:\n\n' +
        '  VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co\n' +
        '  SUPABASE_SERVICE_ROLE_KEY=eyJ...   ← חובה לסקריפט ייצוא\n\n' +
        'איפה למצוא את המפתח:\n' +
        '  Supabase Dashboard → Project Settings → API → service_role (לחץ Reveal)\n\n' +
        '⚠️  אל תשתף את service_role ואל תשים אותו ב-Vercel/frontend — רק מקומי לסקריפט.',
    );
    process.exit(1);
  }

  const client = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log('שולף נתונים מ-Supabase...');

  const [properties, units, tenants, leases] = await Promise.all([
    fetchAll<PropertyRow>(client, 'properties'),
    fetchAll<UnitRow>(client, 'property_units'),
    fetchAll<TenantRow>(client, 'tenants'),
    fetchAll<LeaseRow>(client, 'leases'),
  ]);

  console.log(
    `נטענו: ${properties.length} נכסים, ${units.length} יחידות, ${tenants.length} שוכרים, ${leases.length} חוזים`,
  );

  const propertyMap = new Map(properties.map((p) => [p.id, p]));
  const tenantMap = new Map(tenants.map((t) => [t.id, t]));

  const leasesByUnit = new Map<string, LeaseRow[]>();
  for (const lease of leases) {
    if (!lease.unit_id) continue;
    const list = leasesByUnit.get(lease.unit_id) ?? [];
    list.push(lease);
    leasesByUnit.set(lease.unit_id, list);
  }

  const sortedUnits = [...units].sort((a, b) => {
    const propA = propertyMap.get(a.property_id)?.title ?? '';
    const propB = propertyMap.get(b.property_id)?.title ?? '';
    const propCmp = propA.localeCompare(propB, 'he');
    if (propCmp !== 0) return propCmp;
    return a.unit_number.localeCompare(b.unit_number, 'he', { numeric: true });
  });

  const rows = sortedUnits.map((unit) => {
    const property = propertyMap.get(unit.property_id);
    const lease = pickActiveLease(leasesByUnit.get(unit.id) ?? []);
    const tenantId = lease?.tenant_id ?? unit.tenant_id;
    const tenant = tenantId ? tenantMap.get(tenantId) : undefined;
    return buildRow(unit, property, tenant, lease);
  });

  const csvLines = [
    HEADERS.map(escapeCsv).join(','),
    ...rows.map((row) => row.map(escapeCsv).join(',')),
  ];
  const outputPath = resolve(process.cwd(), OUTPUT_FILE);
  writeFileSync(outputPath, '\uFEFF' + csvLines.join('\n'), 'utf8');

  const withLease = rows.filter((r) => r[35]).length;
  const withTenant = rows.filter((r) => r[18]).length;

  console.log(`\n✅ הקובץ נוצר: ${outputPath}`);
  console.log(`   שורות: ${rows.length} (יחידות)`);
  console.log(`   עם שוכר: ${withTenant} | עם חוזה: ${withLease}`);
}

main().catch((err) => {
  console.error('שגיאה בייצוא:', err instanceof Error ? err.message : err);
  process.exit(1);
});
