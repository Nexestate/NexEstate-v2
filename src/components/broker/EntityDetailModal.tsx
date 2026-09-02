import {
  Building2,
  CreditCard,
  FileText,
  Home,
  Pencil,
  User,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEntityDetail } from '../../contexts/EntityDetailContext';
import { notifyEntityCreated } from '../../contexts/QuickAddContext';
import { unitDetailHref } from '../../lib/propertyNav';
import { fetchPayments, updateLease, updatePayment, updateTenant, updateUnit } from '../../lib/services';
import { formatCurrency } from '../../lib/utils';
import type { Payment, PaymentMethod } from '../../types/domain';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  TENANT_STATUS_LABELS,
  UNIT_STATUS_LABELS,
} from '../../types/domain';
import { UnitFormModal } from '../property/UnitFormModal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { DetailPanel, DetailRow } from '../ui/DetailPanel';
import { Modal } from '../ui/Modal';
import { NavLinkButton } from './NavLinkButton';
import { PaymentFormModal } from './PaymentFormModal';
import { LeaseFormModal, TenantFormModal } from './QuickAddModals';

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('he-IL');
}

function tenantRent(data: unknown): number | undefined {
  const rent = (data as { monthly_rent?: number }).monthly_rent;
  return typeof rent === 'number' ? rent : undefined;
}

type EditKind = 'unit' | 'tenant' | 'lease' | 'payment';

