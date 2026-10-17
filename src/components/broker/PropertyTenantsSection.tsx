import { Building2, Calendar, Plus, User } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { EntityLinkButton } from './EntityLinkButton';
import { Badge } from '../ui/Badge';
import { FilterBar } from '../ui/FilterBar';
import { Tabs } from '../ui/Tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useQuickAdd } from '../../contexts/QuickAddContext';
import { useEntityDetail } from '../../contexts/EntityDetailContext';
import { useEntityCreated } from '../../hooks/useEntityCreated';
import { leaseNeedsAttention, tenantsNeedingDocuments } from '../../lib/propertyWorkspace';
import { fetchAccessiblePropertyIds, fetchLeasesForProperties, fetchTenantsForProperties } from '../../lib/services';
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

type PropertyTenantsSectionProps = {
  /** When set, list is scoped to this property (used on property detail). */
  propertyId?: string;
};

export function PropertyTenantsSection({ propertyId }: PropertyTenantsSectionProps) {
  const { user } = useAuth();
  const { openQuickAdd } = useQuickAdd();
  const { openLease, openTenant, openLeaseById, openTenantById, openUnitById } = useEntityDetail();
  const [searchParams, setSearchParams] = useSearchParams();
  const openId = searchParams.get('open');
  const attentionFilter = searchParams.get('attention');
  const listParam = searchParams.get('list');
  const section =
    listParam === 'leases' || attentionFilter === 'renewal' ? 'leases' : 'tenants';
  const docsAttention = attentionFilter === 'docs';
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
        console.error('[PropertyTenantsSection] load failed', err);
      })
      .finally(() => setLoading(false));
  }, [user?.id, user?.role]);

  useEffect(() => {
    load();
  }, [load]);

  useEntityCreated(['lease', 'tenant'], load);

  const filteredLeases = useMemo(() => {
    let list = leases.filter((l) => {
      const matchesSearch =
        l.tenant_name.includes(search) ||
        (l.property_title?.includes(search) ?? false) ||
        (l.unit_number?.includes(search) ?? false);
      const matchesProperty = !propertyId || l.property_id === propertyId;
      return matchesSearch && matchesProperty;
    });
    if (attentionFilter === 'renewal') {
      list = list.filter((l) => l.is_active && leaseNeedsAttention(l.end_date));
    }
    return list;
  }, [leases, search, propertyId, attentionFilter]);

  const filteredTenants = useMemo(() => {
    let list = tenants.filter((t) => {
      const matchesSearch =
        t.full_name.includes(search) ||
        (t.company_name?.includes(search) ?? false) ||
        (t.property_title?.includes(search) ?? false);
      const matchesProperty = !propertyId || t.property_id === propertyId;
      return matchesSearch && matchesProperty;
    });
    if (docsAttention) {
      const needing = new Set(tenantsNeedingDocuments(list).map((t) => t.id));
      list = list.filter((t) => needing.has(t.id));
    }
    return list;
  }, [tenants, search, propertyId, docsAttention]);

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

  const setSection = (id: string) => {
    const next = new URLSearchParams(searchParams);
    if (id === 'leases') next.set('list', 'leases');
    else next.delete('list');
    setSearchParams(next, { replace: true });
  };

  const tenantCount = propertyId
    ? tenants.filter((t) => t.property_id === propertyId).length
    : tenants.length;
  const leaseCount = propertyId
    ? leases.filter((l) => l.property_id === propertyId).length
    : leases.length;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {!propertyId && (
            <>
              <h2 className="text-xl font-bold">שוכרים וחוזים</h2>
              <p className="text-sm text-muted-foreground">ניהול שוכרים וחוזי שכירות — כל הנכסים</p>
            </>
          )}
          {propertyId && (
            <p className="text-sm text-muted-foreground">
              שוכרים וחוזים בנכס זה. לרשימה על כל הנכסים — «שוכרים» בתפריט הראשי.
            </p>
          )}
        </div>
        {section === 'tenants' && (
          <Button
            size="sm"
            onClick={() => openQuickAdd('tenant', propertyId ? { propertyId } : undefined)}
          >
            <Plus className="h-4 w-4" />
            הוסף שוכר
          </Button>
        )}
      </div>

      {attentionFilter === 'renewal' && propertyId && (
        <div className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          מציג חוזים שפגו או מסתיימים בתוך 90 יום — בחרו חוזה מהרשימה לפרטים ולעריכה.
        </div>
      )}

      {docsAttention && propertyId && (
        <div className="rounded-xl border border-primary/35 bg-primary/10 px-4 py-3 text-sm">
          מציג שוכרים פעילים שחסרים להם מסמכים — לחצו על שורה לפתיחת כרטיס השוכר והשלמת הרשימה.
        </div>
      )}

      <Tabs
        tabs={[
          { id: 'tenants', label: 'שוכרים', count: tenantCount },
          { id: 'leases', label: 'חוזים', count: leaseCount },
        ]}
        active={section}
        onChange={setSection}
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder={section === 'leases' ? 'חיפוש חוזה...' : 'חיפוש שוכר...'}
      />

      {section === 'leases' && (
        <>
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
                {!propertyId && (
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                    {lease.property_title} • יחידה {lease.unit_number}
                  </p>
                )}
                {propertyId && (
                  <p className="text-sm text-muted-foreground">יחידה {lease.unit_number}</p>
                )}
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

          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>שוכר</TableHead>
                  {!propertyId && <TableHead>נכס</TableHead>}
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
                    {!propertyId && (
                      <TableCell>
                        <Link
                          to={`/broker/properties/${lease.property_id}?tab=tenants`}
                          className="text-primary hover:underline"
                        >
                          {lease.property_title}
                        </Link>
                      </TableCell>
                    )}
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
                    <TableCell>{lease.deposit ? formatCurrency(lease.deposit) : '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
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
              {!propertyId && <TableHead>נכס</TableHead>}
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
                {!propertyId && (
                  <TableCell>
                    {tenant.property_id ? (
                      <Link
                        to={`/broker/properties/${tenant.property_id}?tab=tenants`}
                        className="text-primary hover:underline"
                      >
                        {tenant.property_title ?? '—'}
                      </Link>
                    ) : (
                      tenant.property_title ?? '—'
                    )}
                  </TableCell>
                )}
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
                    <EntityLinkButton onClick={() => void openTenantById(tenant.id)}>פתיחה</EntityLinkButton>
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
