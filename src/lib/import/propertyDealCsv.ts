/** CSV import for admin "עסקאות" — client parse + shared validation rules */

export const DEAL_CSV_COLUMNS = [
  'title',
  'address',
  'city',
  'price',
  'kind',
  'status',
  'date',
] as const;

export type DealCsvColumn = (typeof DEAL_CSV_COLUMNS)[number];

export const DEAL_CSV_COLUMN_ALIASES: Record<string, DealCsvColumn> = {
  title: 'title',
  כותרת: 'title',
  שם: 'title',
  address: 'address',
  כתובת: 'address',
  city: 'city',
  עיר: 'city',
  price: 'price',
  מחיר: 'price',
  kind: 'kind',
  סוג: 'kind',
  status: 'status',
  סטטוס: 'status',
  date: 'date',
  תאריך: 'date',
};

const VALID_KINDS = new Set([
  'apartment',
  'house',
  'office',
  'commercial',
  'industrial',
  'land',
  'דירה',
  'בית',
  'משרד',
  'משרדים',
  'מסחרי',
  'תעשייה',
  'מגרש',
]);

const KIND_MAP: Record<string, string> = {
  דירה: 'apartment',
  בית: 'house',
  משרד: 'office',
  משרדים: 'office',
  מסחרי: 'commercial',
  תעשייה: 'industrial',
  מגרש: 'land',
};

const VALID_STATUS = new Set(['for_sale', 'for_rent', 'sold', 'rented', 'למכירה', 'להשכרה']);

const STATUS_MAP: Record<string, string> = {
  למכירה: 'for_sale',
  להשכרה: 'for_rent',
  נמכר: 'sold',
  הושכר: 'rented',
};

export interface ParsedDealRow {
  rowNumber: number;
  title: string;
  address: string;
  city: string;
  price: number;
  kind: string;
  status: string;
  dealDate?: string;
}

export interface RowValidationIssue {
  rowNumber: number;
  field?: string;
  message: string;
}

export interface DealImportPreview {
  valid: ParsedDealRow[];
  invalid: RowValidationIssue[];
  warnings: RowValidationIssue[];
}

export function parseCsvText(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  const text = content.replace(/^\uFEFF/, '');

  const pushField = () => {
    row.push(field.trim());
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

function normalizeHeader(h: string): DealCsvColumn | null {
  const key = h.trim().toLowerCase();
  return DEAL_CSV_COLUMN_ALIASES[key] ?? (DEAL_CSV_COLUMNS.includes(key as DealCsvColumn) ? (key as DealCsvColumn) : null);
}

export function validateDealRows(rawRows: Record<string, string>[]): DealImportPreview {
  const valid: ParsedDealRow[] = [];
  const invalid: RowValidationIssue[] = [];
  const warnings: RowValidationIssue[] = [];

  rawRows.forEach((raw, index) => {
    const rowNumber = index + 2;
    const title = (raw.title ?? '').trim();
    const address = (raw.address ?? '').trim();
    const city = (raw.city ?? '').trim();
    const priceRaw = (raw.price ?? '').replace(/[^\d.-]/g, '');
    const price = Number(priceRaw);
    let kind = (raw.kind ?? 'office').trim();
    let status = (raw.status ?? 'for_rent').trim();

    if (!title) {
      invalid.push({ rowNumber, field: 'title', message: 'חסרה כותרת' });
      return;
    }
    if (!city) {
      invalid.push({ rowNumber, field: 'city', message: 'חסרה עיר' });
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      invalid.push({ rowNumber, field: 'price', message: 'מחיר לא תקין' });
      return;
    }

    if (KIND_MAP[kind]) {
      kind = KIND_MAP[kind];
    } else if (!VALID_KINDS.has(kind)) {
      warnings.push({ rowNumber, field: 'kind', message: 'סוג לא מוכר — משתמש ב-office' });
      kind = 'office';
    }

    if (!VALID_STATUS.has(status)) {
      if (STATUS_MAP[status]) status = STATUS_MAP[status];
      else {
        invalid.push({ rowNumber, field: 'status', message: 'סטטוס לא נתמך' });
        return;
      }
    } else if (STATUS_MAP[status]) {
      status = STATUS_MAP[status];
    }

    valid.push({
      rowNumber,
      title,
      address,
      city,
      price,
      kind,
      status,
      dealDate: raw.date?.trim() || undefined,
    });
  });

  return { valid, invalid, warnings };
}

export function csvToDealRecords(table: string[][]): Record<string, string>[] {
  if (!table.length) return [];
  const headers = table[0].map((h) => normalizeHeader(h));
  if (headers.every((h) => h === null)) {
    return [];
  }

  return table.slice(1).map((cells) => {
    const row: Record<string, string> = {};
    headers.forEach((col, i) => {
      if (col) row[col] = cells[i] ?? '';
    });
    return row;
  });
}

export function detectDuplicateTitles(rows: ParsedDealRow[]): RowValidationIssue[] {
  const seen = new Map<string, number>();
  const dupes: RowValidationIssue[] = [];
  for (const row of rows) {
    const key = `${row.title}|${row.city}`.toLowerCase();
    const first = seen.get(key);
    if (first !== undefined) {
      dupes.push({
        rowNumber: row.rowNumber,
        message: `כפילות עם שורה ${first}`,
      });
    } else {
      seen.set(key, row.rowNumber);
    }
  }
  return dupes;
}