export function EntityDetailModal() {
  const {
    view,
    loading,
    close,
    refreshView,
    openTenantById,
    openLeaseById,
    openPayment,
  } = useEntityDetail();
  const [leasePayments, setLeasePayments] = useState<Payment[]>([]);
  const [editKind, setEditKind] = useState<EditKind | null>(null);

  useEffect(() => {
    if (view?.kind !== 'lease') {
      setLeasePayments([]);
      return;
    }
    fetchPayments().then((all) => setLeasePayments(all.filter((p) => p.lease_id === view.data.id)));
  }, [view]);

  useEffect(() => {
    setEditKind(null);
  }, [view?.kind, view?.data]);

  if (!view && !loading) return null;

  const titles = {
    unit: 'פרטי יחידה',
    tenant: 'פרטי שוכר',
    lease: 'פרטי חוזה',
    payment: 'פרטי תשלום',
  };

  const navigateAway = () => close();

  const editButton = view ? (
    <Button type="button" size="sm" variant="outline" onClick={() => setEditKind(view.kind)}>
      <Pencil className="h-4 w-4" />
      עריכה
    </Button>
  ) : null;

  const propertyLink = (propertyId: string, label?: string) => (
    <Link
      to={`/broker/properties/${propertyId}`}
      className="text-primary hover:underline"
      onClick={navigateAway}
    >
      {label ?? 'דף נכס'}
    </Link>
  );

  const unitLink = (propertyId: string, unitId: string, label?: string) => (
    <Link
      to={unitDetailHref(propertyId, unitId)}
      className="text-primary hover:underline"
      onClick={navigateAway}
    >
      {label ?? 'יחידה'}
    </Link>
  );

  return (
    <>
      <Modal
        open={Boolean(view) || loading}
        onClose={close}
        title={view ? titles[view.kind] : 'טוען...'}
        size="xl"
      >
        {loading && !view ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : null}

        {view?.kind === 'unit' && (
          <DetailPanel
            actions={
              <>
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
                  <NavLinkButton to={`/broker/payments?property=${view.data.property_id}`} onNavigate={navigateAway}>
                    <CreditCard className="h-4 w-4" />
                    תשלומים
                  </NavLinkButton>
                )}
                {editButton}
              </>
            }
          >
            <DetailRow label="מספר יחידה" value={view.data.unit_number} />
            <DetailRow label="שם" value={view.data.unit_name} />
            <DetailRow label="נכס" value={propertyLink(view.data.property_id, view.data.propertyTitle)} />
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
            <DetailRow
              label="שוכר"
              value={
                view.data.tenant_id && view.data.tenant_name ? (
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => openTenantById(view.data.tenant_id!)}
                  >
                    {view.data.tenant_name}
                  </button>
                ) : (
                  view.data.tenant_name ?? '—'
                )
              }
            />
          </DetailPanel>
        )}

        {view?.kind === 'tenant' && (
          <DetailPanel
            actions={
              <>
                {view.data.unit_id && view.data.property_id && (
                  <NavLinkButton
                    to={unitDetailHref(view.data.property_id, view.data.unit_id)}
                    onNavigate={navigateAway}
                    variant="outline"
                  >
                    <Home className="h-4 w-4" />
                    יחידה
                  </NavLinkButton>
                )}
                {view.data.lease_id && (
                  <Button type="button" size="sm" variant="outline" onClick={() => openLeaseById(view.data.lease_id!)}>
                    <FileText className="h-4 w-4" />
                    חוזה
                  </Button>
                )}
                {view.data.property_id && (
                  <NavLinkButton to={`/broker/payments?property=${view.data.property_id}`} onNavigate={navigateAway}>
                    <CreditCard className="h-4 w-4" />
                    תשלומים
                  </NavLinkButton>
                )}
                {editButton}
              </>
            }
          >
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
                view.data.property_id ? propertyLink(view.data.property_id, view.data.property_title) : view.data.property_title
              }
            />
            <DetailRow
              label="יחידה"
              value={
                view.data.unit_id && view.data.property_id
                  ? unitLink(view.data.property_id, view.data.unit_id, view.data.unit_number)
                  : view.data.unit_number ?? '—'
              }
            />
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
          </DetailPanel>
        )}

        {view?.kind === 'lease' && (
          <DetailPanel
            actions={
              <>
                <Button type="button" size="sm" variant="outline" onClick={() => openTenantById(view.data.tenant_id)}>
                  <User className="h-4 w-4" />
                  שוכר
                </Button>
                {view.data.unit_id && (
                  <NavLinkButton
                    to={unitDetailHref(view.data.property_id, view.data.unit_id)}
                    onNavigate={navigateAway}
                    variant="outline"
                  >
                    <Home className="h-4 w-4" />
                    יחידה
                  </NavLinkButton>
                )}
                <NavLinkButton to={`/broker/payments?property=${view.data.property_id}`} onNavigate={navigateAway}>
                  <CreditCard className="h-4 w-4" />
                  כל התשלומים
                </NavLinkButton>
                {editButton}
              </>
            }
          >
            <DetailRow
              label="שוכר"
              value={
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => openTenantById(view.data.tenant_id)}
                >
                  {view.data.tenant_name}
                </button>
              }
            />
            <DetailRow label="נכס" value={propertyLink(view.data.property_id, view.data.property_title)} />
            <DetailRow
              label="יחידה"
              value={
                view.data.unit_id
                  ? unitLink(view.data.property_id, view.data.unit_id, view.data.unit_number)
                  : view.data.unit_number
              }
            />
            <DetailRow
              label="שכ&quot;ד חודשי"
              value={<span className="text-primary">{formatCurrency(view.data.monthly_rent)}</span>}
            />
            <DetailRow label="פיקדון" value={view.data.deposit ? formatCurrency(view.data.deposit) : '—'} />
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
              <div className="col-span-full rounded-xl border border-border p-3">
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
          </DetailPanel>
        )}

        {view?.kind === 'payment' && (
          <DetailPanel
            actions={
              <>
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
                  <NavLinkButton
                    to={unitDetailHref(view.data.property_id, view.data.unit_id)}
                    onNavigate={navigateAway}
                    variant="outline"
                  >
                    <Home className="h-4 w-4" />
                    יחידה
                  </NavLinkButton>
                )}
                {view.data.property_id && (
                  <NavLinkButton
                    to={`/broker/properties/${view.data.property_id}`}
                    onNavigate={navigateAway}
                    variant="ghost"
                  >
                    <Building2 className="h-4 w-4" />
                    דף נכס
                  </NavLinkButton>
                )}
                {editButton}
              </>
            }
          >
            <DetailRow
              label="שוכר"
              value={
                view.data.tenant_id ? (
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => openTenantById(view.data.tenant_id!)}
                  >
                    {view.data.tenant_name}
                  </button>
                ) : (
                  view.data.tenant_name
                )
              }
            />
            <DetailRow
              label="נכס"
              value={
                view.data.property_id ? propertyLink(view.data.property_id, view.data.property_title) : view.data.property_title
              }
            />
            <DetailRow
              label="יחידה"
              value={
                view.data.unit_id && view.data.property_id
                  ? unitLink(view.data.property_id, view.data.unit_id, view.data.unit_number)
                  : view.data.unit_number
              }
            />
            <DetailRow label="סכום" value={<span className="text-primary">{formatCurrency(view.data.amount)}</span>} />
            <DetailRow label="תאריך יעד" value={formatDate(view.data.due_date)} />
            <DetailRow
              label="סטטוס"
              value={<Badge variant="outline">{PAYMENT_STATUS_LABELS[view.data.status]}</Badge>}
            />
            <DetailRow
              label="אמצעי תשלום"
              value={
                view.data.payment_method
                  ? PAYMENT_METHOD_LABELS[view.data.payment_method as PaymentMethod]
                  : '—'
              }
            />
            <DetailRow label="מספר קבלה" value={view.data.receipt_number} />
            <DetailRow label="הערות" value={view.data.notes} />
            {view.data.paid_at && <DetailRow label="תאריך תשלום" value={formatDate(view.data.paid_at)} />}
          </DetailPanel>
        )}
      </Modal>

      {view?.kind === 'unit' && (
        <UnitFormModal
          open={editKind === 'unit'}
          onClose={() => setEditKind(null)}
          title="עריכת יחידה"
          initial={{
            unit_number: view.data.unit_number,
            unit_name: view.data.unit_name ?? '',
            area_sqm: view.data.area_sqm?.toString() ?? '',
            monthly_rent: view.data.monthly_rent?.toString() ?? '',
            unit_status: view.data.unit_status,
            floor: view.data.floor?.toString() ?? '',
          }}
          onSubmit={async (values) => {
            await updateUnit(view.data.id, {
              unit_number: values.unit_number.trim(),
              unit_name: values.unit_name.trim() || undefined,
              area_sqm: values.area_sqm ? Number(values.area_sqm) : undefined,
              monthly_rent: values.monthly_rent ? Number(values.monthly_rent) : undefined,
              unit_status: values.unit_status,
              floor: values.floor ? Number(values.floor) : undefined,
            });
            notifyEntityCreated('unit');
            setEditKind(null);
            await refreshView();
          }}
        />
      )}

      {view?.kind === 'tenant' && (
        <TenantFormModal
          open={editKind === 'tenant'}
          onClose={() => setEditKind(null)}
          title="עריכת שוכר"
          initial={{
            full_name: view.data.full_name,
            phone: view.data.phone,
            email: view.data.email,
          }}
          onSubmit={async (values) => {
            await updateTenant(view.data.id, {
              full_name: values.full_name,
              phone: values.phone,
              email: values.email,
            });
            notifyEntityCreated('tenant');
            setEditKind(null);
            await refreshView();
          }}
        />
      )}

      {view?.kind === 'lease' && (
        <LeaseFormModal
          open={editKind === 'lease'}
          onClose={() => setEditKind(null)}
          title="עריכת חוזה"
          initial={{
            tenant_name: view.data.tenant_name,
            monthly_rent: view.data.monthly_rent.toString(),
            start_date: view.data.start_date,
            end_date: view.data.end_date,
          }}
          onSubmit={async (values) => {
            await updateLease(view.data.id, {
              monthly_rent: values.monthly_rent,
              start_date: values.start_date,
              end_date: values.end_date,
            });
            notifyEntityCreated('lease');
            setEditKind(null);
            await refreshView();
          }}
        />
      )}

      {view?.kind === 'payment' && (
        <PaymentFormModal
          open={editKind === 'payment'}
          onClose={() => setEditKind(null)}
          title="עריכת תשלום"
          initial={{
            amount: view.data.amount.toString(),
            due_date: view.data.due_date,
            status: view.data.status,
            payment_method: (view.data.payment_method as PaymentMethod | undefined) ?? 'transfer',
            receipt_number: view.data.receipt_number,
            notes: view.data.notes,
          }}
          onSubmit={async (values) => {
            await updatePayment(view.data.id, {
              amount: Number(values.amount),
              due_date: values.due_date,
              status: values.status,
              payment_method: values.payment_method,
              receipt_number: values.receipt_number || undefined,
              notes: values.notes || undefined,
            });
            notifyEntityCreated('payment');
            setEditKind(null);
            await refreshView();
          }}
        />
      )}
    </>
  );
}

export function stopRowClick(e: React.MouseEvent) {
  e.stopPropagation();
}
