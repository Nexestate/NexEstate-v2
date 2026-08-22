import { Building2, MapPin, Pencil, Phone, Plus, Trash2, User } from 'lucide-react';
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
import { deleteTenant, fetchTenants } from '../../lib/services';
import type { Tenant } from '../../types/domain';
import { TENANT_RATING_LABELS, TENANT_STATUS_LABELS, TENANT_TYPE_LABELS } from '../../types/domain';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'outline'> = {
  active: 'success',
  ending: 'warning',
  ended: 'outline',
};

export function TenantsPage() {
  const { user } = useAuth();
  const { openQuickAdd } = useQuickAdd();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const propertyFilter = searchParams.get('property');
  const [search, setSearch] = useState('');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetchTenants(user?.id).then((data) => {
      setTenants(data);
      setLoading(false);
    });
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEntityCreated('tenant', load);

  const filtered = useMemo(
    () =>
      tenants.filter((t) => {
        const hay = [t.full_name, t.company_name, t.contact_name, t.mobile, t.phone, t.city, t.email]
          .filter(Boolean)
          .join(' ');
        const matchesSearch = hay.includes(search);
        const matchesProperty = !propertyFilter || t.property_id === propertyFilter;
        return matchesSearch && matchesProperty;
      }),
    [tenants, search, propertyFilter],
  );

  const handleDelete = async (e: React.MouseEvent, tenant: Tenant) => {
    e.stopPropagation();
    if (!window.confirm(`למחוק את השוכר ${tenant.company_name || tenant.full_name}?`)) return;
    await deleteTenant(tenant.id);
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
        title="שוכרים"
        description="כל השוכרים בנכסים המנוהלים"
        action={
          <Button onClick={() => openQuickAdd('tenant', propertyFilter ? { propertyId: propertyFilter } : undefined)}>
            <Plus className="h-4 w-4" />
            שוכר חדש
          </Button>
        }
      />

      <FilterBar search={search} onSearchChange={setSearch} placeholder="חיפוש שוכרים..." />

      {filtered.length === 0 ? (
        <EmptyState
          icon={User}
          title="אין שוכרים להצגה"
          description="הוסף שוכר חדש או שנה את החיפוש"
          actionLabel="שוכר חדש"
          onAction={() => openQuickAdd('tenant')}
        />
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>שם חברה</TableHead>
                  <TableHead>איש קשר</TableHead>
                  <TableHead>סוג</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>דירוג</TableHead>
                  <TableHead>נייד</TableHead>
                  <TableHead>עיר</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((tenant) => (
                  <TableRow
                    key={tenant.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/broker/tenants/${tenant.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <div>
                          <p className="font-medium">{tenant.company_name || tenant.full_name}</p>
                          {tenant.unit_number && (
                            <p className="text-xs text-muted-foreground">יחידה {tenant.unit_number}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{tenant.contact_name || tenant.full_name}</TableCell>
                    <TableCell>{TENANT_TYPE_LABELS[tenant.tenant_type ?? 'sole_proprietor']}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[tenant.status] ?? 'outline'}>
                        {TENANT_STATUS_LABELS[tenant.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{TENANT_RATING_LABELS[tenant.rating ?? 'new']}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        {tenant.mobile || tenant.phone || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        {tenant.city || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label="עריכת שוכר"
                          className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/broker/tenants/${tenant.id}?edit=1`);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="מחיקת שוכר"
                          className="grid h-8 w-8 place-items-center rounded-lg text-destructive hover:bg-destructive/10"
                          onClick={(e) => void handleDelete(e, tenant)}
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
            {filtered.map((tenant) => (
              <Link
                key={tenant.id}
                to={`/broker/tenants/${tenant.id}`}
                className="block rounded-xl border border-border bg-card p-4"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <p className="font-medium">{tenant.company_name || tenant.full_name}</p>
                  <Badge variant={STATUS_VARIANT[tenant.status] ?? 'outline'}>
                    {TENANT_STATUS_LABELS[tenant.status]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{tenant.contact_name || tenant.full_name}</p>
                <p className="mt-1 text-sm">{tenant.mobile || tenant.phone || '—'}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
