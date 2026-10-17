import type {
  Lease,
  Payment,
  PropertyWithUnits,
  SigningLink,
  Tenant,
  TenantType,
} from '../types/domain';

export type WorkspaceTab = 'overview' | 'agreements' | 'activity' | 'maintenance';

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
    actions.push({
      id: 'overdue',
      title: `${snapshot.overduePayments.length} תשלומים באיחור`,
      detail: `יתרה פתוחה ${total.toLocaleString('he-IL')} ₪`,
      href: `/broker/payments?property=${propertyId}`,
      tone: 'warning',
    });
  }

  if (snapshot.unsignedAgreements.length > 0) {
    actions.push({
      id: 'unsigned',
      title: 'חסר חוזה חתום',
      detail: `${snapshot.unsignedAgreements.length} הסכמים ממתינים לחתימה`,
      tab: 'agreements',
      tone: 'warning',
    });
  } else if (snapshot.activeLeases.length > 0 && snapshot.signedAgreements.length === 0) {
    actions.push({
      id: 'no-agreement',
      title: 'אין הסכם חתום לנכס',
      detail: 'צרו קישור חתימה לשוכר הפעיל',
      tab: 'agreements',
      tone: 'warning',
    });
  }

  if (snapshot.nextLeaseEnd) {
    const days = daysUntil(snapshot.nextLeaseEnd.end_date);
    if (days <= 90) {
      actions.push({
        id: 'lease-end',
        title:
          days < 0
            ? 'החוזה הסתיים — נדרש חידוש או יציאה'
            : `החוזה מסתיים בעוד ${days} יום`,
        detail: `${snapshot.nextLeaseEnd.tenant_name} · ${formatShortDate(snapshot.nextLeaseEnd.end_date)}`,
        href: `/broker/tenants?property=${propertyId}&tab=leases`,
        tone: days <= 30 ? 'warning' : 'info',
      });
    }
  }

  if (snapshot.currentTenants.length > 0) {
    actions.push({
      id: 'docs',
      title: 'מסמכי שוכר טרם הושלמו',
      detail: 'פתחו כרטיס שוכר לרשימת המסמכים הנדרשים',
      href: `/broker/tenants?property=${propertyId}`,
      tone: 'info',
    });
  }

  if (snapshot.maintenanceUnits > 0) {
    actions.push({
      id: 'maint',
      title: `${snapshot.maintenanceUnits} יחידות בתחזוקה`,
      detail: 'בדקו סטטוס יחידה ופתחו משימת טיפול',
      tab: 'maintenance',
      tone: 'info',
    });
  }

  if (actions.length === 0) {
    actions.push({
      id: 'ok',
      title: 'אין חריגות פתוחות',
      detail: 'הנכס מאויש, אין איחורים ידועים ואין הסכם ממתין',
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

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('he-IL');
}
