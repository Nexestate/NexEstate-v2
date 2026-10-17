import type { Lease, PaymentMethod, Tenant } from '../types/domain';
import { PAYMENT_METHOD_LABELS } from '../types/domain';

export type LeaseEditSnapshot = {
  leaseId: string;
  unitId: string;
  startDate: string;
  endDate: string;
  monthlyRent: string;
  deposit: string;
  paymentMethod: PaymentMethod;
};

function stamp(): string {
  return new Date().toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' });
}

function unitLabel(unitId: string, units: { id: string; unit_number: string; unit_name?: string }[]): string {
  const u = units.find((x) => x.id === unitId);
  if (!u) return unitId.slice(0, 8);
  return u.unit_name ? `יח׳ ${u.unit_number} (${u.unit_name})` : `יח׳ ${u.unit_number}`;
}

export function buildTenantChangeLogLines(input: {
  before: Tenant;
  after: Pick<Tenant, 'full_name' | 'tenant_type' | 'status' | 'phone' | 'email' | 'id_number' | 'company_name' | 'company_number' | 'contact_name'>;
  leasesBefore: Lease[];
  leaseRowsAfter: LeaseEditSnapshot[];
  units: { id: string; unit_number: string; unit_name?: string }[];
}): string[] {
  const lines: string[] = [];
  const { before, after, leasesBefore, leaseRowsAfter, units } = input;

  if (before.full_name !== after.full_name.trim()) {
    lines.push(`שם: ${before.full_name} → ${after.full_name.trim()}`);
  }
  if (before.status !== after.status) {
    lines.push(`סטטוס: ${before.status} → ${after.status}`);
  }
  if ((before.phone ?? '') !== (after.phone?.trim() ?? '')) {
    lines.push('עדכון טלפון');
  }
  if ((before.email ?? '') !== (after.email?.trim() ?? '')) {
    lines.push('עדכון אימייל');
  }
  if ((before.id_number ?? '') !== (after.id_number?.trim() ?? '')) {
    lines.push('עדכון מזהה (ת.ז / ח.פ)');
  }
  if ((before.company_name ?? '') !== (after.company_name?.trim() ?? '')) {
    lines.push('עדכון שם חברה');
  }
  if ((before.company_number ?? '') !== (after.company_number?.trim() ?? '')) {
    lines.push('עדכון מספר ח.פ');
  }
  if ((before.contact_name ?? '') !== (after.contact_name?.trim() ?? '')) {
    lines.push('עדכון איש קשר');
  }
  if (before.tenant_type !== after.tenant_type) {
    lines.push(`סוג שוכר: ${before.tenant_type ?? '—'} → ${after.tenant_type}`);
  }

  for (const row of leaseRowsAfter) {
    const lease = leasesBefore.find((l) => l.id === row.leaseId);
    if (!lease) continue;
    if (lease.unit_id !== row.unitId) {
      lines.push(
        `החלפת יחידה בחוזה: ${unitLabel(lease.unit_id ?? '', units)} → ${unitLabel(row.unitId, units)}`,
      );
    }
    if (lease.start_date.slice(0, 10) !== row.startDate) {
      lines.push(`תאריך התחלת חוזה: ${lease.start_date.slice(0, 10)} → ${row.startDate}`);
    }
    if (lease.end_date.slice(0, 10) !== row.endDate) {
      lines.push(`תאריך סיום חוזה: ${lease.end_date.slice(0, 10)} → ${row.endDate} (חידוש/שינוי תקופה)`);
    }
    if (lease.monthly_rent !== Number(row.monthlyRent)) {
      lines.push(`שכ"ד חודשי: ${lease.monthly_rent} → ${row.monthlyRent} ₪`);
    }
    const depBefore = lease.deposit ?? null;
    const depAfter = row.deposit ? Number(row.deposit) : null;
    if (depBefore !== depAfter) {
      lines.push(`פיקדון: ${depBefore ?? '—'} → ${depAfter ?? '—'} ₪`);
    }
    if ((lease.payment_method ?? 'transfer') !== row.paymentMethod) {
      lines.push(
        `אמצעי תשלום: ${PAYMENT_METHOD_LABELS[lease.payment_method ?? 'transfer']} → ${PAYMENT_METHOD_LABELS[row.paymentMethod]}`,
      );
    }
  }

  return lines;
}

export function prependChangeLog(existingNotes: string | undefined, changeLines: string[], manualNote?: string): string {
  const blocks: string[] = [];
  const trimmedManual = manualNote?.trim();
  if (trimmedManual) blocks.push(trimmedManual);
  if (changeLines.length > 0) {
    blocks.push(changeLines.map((l) => `[${stamp()}] ${l}`).join('\n'));
  }
  if (blocks.length === 0) return existingNotes?.trim() ?? '';
  const header = blocks.join('\n\n');
  const prev = existingNotes?.trim();
  return prev ? `${header}\n\n---\n${prev}` : header;
}
