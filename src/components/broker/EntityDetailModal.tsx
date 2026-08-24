import {
  Building2,
  CreditCard,
  FileText,
  Home,
  User,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEntityDetail } from '../../contexts/EntityDetailContext';
import { fetchPayments } from '../../lib/services';
import { formatCurrency } from '../../lib/utils';
import type { Payment } from '../../types/domain';
import {
  PAYMENT_STATUS_LABELS,
  TENANT_STATUS_LABELS,
  UNIT_STATUS_LABELS,
} from '../../types/domain';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-2.5 last:border-0">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-end text-sm font-medium">{value ?? '—'}</span>
    </div>
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('he-IL');
}

function tenantRent(data: unknown): number | undefined {
  const rent = (data as { monthly_rent?: number }).monthly_rent;
  return typeof rent === 'number' ? rent : undefined;
}

export function EntityDetailModal() {
  const {
    view,
    loading,
    close,
    openUnitById,
    openTenantById,
    openLeaseById,
    openPayment,
  } = useEntityDetail();
  const [leasePayments, setLeasePayments] = useState<Payment[]>([]);

  useEffect(() => {
    if (view?.kind !== 'lease') {
      setLeasePayments([]);
      return;
    }
    fetchPayments().then((all) => setLeasePayments(all.filter((p) => p.lease_id === view.data.id)));
  }, [view]);

  if (!view && !loading) return null;

  const titles = {
    unit: 'פרטי יחידה',
    tenant: 'פרטי שוכר',
    lease: 'פרטי חוזה',
    payment: 'פרטי תשלום',
  };

  return (
    <Modal
      open={Boolean(view) || loading}
      onClose={close}
      title={view ? titles[view.kind] : 'טוען...'}
      className="max-w-lg"
    >
      {loading && !view ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : null}

      {view?.kind === 'unit' && (
        <div className="space-y-4">
          <DetailRow label="מספר יחידה" value={view.data.unit_number} />
          <DetailRow label="שם" value={view.data.unit_name} />
          <DetailRow
            label="נכס"
            value={
              <Link to={`/broker/properties/${view.data.property_id}`} className="text-primary hover:underline">
                {view.data.propertyTitle}
              </Link>
            }
          />
          <DetailRow label="שטח" value={view.data.area_sqm ? `${view.data.area_sqm} מ"ר` : '—'} />
          <DetailRow
            label="שכ&quot;ד חודשי"
            value={
              view.data.monthly_rent ? (
                <span className="text-primary">{formatCurrency(view.data.monthly_rent)}</span>
              ) : (
                '—'
              )
            }
          />
          <DetailRow
            label="סטטוס"
            value={<Badge variant="outline">{UNIT_STATUS_LABELS[view.data.unit_status]}</Badge>}
          />
          <DetailRow label="שוכר" value={view.data.tenant_name} />

          <div className="flex flex-wrap gap-2 pt-2">
            {view.data.tenant_id && (
              <Button type="button" size="sm" variant="outline" onClick={() => openTenantById(view.data.tenant_id!)}>
                <User className="h-4 w-4" />
                שוכר
              </Button>
            )}
            {view.data.lease_id && (
              <Button type="button" size="sm" variant="outline" onClick={() => openLeaseById(view.data.lease_id!)}>
                <FileText className="h-4 w-4" />
                חוזה
              </Button>
            )}
            {view.data.lease_id && (
              <Link to={`/broker/payments?property=${view.data.property_id}`}>
                <Button type="button" size="sm" variant="outline">
                  <CreditCard className="h-4 w-4" />
                  תשלומים
                </Button>
              </Link>
            )}
            <Link to={`/broker/properties/${view.data.property_id}`}>
              <Button type="button" size="sm" variant="ghost">
                <Building2 className="h-4 w-4" />
                דף נכס
              </Button>
            </Link>
          </div>
        </div>
      )}

      {view?.kind === 'tenant' && (
        <div className="space-y-4">
          <DetailRow label="שם" value={view.data.full_name} />
          <DetailRow label="חברה" value={view.data.company_name} />
          <DetailRow
            label="טלפון"
            value={
              view.data.phone ? (
                <a href={`tel:${view.data.phone}`} className="text-primary hover:underline">
                  {view.data.phone}
                </a>
              ) : (
                '—'
              )
            }
          />
          <DetailRow
            label="אימייל"
            value={
              view.data.email ? (
                <a href={`mailto:${view.data.email}`} className="text-primary hover:underline">
                  {view.data.email}
                </a>
              ) : (
                '—'
              )
            }
          />
          <DetailRow
            label="סטטוס"
            value={<Badge variant="outline">{TENANT_STATUS_LABELS[view.data.status]}</Badge>}
          />
          <DetailRow
            label="נכס"
            value={
              view.data.property_id ? (
                <Link to={`/broker/properties/${view.data.property_id}`} className="text-primary hover:underline">
                  {view.data.property_title}
                </Link>
              ) : (
                view.data.property_title
              )
            }
          />
          <DetailRow label="יחידה" value={view.data.unit_number} />
          <DetailRow
            label="שכ&quot;ד"
            value={
              tenantRent(view.data) ? (
                <span className="text-primary">{formatCurrency(tenantRent(view.data)!)}</span>
              ) : (
                '—'
              )
            }
          />

          <div className="flex flex-wrap gap-2 pt-2">
            {view.data.unit_id && view.data.property_id && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => openUnitById(view.data.property_id!, view.data.unit_id!)}
              >
                <Home className="h-4 w-4" />
                יחידה
              </Button>
            )}
            {view.data.lease_id && (
              <Button type="button" size="sm" variant="outline" onClick={() => openLeaseById(view.data.lease_id!)}>
                <FileText className="h-4 w-4" />
                חוזה
              </Button>
            )}
            {view.data.property_id && (
              <Link to={`/broker/payments?property=${view.data.property_id}`}>
                <Button type="button" size="sm" variant="outline">
                  <CreditCard className="h-4 w-4" />
                  תשלומים
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {view?.kind === 'lease' && (
        <div className="space-y-4">
          <DetailRow label="שוכר" value={view.data.tenant_name} />
          <DetailRow
            label="נכס"
            value={
              <Link to={`/broker/properties/${view.data.property_id}`} className="text-primary hover:underline">
                {view.data.property_title}
              </Link>
            }
          />
          <DetailRow label="יחידה" value={view.data.unit_number} />
          <DetailRow
            label="שכ&quot;ד חודשי"
            value={<span className="text-primary">{formatCurrency(view.data.monthly_rent)}</span>}
          />
          <DetailRow
            label="פיקדון"
            value={view.data.deposit ? formatCurrency(view.data.deposit) : '—'}
          />
          <DetailRow
            label="תקופה"
            value={`${formatDate(view.data.start_date)} – ${formatDate(view.data.end_date)}`}
          />
          <DetailRow
            label="סטטוס"
            value={
              <Badge variant={view.data.is_active ? 'success' : 'outline'}>
                {view.data.is_active ? 'פעיל' : 'לא פעיל'}
              </Badge>
            }
          />

          {leasePayments.length > 0 && (
            <div className="rounded-xl border border-border p-3">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">תשלומים ({leasePayments.length})</p>
              <ul className="max-h-40 space-y-2 overflow-y-auto">
                {leasePayments.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
                      onClick={() => openPayment(p)}
                    >
                      <span>{formatDate(p.due_date)}</span>
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{formatCurrency(p.amount)}</span>
                        <Badge variant="outline">{PAYMENT_STATUS_LABELS[p.status]}</Badge>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="button" size="sm" variant="outline" onClick={() => openTenantById(view.data.tenant_id)}>
              <User className="h-4 w-4" />
              שוכר
            </Button>
            {view.data.unit_id && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => openUnitById(view.data.property_id, view.data.unit_id!)}
              >
                <Home className="h-4 w-4" />
                יחידה
              </Button>
            )}
            <Link to={`/broker/payments?property=${view.data.property_id}`}>
              <Button type="button" size="sm" variant="outline">
                <CreditCard className="h-4 w-4" />
                כל התשלומים
              </Button>
            </Link>
          </div>
        </div>
      )}

      {view?.kind === 'payment' && (
        <div className="space-y-4">
          <DetailRow label="שוכר" value={view.data.tenant_name} />
          <DetailRow
            label="נכס"
            value={
              view.data.property_id ? (
                <Link to={`/broker/properties/${view.data.property_id}`} className="text-primary hover:underline">
                  {view.data.property_title}
                </Link>
              ) : (
                view.data.property_title
              )
            }
          />
          <DetailRow label="יחידה" value={view.data.unit_number} />
          <DetailRow label="סכום" value={<span className="text-primary">{formatCurrency(view.data.amount)}</span>} />
          <DetailRow label="תאריך יעד" value={formatDate(view.data.due_date)} />
          <DetailRow
            label="סטטוס"
            value={<Badge variant="outline">{PAYMENT_STATUS_LABELS[view.data.status]}</Badge>}
          />

          <div className="flex flex-wrap gap-2 pt-2">
            {view.data.tenant_id && (
              <Button type="button" size="sm" variant="outline" onClick={() => openTenantById(view.data.tenant_id!)}>
                <User className="h-4 w-4" />
                שוכר
              </Button>
            )}
            {view.data.lease_id && (
              <Button type="button" size="sm" variant="outline" onClick={() => openLeaseById(view.data.lease_id!)}>
                <FileText className="h-4 w-4" />
                חוזה
              </Button>
            )}
            {view.data.unit_id && view.data.property_id && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => openUnitById(view.data.property_id!, view.data.unit_id!)}
              >
                <Home className="h-4 w-4" />
                יחידה
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

/** Prevent row click when interacting with action buttons */
export function stopRowClick(e: React.MouseEvent) {
  e.stopPropagation();
}
