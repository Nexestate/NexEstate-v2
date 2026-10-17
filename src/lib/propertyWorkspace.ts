import type {
  Lease,
  Payment,
  PropertyWithUnits,
  SigningLink,
  Tenant,
  TenantType,
} from '../types/domain';

export type WorkspaceTab = 'overview' | 'activity' | 'maintenance';

export type DocumentRequirement = {
  id: string;
  label: string;
};

export const INDIVIDUAL_DOCUMENT_REQUIREMENTS: DocumentRequirement[] = [
  { id: 'id', label: 'תעודת זהות' },
  { id: 'id_appendix', label: 'ספח תעודת זהות' },
  { id: 'signed_lease', label: 'הסכם שכירות חתום' },
  { id: 'guarantee', label: 'ערבות / ביטחון' },
];

export const COMPANY_DOCUMENT_REQUIREMENTS: DocumentRequirement[] = [
  { id: 'incorporation', label: 'תעודת התאגדות' },
  { id: 'company_id', label: 'מספר ח.פ. / אישור רשם' },
  { id: 'signatory', label: 'אישור מורשה חתימה' },
  { id: 'signed_lease', label: 'הסכם שכירות חתום' },
  { id: 'guarantee', label: 'ערבות / ביטחון' },
];

export function requirementsForTenantType(type?: TenantType): DocumentRequirement[] {
  return type === 'company' ? COMPANY_DOCUMENT_REQUIREMENTS : INDIVIDUAL_DOCUMENT_REQUIREMENTS;
}

export type WorkspaceAction = {
  id: string;
  title: string;
  detail: string;
  tab?: WorkspaceTab;
  href?: string;
  tone: 'warning' | 'info' | 'success';
};

export type WorkspaceSnapshot = {
  occupied: boolean;
  occupancyPercent: number;
  currentTenants: Tenant[];
  activeLeases: Lease[];
  /** Active leases ending within 90 days or already past end date. */
  leasesNeedingRenewal: Lease[];
  nextLeaseEnd?: Lease;
  monthlyRent: number;
  nextPayment?: Payment;
  overduePayments: Payment[];
  unsignedAgreements: SigningLink[];
  signedAgreements: SigningLink[];
  maintenanceUnits: number;
};

