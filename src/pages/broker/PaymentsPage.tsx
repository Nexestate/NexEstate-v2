import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { Badge } from '../../components/ui/Badge';
import { FilterBar } from '../../components/ui/FilterBar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { useAsyncData } from '../../hooks/useAsyncData';
import { fetchPayments } from '../../lib/services';
import { formatCurrency, formatDate } from '../../lib/utils';
import { PAYMENT_STATUS_LABELS } from '../../types/domain';
import { useMemo, useState } from 'react';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'destructive' | 'outline'> = {
  paid: 'success',
  pending: 'outline',
  overdue: 'destructive',
  cancelled: 'warning',
};

export function PaymentsPage() {
  const [search, setSearch] = useState('');
  const [searchParams] = useSearchParams();
  const propertyFilter = searchParams.get('property');
  const { data: payments, loading } = useAsyncData(() => fetchPayments(), []);

  const filtered = useMemo(
    () =>
      payments?.filter((p) => {
        const matchesSearch = p.tenant_name.includes(search) || p.property_title.includes(search);
        const matchesProperty = !propertyFilter || p.property_id === propertyFilter;
        return matchesSearch && matchesProperty;
      }) ?? [],
    [payments, search, propertyFilter],
  );

  const totals = useMemo(() => {
    if (!payments) return { pending: 0, overdue: 0, paid: 0 };
    return {
      pending: payments.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0),
      overdue: payments.filter((p) => p.status === 'overdue').reduce((s, p) => s + p.amount, 0),
      paid: payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0),
    };
  }, [payments]);

  if (loading || !payments) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageHeader title="תשלומים" description="מעקב תשלומי שכירות וצ'קים" />

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

      <FilterBar search={search} onSearchChange={setSearch} placeholder="חיפוש שוכר..." />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>שוכר</TableHead>
            <TableHead>נכס</TableHead>
            <TableHead>יחידה</TableHead>
            <TableHead>סכום</TableHead>
            <TableHead>תאריך יעד</TableHead>
            <TableHead>סטטוס</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">
                {p.tenant_id ? (
                  <Link to={`/broker/tenants/${p.tenant_id}`} className="text-primary hover:underline">
                    {p.tenant_name || 'שוכר'}
                  </Link>
                ) : (
                  p.tenant_name || '—'
                )}
              </TableCell>
              <TableCell>
                {p.property_id ? (
                  <Link to={`/broker/properties/${p.property_id}`} className="hover:text-primary hover:underline">
                    {p.property_title}
                  </Link>
                ) : (
                  p.property_title
                )}
              </TableCell>
              <TableCell>
                {p.lease_id ? (
                  <Link to={`/broker/leases/${p.lease_id}`} className="hover:text-primary hover:underline">
                    {p.unit_number || 'חוזה'}
                  </Link>
                ) : (
                  p.unit_number
                )}
              </TableCell>
              <TableCell className="font-medium">{formatCurrency(p.amount)}</TableCell>
              <TableCell>{formatDate(p.due_date)}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[p.status]}>{PAYMENT_STATUS_LABELS[p.status]}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
