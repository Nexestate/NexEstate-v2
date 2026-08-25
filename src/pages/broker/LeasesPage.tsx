import { Building2, Calendar, User } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { FilterBar } from '../../components/ui/FilterBar';
import { Tabs } from '../../components/ui/Tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { useAuth } from '../../contexts/AuthContext';
import { useEntityCreated } from '../../hooks/useEntityCreated';
import { fetchAccessiblePropertyIds, fetchLeasesForProperties, fetchTenantsForProperties } from '../../lib/services';
import { formatCurrency } from '../../lib/utils';
import type { Lease, Tenant } from '../../types/domain';
import { TENANT_STATUS_LABELS } from '../../types/domain';
import { EntityLinkButton } from '../../components/broker/EntityLinkButton';
import { BackButton } from '../../components/ui/BackButton';
import { useEntityDetail } from '../../contexts/EntityDetailContext';

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
  const { openLease, openTenant, openLeaseById, openTenantById, openUnitById } = useEntityDetail();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const propertyFilter = searchParams.get('property');
  const openId = searchParams.get('open');
  const [section, setSection] = useState<'leases' | 'tenants'>(
    pathname.includes('/tenants') ? 'tenants' : 'leases',
  );
  const [search, setSearch] = useState('');
  const [leases, setLeases] = useState<Lease[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!user?.id) return;
    setLoading(true);
    fetchAccessiblePropertyIds(user.id, user.role)
      .then((propertyIds) =>
        Promise.all([
          fetchLeasesForProperties(propertyIds),
          fetchTenantsForProperties(propertyIds),
        ]),
      )
      .then(([l, t]) => {
        setLeases(l);
        setTenants(t);
      })
      .catch((err) => {
        console.error('[LeasesPage] load failed', err);
      })
      .finally(() => setLoading(false));
  }, [user?.id, user?.role]);

  useEffect(() => {
    setSection(pathname.includes('/tenants') ? 'tenants' : 'leases');
  }, [pathname]);

  useEffect(() => {
    load();
  }, [load]);

  useEntityCreated(['lease', 'tenant'], load);

  const filteredLeases = useMemo(
    () =>
      leases.filter((l) => {
        const matchesSearch =
          l.tenant_name.includes(search) ||
          (l.property_title?.includes(search) ?? false) ||
          (l.unit_number?.includes(search) ?? false);
        const matchesProperty = !propertyFilter || l.property_id === propertyFilter;
        return matchesSearch && matchesProperty;
      }),
    [leases, search, propertyFilter],
  );

  const filteredTenants = useMemo(
    () =>
      tenants.filter((t) => {
        const matchesSearch =
          t.full_name.includes(search) ||
          (t.company_name?.includes(search) ?? false) ||
          (t.property_title?.includes(search) ?? false);
        const matchesProperty = !propertyFilter || t.property_id === propertyFilter;
        return matchesSearch && matchesProperty;
      }),
    [tenants, search, propertyFilter],
  );

  useEffect(() => {
    if (!openId || loading) return;
    const tenant = tenants.find((t) => t.id === openId);
    if (tenant) {
      openTenant(tenant);
      return;
    }
    const lease = leases.find((l) => l.id === openId);
    if (lease) {
      openLease(lease);
      return;
    }
    void openTenantById(openId).then(() => openLeaseById(openId));
  }, [openId, loading, leases, tenants, openLease, openTenant, openTenantById, openLeaseById]);

  const propertyTitle = propertyFilter
    ? leases.find((l) => l.property_id === propertyFilter)?.property_title ??
      tenants.find((t) => t.property_id === propertyFilter)?.property_title
    : undefined;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {propertyFilter && (
        <BackButton
          to={section === 'tenants' ? '/broker/tenants' : '/broker/leases'}
          label="חזרה לרשימה המלאה"
        />
      )}
      <div>
        <h2 className="text-xl font-bold">חוזים ושוכרים</h2>
        <p className="text-sm text-muted-foreground">
          {propertyTitle ? `נכס: ${propertyTitle}` : 'ניהול חוזי שכירות ושוכרים'}
        </p>
        {propertyFilter && (
          <Link
            to={section === 'tenants' ? '/broker/tenants' : '/broker/leases'}
            className="mt-1 inline-block text-sm text-primary hover:underline"
          >
            הצג הכל
          </Link>
        )}
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
              <div
                key={lease.id}
                role="button"
                tabIndex={0}
                className="cursor-pointer rounded-xl border border-border bg-card p-4"
                onClick={() => openLease(lease)}
              >
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
                  <TableRow
                    key={lease.id}
                    className={`cursor-pointer ${openId === lease.id ? 'bg-primary/5 ring-1 ring-primary/30' : ''}`}
                    onClick={() => openLease(lease)}
                  >
                    <TableCell className="font-medium">
                      <EntityLinkButton onClick={() => void openTenantById(lease.tenant_id)}>
                        {lease.tenant_name}
                      </EntityLinkButton>
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/broker/properties/${lease.property_id}`}
                        className="text-primary hover:underline"
                      >
                        {lease.property_title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {lease.unit_id ? (
                        <EntityLinkButton onClick={() => void openUnitById(lease.property_id, lease.unit_id!)}>
                          {lease.unit_number}
                        </EntityLinkButton>
                      ) : (
                        lease.unit_number
                      )}
                    </TableCell>
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
              <TableHead>חוזה</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTenants.map((tenant) => (
              <TableRow
                key={tenant.id}
                className={`cursor-pointer ${openId === tenant.id ? 'bg-primary/5 ring-1 ring-primary/30' : ''}`}
                onClick={() => openTenant(tenant)}
              >
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
                <TableCell>
                  {tenant.property_id ? (
                    <Link
                      to={`/broker/properties/${tenant.property_id}`}
                      className="text-primary hover:underline"
                    >
                      {tenant.property_title ?? '—'}
                    </Link>
                  ) : (
                    tenant.property_title ?? '—'
                  )}
                </TableCell>
                <TableCell>
                  {tenant.unit_id && tenant.property_id ? (
                    <EntityLinkButton onClick={() => void openUnitById(tenant.property_id!, tenant.unit_id!)}>
                      {tenant.unit_number ?? '—'}
                    </EntityLinkButton>
                  ) : (
                    tenant.unit_number ?? '—'
                  )}
                </TableCell>
                <TableCell>{tenant.phone ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{tenant.email ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={TENANT_STATUS_VARIANT[tenant.status] ?? 'outline'}>
                    {TENANT_STATUS_LABELS[tenant.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {tenant.lease_id ? (
                    <EntityLinkButton onClick={() => void openLeaseById(tenant.lease_id!)}>
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