export function buildWorkspaceSnapshot(input: {
  property: PropertyWithUnits;
  tenants: Tenant[];
  leases: Lease[];
  payments: Payment[];
  links: SigningLink[];
}): WorkspaceSnapshot {
  const { property, tenants, leases, payments, links } = input;
  const occupancyPercent =
    property.totalUnits > 0 ? Math.round((property.occupiedUnits / property.totalUnits) * 100) : 0;
  const activeLeases = leases.filter((l) => l.is_active);
  const currentTenants = tenants.filter((t) => t.status === 'active' || t.status === 'ending');
  const upcoming = [...activeLeases].sort(
    (a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime(),
  );
  const leasesNeedingRenewal = activeLeases.filter((l) => leaseNeedsAttention(l.end_date));
  const pendingPay = payments
    .filter((p) => p.status === 'pending' || p.status === 'pending_verification')
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  const overduePayments = payments.filter((p) => p.status === 'overdue');
  const unsignedAgreements = links.filter((l) => l.status === 'pending' || l.status === 'sent');
  const signedAgreements = links.filter((l) => l.status === 'signed');
  const monthlyRent =
    activeLeases.reduce((sum, l) => sum + (l.monthly_rent || 0), 0) || property.monthlyIncome;

  return {
    occupied: property.occupiedUnits > 0,
    occupancyPercent,
    currentTenants,
    activeLeases,
    leasesNeedingRenewal,
    nextLeaseEnd: upcoming[0],
    monthlyRent,
    nextPayment: overduePayments[0] ?? pendingPay[0],
    overduePayments,
    unsignedAgreements,
    signedAgreements,
    maintenanceUnits: property.units.filter((u) => u.unit_status === 'maintenance').length,
  };
}

export function buildWorkspaceActions(
  snapshot: WorkspaceSnapshot,
  propertyId: string,
): WorkspaceAction[] {
  const actions: WorkspaceAction[] = [];

  if (snapshot.overduePayments.length > 0) {
    const total = snapshot.overduePayments.reduce((sum, p) => sum + p.amount, 0);
    const names = [...new Set(snapshot.overduePayments.map((p) => p.tenant_name))].slice(0, 3).join(' · ');
    actions.push({
      id: 'overdue',
      title: `${snapshot.overduePayments.length} תשלומי חוזה באיחור`,
      detail: `${names} · יתרה ${total.toLocaleString('he-IL')} ₪`,
      href: `/broker/payments?property=${propertyId}`,
      tone: 'warning',
    });
  }

  if (snapshot.unsignedAgreements.length > 0) {
    actions.push({
      id: 'unsigned',
      title: 'קישורי חתימה (CRM) ממתינים',
      detail: `${snapshot.unsignedAgreements.length} הסכמי חתימה דיגיטליים לטיפול`,
      href: `/broker/agreements?property=${propertyId}`,
      tone: 'warning',
    });
  }

  if (snapshot.leasesNeedingRenewal.length > 0) {
    const sorted = [...snapshot.leasesNeedingRenewal].sort(
      (a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime(),
    );
    const nearest = sorted[0]!;
    const days = daysUntil(nearest.end_date);
    const expiredCount = sorted.filter((l) => daysUntil(l.end_date) < 0).length;
    const upcomingCount = sorted.length - expiredCount;

    let title: string;
    if (sorted.length === 1) {
      title =
        days < 0 ? 'חוזה פג — נדרש חידוש או יציאה' : `חוזה מסתיים בעוד ${days} יום`;
    } else if (expiredCount > 0 && upcomingCount > 0) {
      title = `${expiredCount} חוזים פגו · ${upcomingCount} מסתיימים ב-90 יום`;
    } else if (expiredCount > 0) {
      title = `${expiredCount} חוזים פגו — לטיפול`;
    } else {
      title = `${upcomingCount} חוזים מסתיימים ב-90 יום`;
    }

    const detail =
      days < 0
        ? `${nearest.tenant_name} · פג ב-${formatShortDate(nearest.end_date)} (לפני ${Math.abs(days)} יום)`
        : `${nearest.tenant_name} · ${formatShortDate(nearest.end_date)} (עוד ${days} יום)`;

    actions.push({
      id: 'lease-end',
      title,
      detail,
      href: `/broker/tenants?property=${propertyId}&tab=leases&attention=renewal`,
      tone: days <= 30 ? 'warning' : 'info',
    });
  }

  const docTenant = snapshot.currentTenants[0];
  if (docTenant) {
    const required = requirementsForTenantType(docTenant.tenant_type).length;
    actions.push({
      id: 'docs',
      title: 'מסמכי שוכר — השלמת רשימה',
      detail: `${docTenant.full_name} · ${required} מסמכים נדרשים · פתיחת כרטיס שוכר`,
      href: `/broker/tenants?property=${propertyId}&open=${docTenant.id}`,
      tone: 'info',
    });
  }

  if (snapshot.maintenanceUnits > 0) {
    actions.push({
      id: 'maint',
      title: `${snapshot.maintenanceUnits} יחידות בתחזוקה`,
      detail: 'בדקו סטטוס יחידה ופתחו משימת טיפול',
      href: `/broker/properties/${propertyId}?tab=maintenance`,
      tone: 'info',
    });
  }

  if (actions.length === 0) {
    actions.push({
      id: 'ok',
      title: 'אין חריגות פתוחות',
      detail: 'הנכס מאויש, אין איחורי תשלום ואין חוזים דחופים',
      tone: 'success',
    });
  }

  return actions.slice(0, 5);
}

export type ActivityItem = {
  id: string;
  at: string;
  title: string;
  detail?: string;
};

export function buildPropertyActivity(input: {
  leases: Lease[];
  payments: Payment[];
  links: SigningLink[];
}): ActivityItem[] {
  const items: ActivityItem[] = [];

  for (const lease of input.leases) {
    items.push({
      id: `lease-${lease.id}`,
      at: lease.start_date,
      title: lease.is_active ? 'חוזה פעיל' : 'חוזה הסתיים',
      detail: `${lease.tenant_name} · עד ${formatShortDate(lease.end_date)}`,
    });
  }

  for (const payment of input.payments) {
    items.push({
      id: `pay-${payment.id}`,
      at: payment.paid_at ?? payment.due_date,
      title:
        payment.status === 'paid'
          ? 'תשלום התקבל'
          : payment.status === 'overdue'
            ? 'תשלום באיחור'
            : 'תשלום מתוכנן',
      detail: `${payment.tenant_name} · ${payment.amount.toLocaleString('he-IL')} ₪`,
    });
  }

  for (const link of input.links) {
    items.push({
      id: `sign-${link.id}`,
      at: link.signed_at ?? link.expires_at ?? new Date().toISOString(),
      title:
        link.status === 'signed'
          ? 'הסכם נחתם'
          : link.status === 'sent'
            ? 'הסכם נשלח'
            : 'הסכם נוצר',
      detail: link.client_name,
    });
  }

  return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 12);
}

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

/** End date within 90 days ahead or up to 90 days in the past. */
export function leaseNeedsAttention(endDate: string): boolean {
  const d = daysUntil(endDate);
  return d <= 90 && d >= -90;
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('he-IL');
}
