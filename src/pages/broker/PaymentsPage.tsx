import { CreditCard, Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { EntityLinkButton } from '../../components/broker/EntityLinkButton';
import { PropertySubNav } from '../../components/broker/PropertySubNav';
import { BackButton } from '../../components/ui/BackButton';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { FilterBar } from '../../components/ui/FilterBar';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { useAuth } from '../../contexts/AuthContext';
import { useQuickAdd } from '../../contexts/QuickAddContext';
import { useEntityDetail } from '../../contexts/EntityDetailContext';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useEntityCreated } from '../../hooks/useEntityCreated';
import { fetchAccessiblePropertyIds, fetchPayments } from '../../lib/services';
import { formatCurrency } from '../../lib/utils';
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS, type PaymentMethod } from '../../types/domain';
import { Button } from '../../components/ui/Button';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'destructive' | 'outline'> = {
  paid: 'success',
  pending: 'outline',
  overdue: 'destructive',
  cancelled: 'warning',
};

export function PaymentsPage() {
  const { user } = useAuth();
  const { openQuickAdd } = useQuickAdd();
  const [searchParams] = useSearchParams();
  const { openPayment, openPaymentById, openTenantById, openUnitById, openLeaseById } = useEntityDetail();
  const propertyFilter = searchParams.get('property');
  const openId = searchParams.get('open');
  const [search, setSearch] = useState('');

  const loadPayments = useCallback(async () => {
    if (!user?.id) return [];
    const propertyIds = propertyFilter
      ? [propertyFilter]
      : await fetchAccessiblePropertyIds(user.id, user.role);
    return fetchPayments(propertyIds);
  }, [propertyFilter, user?.id, user?.role]);

  const { data: payments, loading, error, reload } = useAsyncData(loadPayments, [loadPayments]);

  useEntityCreated('payment', reload);

  const scoped = useMemo(
    () => payments?.filter((p) => !propertyFilter || p.property_id === propertyFilter) ?? [],
    [payments, propertyFilter],
  );

  const filtered = useMemo(
    () =>
      scoped.filter(
        (p) =>
          p.tenant_name.includes(search) ||
          p.property_title.includes(search) ||
          p.unit_number.includes(search),
      ),
    [scoped, search],
  );

  const totals = useMemo(() => {
    return {
      pending: scoped.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0),
      overdue: scoped.filter((p) => p.status === 'overdue').reduce((s, p) => s + p.amount, 0),
      paid: scoped.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0),
    };
  }, [scoped]);

  useEffect(() => {
    if (!openId || loading || !payments) return;
    const payment = payments.find((p) => p.id === openId);
    if (payment) openPayment(payment);
    else void openPaymentById(openId);
  }, [openId, loading, payments, openPayment, openPaymentById]);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {propertyFilter && (
        <>
          <BackButton to="/broker/payments" label="חזרה לכל התשלומים" />
          <PropertySubNav propertyId={propertyFilter} />
        </>
      )}

      <PageHeader
        title="תשלומים"
        description={
          propertyFilter ? 'תשלומים עבור הנכס שנבחר' : "מעקב תשלומי שכירות וצ'קים"
        }
        action={
          <Button onClick={() => openQuickAdd('payment', propertyFilter ? { propertyId: propertyFilter } : undefined)}>
            <Plus className="h-4 w-4" />
            תשלום חדש
          </Button>
        }
      />

      {propertyFilter && (
        <Link to="/broker/payments" className="text-sm text-primary hover:underline">
          הצג את כל התשלומים
        </Link>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          שגיאה בטעינת תשלומים. נסה לרענן את הדף.
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'ממתינים', value: totals.pending, variant: 'outline' as const },
          { label: 'באיחור', value: totals.overdue, variant: 'destructive' as const },
          { label: 'שולמו', value: totals.paid, variant: 'success' as const },
        ].map(({ label, value, variant }) => (
          <div key={label} className="rounded-xl border border-border p-4 text-center">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-bold">{formatCurrency(value)}</p>
            <Badge variant={variant} className="mt-1">{label}</Badge>
          </div>
        ))}
      </div>

      <FilterBar search={search} onSearchChange={setSearch} placeholder="חיפוש שוכר, נכס או יחידה..." />

      {filtered.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="אין תשלומים להצגה"
          description="צור תשלום חדש עבור חוזה פעיל כדי להתחיל מעקב"
          actionLabel="תשלום חדש"
          onAction={() => openQuickAdd('payment', propertyFilter ? { propertyId: propertyFilter } : undefined)}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>שוכר</TableHead>
              <TableHead>נכס</TableHead>
              <TableHead>יחידה</TableHead>
              <TableHead>סכום</TableHead>
              <TableHead>אמצעי תשלום</TableHead>
              <TableHead>תאריך יעד</TableHead>
              <TableHead>סטטוס</TableHead>
              <TableHead>חוזה</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id} className="cursor-pointer" onClick={() => openPayment(p)}>
                <TableCell className="font-medium">
                  {p.tenant_id ? (
                    <EntityLinkButton onClick={() => void openTenantById(p.tenant_id!)}>
                      {p.tenant_name}
                    </EntityLinkButton>
                  ) : (
                    p.tenant_name
                  )}
                </TableCell>
                <TableCell>
                  {p.property_id ? (
                    <Link to={`/broker/properties/${p.property_id}`} className="text-primary hover:underline">
                      {p.property_title}
                    </Link>
                  ) : (
                    p.property_title
                  )}
                </TableCell>
                <TableCell>
                  {p.unit_id && p.property_id ? (
                    <EntityLinkButton onClick={() => void openUnitById(p.property_id!, p.unit_id!)}>
                      {p.unit_number}
                    </EntityLinkButton>
                  ) : (
                    p.unit_number
                  )}
                </TableCell>
                <TableCell className="font-medium">{formatCurrency(p.amount)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {p.payment_method ? PAYMENT_METHOD_LABELS[p.payment_method as PaymentMethod] : '—'}
                </TableCell>
                <TableCell>{new Date(p.due_date).toLocaleDateString('he-IL')}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[p.status]}>{PAYMENT_STATUS_LABELS[p.status]}</Badge>
                </TableCell>
                <TableCell>
                  {p.lease_id ? (
                    <EntityLinkButton onClick={() => void openLeaseById(p.lease_id!)}>
                      צפייה
                    </EntityLinkButton>
                  ) : (
                    '—'
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
