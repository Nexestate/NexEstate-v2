import { Building2, CreditCard, Home, Pencil, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEntityDetail } from '../../contexts/EntityDetailContext';
import { notifyEntityCreated } from '../../contexts/QuickAddContext';
import { tenantPaymentsHref, unitDetailHref } from '../../lib/propertyNav';
import {
  fetchLeaseById,
  fetchPayments,
  fetchProperty,
  updatePayment,
  updateTenant,
  updateUnit,
} from '../../lib/services';
import { formatCurrency } from '../../lib/utils';
import type { Lease, Payment, PaymentMethod, Tenant } from '../../types/domain';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  TENANT_STATUS_LABELS,
  TENANT_TYPE_LABELS,
  UNIT_STATUS_LABELS,
} from '../../types/domain';
import { TenantDocumentsChecklist } from '../property/TenantDocumentsChecklist';
import { UnitFormModal } from '../property/UnitFormModal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { DetailPanel, DetailRow, DetailSection } from '../ui/DetailPanel';
import { Modal } from '../ui/Modal';
import { NavLinkButton } from './NavLinkButton';
import { PaymentFormModal } from './PaymentFormModal';
import { TenantFormModal } from './QuickAddModals';

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('he-IL');
}

function tenantPrimaryName(t: Tenant): string {
  if (t.tenant_type === 'company' && t.company_name?.trim()) return t.company_name.trim();
  return t.full_name;
}

function unitLabel(unitNumber?: string, unitName?: string): string {
  if (unitNumber && unitName) return `יח׳ ${unitNumber} · ${unitName}`;
  if (unitNumber) return `יח׳ ${unitNumber}`;
  return unitName ?? '—';
}

type EditKind = 'unit' | 'tenant' | 'lease' | 'payment';

export function EntityDetailModal() {
  const {
    view,
    loading,
    close,
    refreshView,
    openTenantById,
    openUnitById,
    openPayment,
  } = useEntityDetail();
  const [activeLease, setActiveLease] = useState<Lease | null>(null);
  const [unitName, setUnitName] = useState<string | undefined>();
  const [propertyAddress, setPropertyAddress] = useState<string | undefined>();
  const [tenantPayments, setTenantPayments] = useState<Payment[]>([]);
  const [editKind, setEditKind] = useState<EditKind | null>(null);

  useEffect(() => {
    if (view?.kind !== 'tenant') {
      setActiveLease(null);
      setUnitName(undefined);
      setPropertyAddress(undefined);
      setTenantPayments([]);
      return;
    }
    const tenant = view.data;
    let cancelled = false;
    void (async () => {
      let lease: Lease | null = null;
      if (tenant.lease_id) {
        lease = (await fetchLeaseById(tenant.lease_id)) ?? null;
        if (!cancelled) setActiveLease(lease);
        if (lease) {
          const all = await fetchPayments();
          if (!cancelled) setTenantPayments(all.filter((p) => p.lease_id === lease!.id));
        }
      } else if (!cancelled) {
        setActiveLease(null);
        setTenantPayments([]);
      }
      if (tenant.property_id) {
        const property = await fetchProperty(tenant.property_id);
        if (!cancelled && property) {
          setPropertyAddress(`${property.address}, ${property.city}`);
          const unit = property.units.find((u) => u.id === tenant.unit_id);
          setUnitName(unit?.unit_name);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [view]);

  useEffect(() => {
    setEditKind(null);
  }, [view?.kind, view?.data]);

  if (!view && !loading) return null;

  const titles = {
    unit: 'פרטי יחידה',
    tenant: 'פרטי שוכר',
    lease: 'פרטי שוכר',
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
        closeOnBackdrop={false}
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
                {view.data.tenant_id && (
                  <NavLinkButton
                    to={tenantPaymentsHref(view.data.tenant_id, view.data.property_id)}
                    onNavigate={navigateAway}
                  >
                    <CreditCard className="h-4 w-4" />
                    תשלומים
                  </NavLinkButton>
                )}
                {editButton}
              </>
            }
          >
            <DetailRow label="מספר יחידה" value={view.data.unit_number} />
            <DetailRow label="שם יחידה" value={view.data.unit_name ?? '—'} />
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
                {view.data.id && (
                  <NavLinkButton
                    to={tenantPaymentsHref(view.data.id, view.data.property_id)}
                    onNavigate={navigateAway}
                  >
                    <CreditCard className="h-4 w-4" />
                    תשלומים
                  </NavLinkButton>
                )}
                {editButton}
              </>
            }
          >
            <DetailSection title="פרטי שוכר">
              <DetailRow
                label="סוג"
                value={view.data.tenant_type ? TENANT_TYPE_LABELS[view.data.tenant_type] : '—'}
              />
              <DetailRow label="שם" value={tenantPrimaryName(view.data)} />
              {view.data.tenant_type === 'company' && view.data.contact_name && (
                <DetailRow label="איש קשר" value={view.data.contact_name} />
              )}
              {view.data.id_number && <DetailRow label="מזהה (ח.פ / ת.ז.)" value={view.data.id_number} />}
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
              <DetailRow label="כתובת" value={propertyAddress ?? '—'} />
              <DetailRow
                label="סטטוס"
                value={<Badge variant="outline">{TENANT_STATUS_LABELS[view.data.status]}</Badge>}
              />
            </DetailSection>

            <DetailSection title="השכרה" className="mt-4">
              <DetailRow
                label="נכס"
                value={
                  view.data.property_id
                    ? propertyLink(view.data.property_id, view.data.property_title)
                    : (view.data.property_title ?? '—')
                }
              />
              <DetailRow
                label="יחידה"
                value={
                  view.data.unit_id && view.data.property_id ? (
                    <button
                      type="button"
                      className="text-primary hover:underline"
                      onClick={() => openUnitById(view.data.property_id!, view.data.unit_id!)}
                    >
                      {unitLabel(view.data.unit_number, unitName)}
                    </button>
                  ) : (
                    unitLabel(view.data.unit_number, unitName)
                  )
                }
              />
              <DetailRow
                label="תקופת שכירות"
                value={
                  activeLease
                    ? `${formatDate(activeLease.start_date)} – ${formatDate(activeLease.end_date)}`
                    : '—'
                }
              />
              <DetailRow
                label="שכ&quot;ד חודשי"
                value={
                  (activeLease?.monthly_rent ?? view.data.monthly_rent) != null ? (
                    <span className="text-primary">
                      {formatCurrency(activeLease?.monthly_rent ?? view.data.monthly_rent!)}
                    </span>
                  ) : (
                    '—'
                  )
                }
              />
              <DetailRow
                label="פיקדון"
                value={activeLease?.deposit ? formatCurrency(activeLease.deposit) : '—'}
              />
              <DetailRow
                label="אמצעי תשלום"
                value={
                  activeLease?.payment_method
                    ? PAYMENT_METHOD_LABELS[activeLease.payment_method]
                    : '—'
                }
              />
            </DetailSection>

            {tenantPayments.length > 0 && (
              <DetailSection title={`תשלומים (${tenantPayments.length})`} className="mt-4">
                <ul className="max-h-44 space-y-2 overflow-y-auto">
                  {tenantPayments.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-muted/40"
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
                <NavLinkButton
                  to={tenantPaymentsHref(view.data.id, view.data.property_id)}
                  onNavigate={navigateAway}
                  variant="ghost"
                  className="mt-2 w-full justify-center"
                >
                  כל תשלומי השוכר
                </NavLinkButton>
              </DetailSection>
            )}

            <TenantDocumentsChecklist tenant={view.data} className="mt-4 border-t border-border pt-4" />
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
