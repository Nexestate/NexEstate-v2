import { Building2, Calendar, User } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { FilterBar } from '../../components/ui/FilterBar';
import { Tabs } from '../../components/ui/Tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { useAuth } from '../../contexts/AuthContext';
import { fetchLeases, fetchTenants } from '../../lib/services';
import { formatCurrency } from '../../lib/utils';
import type { Lease, Tenant } from '../../types/domain';
import { TENANT_STATUS_LABELS } from '../../types/domain';

const TENANT_STATUS_VARIANT: Record<string, 'success' | 'warning' | 'outline'> = {
  active: 'success',
  ending: 'warning',
  ended: 'outline',
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('he-IL');
}

export function LeasesPage() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [section, setSection] = useState<'leases' | 'tenants'>(
    pathname.includes('/tenants') ? 'tenants' : 'leases',
  );
  const [search, setSearch] = useState('');
  const [leases, setLeases] = useState<Lease[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchLeases(user?.id), fetchTenants(user?.id)]).then(([l, t]) => {
      setLeases(l);
      setTenants(t);
      setLoading(false);
    });
  }, [user?.id]);

  const filteredLeases = useMemo(
    () =>
      leases.filter(
        (l) =>
          l.tenant_name.includes(search) ||
          (l.property_title?.includes(search) ?? false) ||
          (l.unit_number?.includes(search) ?? false),
      ),
    [leases, search],
  );

  const filteredTenants = useMemo(
    () =>
      tenants.filter(
        (t) =>
          t.full_name.includes(search) ||
          (t.company_name?.includes(search) ?? false) ||
          (t.property_title?.includes(search) ?? false),
      ),
    [tenants, search],
  );

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">חוזים ושוכרים</h2>
        <p className="text-sm text-muted-foreground">ניהול חוזי שכירות ושוכרים</p>
      </div>

      <Tabs
        tabs={[
          { id: 'leases', label: 'חוזים', count: leases.length },
          { id: 'tenants', label: 'שוכרים', count: tenants.length },
        ]}
        active={section}
        onChange={(id) => setSection(id as 'leases' | 'tenants')}
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder={section === 'leases' ? 'חיפוש חוזה...' : 'חיפוש שוכר...'}
      />

      {section === 'leases' && (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {filteredLeases.map((lease) => (
              <div key={lease.id} className="rounded-xl border border-border bg-card p-4">
                <div className="mb-2 flex items-start justify-between">
                  <p className="font-medium">{lease.tenant_name}</p>
                  <Badge variant={lease.is_active ? 'success' : 'outline'}>
                    {lease.is_active ? 'פעיל' : 'לא פעיל'}
                  </Badge>
                </div>
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  {lease.property_title} • יחידה {lease.unit_number}
                </p>
                <p className="mt-1 text-lg font-bold text-primary">
                  {formatCurrency(lease.monthly_rent)}/חודש
                </p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {formatDate(lease.start_date)} – {formatDate(lease.end_date)}
                </p>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>שוכר</TableHead>
                  <TableHead>נכס</TableHead>
                  <TableHead>יחידה</TableHead>
                  <TableHead>שכ&quot;ד</TableHead>
                  <TableHead>פיקדון</TableHead>
                  <TableHead>תקופה</TableHead>
                  <TableHead>סטטוס</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeases.map((lease) => (
                  <TableRow key={lease.id}>
                    <TableCell className="font-medium">{lease.tenant_name}</TableCell>
                    <TableCell>{lease.property_title}</TableCell>
                    <TableCell>{lease.unit_number}</TableCell>
                    <TableCell className="font-medium text-primary">
                      {formatCurrency(lease.monthly_rent)}
                    </TableCell>
                    <TableCell>
                      {lease.deposit ? formatCurrency(lease.deposit) : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatDate(lease.start_date)} – {formatDate(lease.end_date)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={lease.is_active ? 'success' : 'outline'}>
                        {lease.is_active ? 'פעיל' : 'לא פעיל'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {section === 'tenants' && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>שם / חברה</TableHead>
              <TableHead>נכס</TableHead>
              <TableHead>יחידה</TableHead>
              <TableHead>טלפון</TableHead>
              <TableHead>אימייל</TableHead>
              <TableHead>סטטוס</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTenants.map((tenant) => (
              <TableRow key={tenant.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{tenant.full_name}</p>
                      {tenant.company_name && tenant.company_name !== tenant.full_name && (
                        <p className="text-xs text-muted-foreground">{tenant.company_name}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{tenant.property_title ?? '—'}</TableCell>
                <TableCell>{tenant.unit_number ?? '—'}</TableCell>
                <TableCell>{tenant.phone ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{tenant.email ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={TENANT_STATUS_VARIANT[tenant.status] ?? 'outline'}>
                    {TENANT_STATUS_LABELS[tenant.status]}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
