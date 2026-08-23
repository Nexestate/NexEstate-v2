import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { Badge } from '../../components/ui/Badge';
import { FilterBar } from '../../components/ui/FilterBar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { useAuth } from '../../contexts/AuthContext';
import { useAsyncData } from '../../hooks/useAsyncData';
import { fetchAccessiblePropertyIds, fetchPayments } from '../../lib/services';
import { formatCurrency } from '../../lib/utils';
import { PAYMENT_STATUS_LABELS } from '../../types/domain';
import { useCallback, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'destructive' | 'outline'> = {
  paid: 'success',
  pending: 'outline',
  overdue: 'destructive',
  cancelled: 'warning',
};

export function PaymentsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const propertyFilter = searchParams.get('property');
  const [search, setSearch] = useState('');

  const loadPayments = useCallback(async () => {
    if (!user?.id) return [];
    const propertyIds = propertyFilter
      ? [propertyFilter]
      : await fetchAccessiblePropertyIds(user.id, user.role);
    return fetchPayments(propertyIds);
  }, [propertyFilter, user?.id, user?.role]);

  const { data: payments, loading, error } = useAsyncData(loadPayments, [loadPayments]);

  const scoped = useMemo(
    () =>
      payments?.filter((p) => !propertyFilter || p.property_id === propertyFilter) ?? [],
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

  if (loading) return <PageLoader />;

  if (error) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        שגיאה בטעינת תשלומים. נסה לרענן את הדף.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="תשלומים"
        description={
          propertyFilter
            ? 'תשלומים עבור הנכס שנבחר'
            : "מעקב תשלומי שכירות וצ'קים"
        }
      />

      {propertyFilter && (
        <Link to="/broker/payments" className="text-sm text-primary hover:underline">
          הצג את כל התשלומים
        </Link>
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
        <p className="py-12 text-center text-muted-foreground">אין תשלומים להצגה</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>שוכר</TableHead>
              <TableHead>נכס</TableHead>
              <TableHead>יחידה</TableHead>
              <TableHead>סכום</TableHead>
              <TableHead>תאריך יעד</TableHead>
              <TableHead>סטטוס</TableHead>
              <TableHead>חוזה</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">
                  {p.tenant_id && p.property_id ? (
                    <Link
                      to={`/broker/tenants?property=${p.property_id}&open=${p.tenant_id}`}
                      className="text-primary hover:underline"
                    >
                      {p.tenant_name}
                    </Link>
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
                    <Link
                      to={`/broker/units?property=${p.property_id}&open=${p.unit_id}`}
                      className="text-primary hover:underline"
                    >
                      {p.unit_number}
                    </Link>
                  ) : (
                    p.unit_number
                  )}
                </TableCell>
                <TableCell className="font-medium">{formatCurrency(p.amount)}</TableCell>
                <TableCell>{new Date(p.due_date).toLocaleDateString('he-IL')}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[p.status]}>{PAYMENT_STATUS_LABELS[p.status]}</Badge>
                </TableCell>
                <TableCell>
                  {p.lease_id && p.property_id ? (
                    <Link
                      to={`/broker/leases?property=${p.property_id}&open=${p.lease_id}`}
                      className="text-primary hover:underline"
                    >
                      צפייה
                    </Link>
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
