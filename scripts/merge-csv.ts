/**
 * Merge local Supabase CSV exports into one unified file (no network).
 *
 * Place source files in data/import/:
 *   properties.csv | properties_*.csv
 *   property_units.csv | property_units_*.csv
 *   tenants.csv | tenants_*.csv
 *   leases.csv | leases_*.csv
 *
 * Usage:
 *   npm run merge:csv
 *   npx tsx scripts/merge-csv.ts
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const IMPORT_DIR = resolve(process.cwd(), 'data/import');
const OUTPUT_FILE = 'nexestate_full_export_final.csv';

type CsvRow = Record<string, string>;

const HEADERS = [
  'מזהה נכס',
  'שם נכס',
  'עיר נכס',
  'כתובת נכס',
  'סוג נכס',
  'סטטוס נכס',
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

function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

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

  const text = content.replace(/^\uFEFF/, '');

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

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      pushField();
    } else if (ch === '\n') {
      pushRow();
    } else if (ch === '\r') {
      // skip
    } else {
      field += ch;
    }
  }

  if (field || row.length) pushRow();
  return rows;
}

function readCsvFile(path: string): CsvRow[] {
  const raw = readFileSync(path, 'utf8');
  const table = parseCsv(raw);
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
  if (!existsSync(IMPORT_DIR)) {
    throw new Error(`תיקייה לא קיימת: ${IMPORT_DIR}`);
  }

  const exact = resolve(IMPORT_DIR, `${baseName}.csv`);
  if (existsSync(exact)) return exact;

  const files = readdirSync(IMPORT_DIR);
  const match = files.find((f) => f.toLowerCase().startsWith(baseName.toLowerCase()) && f.endsWith('.csv'));
  if (match) return resolve(IMPORT_DIR, match);

  throw new Error(`לא נמצא קובץ ${baseName}.csv ב-${IMPORT_DIR}`);
}

function cell(value: string | undefined): string {
  if (!value) return '';
  const lower = value.toLowerCase();
  if (lower === 'true') return 'כן';
  if (lower === 'false') return 'לא';
  return value.replace(/\r?\n/g, ' ').trim();
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function pickActiveLease(leases: CsvRow[]): CsvRow | null {
  if (!leases.length) return null;
  const active = leases.filter((l) => l.is_active !== 'false');
  const pool = active.length ? active : leases;
  return [...pool].sort((a, b) => {
    const endDiff = new Date(b.end_date).getTime() - new Date(a.end_date).getTime();
    if (endDiff !== 0) return endDiff;
    return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
  })[0];
}

function buildRow(
  unit: CsvRow,
  property: CsvRow | undefined,
  tenant: CsvRow | undefined,
  lease: CsvRow | null,
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
    cell(unit.unit_status || unit.status),
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

function main() {
  const propertiesPath = findImportFile('properties');
  const unitsPath = findImportFile('property_units');
  const tenantsPath = findImportFile('tenants');
  const leasesPath = findImportFile('leases');

  console.log('קורא קבצי CSV...');
  console.log(`  ${propertiesPath}`);
  console.log(`  ${unitsPath}`);
  console.log(`  ${tenantsPath}`);
  console.log(`  ${leasesPath}`);

  const properties = readCsvFile(propertiesPath);
  const units = readCsvFile(unitsPath);
  const tenants = readCsvFile(tenantsPath);
  const leases = readCsvFile(leasesPath);

  console.log(
    `\nנטענו: ${properties.length} נכסים, ${units.length} יחידות, ${tenants.length} שוכרים, ${leases.length} חוזים`,
  );

  const propertyMap = new Map(properties.map((p) => [p.id, p]));
  const tenantMap = new Map(tenants.map((t) => [t.id, t]));

  const leasesByUnit = new Map<string, CsvRow[]>();
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
    const tenantId = lease?.tenant_id || unit.tenant_id;
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

main();
