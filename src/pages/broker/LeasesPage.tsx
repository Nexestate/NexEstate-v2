import { AlertTriangle, Building2, Calendar, FileText, Pencil, Plus, Trash2, User } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { FilterBar } from '../../components/ui/FilterBar';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { useAuth } from '../../contexts/AuthContext';
import { useQuickAdd } from '../../contexts/QuickAddContext';
import { useEntityCreated } from '../../hooks/useEntityCreated';
import { deleteLease, fetchLeases } from '../../lib/services';
import { daysUntil, formatCurrency, formatDate } from '../../lib/utils';
import type { Lease } from '../../types/domain';

export function LeasesPage() {
  const { user } = useAuth();
  const { openQuickAdd } = useQuickAdd();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const propertyFilter = searchParams.get('property');
  const openId = searchParams.get('open');
  const [search, setSearch] = useState('');
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [withVat, setWithVat] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetchLeases(user?.id).then((data) => {
      setLeases(data);
      setLoading(false);
    });
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEntityCreated('lease', load);

  const filtered = useMemo(
    () =>
      leases.filter((l) => {
        const hay = [l.tenant_name, l.tenant_company, l.property_title, l.unit_number, l.unit_name]
          .filter(Boolean)
          .join(' ');
        return hay.includes(search) && (!propertyFilter || l.property_id === propertyFilter);
      }),
    [leases, search, propertyFilter],
  );

  const stats = useMemo(() => {
    const active = leases.filter((l) => l.is_active);
    const expiring = active.filter((l) => {
      const days = daysUntil(l.end_date);
      return days != null && days >= 0 && days <= 90;
    });
    const income = active.reduce((sum, l) => sum + l.monthly_rent, 0);
    return { active: active.length, expiring: expiring.length, income };
  }, [leases]);

  const displayRent = (amount: number) => formatCurrency(withVat ? amount * 1.18 : amount);

  const handleDelete = async (e: React.MouseEvent, lease: Lease) => {
    e.stopPropagation();
    if (!window.confirm('למחוק את החוזה?')) return;
    await deleteLease(lease.id);
    load();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="חוזים"
        description="ניהול חוזי שכירות"
        action={
          <Button onClick={() => openQuickAdd('lease', propertyFilter ? { propertyId: propertyFilter } : undefined)}>
            <Plus className="h-4 w-4" />
            חוזה חדש
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="h-4 w-4 text-primary" />
            חוזים פעילים
          </p>
          <p className="mt-1 text-2xl font-bold">{stats.active}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">הכנסות חודשיות</p>
          <p className="mt-1 text-2xl font-bold text-success">{formatCurrency(stats.income)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="h-4 w-4 text-warning" />
            מסתיימים ב-90 יום
          </p>
          <p className="mt-1 text-2xl font-bold">{stats.expiring}</p>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={withVat}
          onChange={(e) => setWithVat(e.target.checked)}
          className="h-4 w-4 accent-primary"
        />
        הצג עם מע&quot;מ (18%)
      </label>

      <FilterBar search={search} onSearchChange={setSearch} placeholder="חיפוש חוזים..." />

      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="אין חוזים להצגה"
          actionLabel="חוזה חדש"
          onAction={() => openQuickAdd('lease')}
        />
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>יחידה</TableHead>
                  <TableHead>שוכר</TableHead>
                  <TableHead>תחילה</TableHead>
                  <TableHead>סיום</TableHead>
                  <TableHead>שכ&quot;ד</TableHead>
                  <TableHead>פיקדון</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((lease) => (
                  <TableRow
                    key={lease.id}
                    className={`cursor-pointer ${openId === lease.id ? 'bg-primary/5 ring-1 ring-primary/30' : ''}`}
                    onClick={() => navigate(`/broker/leases/${lease.id}`)}
                  >
                    <TableCell>
                      {lease.unit_id ? (
                        <Link
                          to={`/broker/units/${lease.unit_id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 font-medium text-primary hover:underline"
                        >
                          <Building2 className="h-3.5 w-3.5" />
                          {lease.unit_name || lease.unit_number || 'יחידה'}
                        </Link>
                      ) : (
                        lease.unit_number || '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {lease.tenant_id ? (
                        <Link
                          to={`/broker/tenants/${lease.tenant_id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 hover:text-primary hover:underline"
                        >
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          {lease.tenant_company || lease.tenant_name}
                        </Link>
                      ) : (
                        lease.tenant_name || '—'
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(lease.start_date)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(lease.end_date)}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-primary">{displayRent(lease.monthly_rent)}</TableCell>
                    <TableCell>{lease.deposit ? formatCurrency(lease.deposit) : '—'}</TableCell>
                    <TableCell>
                      <Badge variant={lease.is_active ? 'success' : 'outline'}>
                        {lease.is_active ? 'פעיל' : 'לא פעיל'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label="עריכת חוזה"
                          className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/broker/leases/${lease.id}`);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="מחיקת חוזה"
                          className="grid h-8 w-8 place-items-center rounded-lg text-destructive hover:bg-destructive/10"
                          onClick={(e) => void handleDelete(e, lease)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 md:hidden">
            {filtered.map((lease) => (
              <Link
                key={lease.id}
                to={`/broker/leases/${lease.id}`}
                className="block rounded-xl border border-border bg-card p-4"
              >
                <div className="mb-2 flex items-start justify-between">
                  <p className="font-medium">{lease.tenant_company || lease.tenant_name}</p>
                  <Badge variant={lease.is_active ? 'success' : 'outline'}>
                    {lease.is_active ? 'פעיל' : 'לא פעיל'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {lease.property_title} • {lease.unit_name || lease.unit_number}
                </p>
                <p className="mt-1 text-lg font-bold text-primary">{displayRent(lease.monthly_rent)}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
