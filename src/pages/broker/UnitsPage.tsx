import { Building2, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
import { fetchManagedPropertySidebar } from '../../lib/services';
import { formatCurrency } from '../../lib/utils';
import { UNIT_STATUS_LABELS } from '../../types/domain';

const STATUS_VARIANT: Record<string, 'success' | 'primary' | 'warning' | 'outline'> = {
  occupied: 'success',
  available: 'primary',
  maintenance: 'warning',
  reserved: 'outline',
};

interface FlatUnit {
  id: string;
  propertyId: string;
  propertyTitle: string;
  unit_number: string;
  unit_name?: string;
  unit_status: string;
  area_sqm?: number;
  monthly_rent?: number;
  tenant_id?: string;
  tenant_name?: string;
  floor?: number;
}

export function UnitsPage() {
  const { user } = useAuth();
  const { openQuickAdd } = useQuickAdd();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const propertyFilter = searchParams.get('property');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [units, setUnits] = useState<FlatUnit[]>([]);

  const load = () => {
    if (!user?.id) return;
    setLoading(true);
    fetchManagedPropertySidebar(user.id).then(({ properties }) => {
      setUnits(
        properties.flatMap((p) =>
          p.units.map((u) => ({
            id: u.id,
            propertyId: p.id,
            propertyTitle: p.title,
            unit_number: u.unit_number,
            unit_name: u.unit_name,
            unit_status: u.unit_status,
            area_sqm: u.area_sqm,
            monthly_rent: u.monthly_rent,
            tenant_id: u.tenant_id,
            tenant_name: u.tenant_name,
            floor: u.floor,
          })),
        ),
      );
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEntityCreated(['unit', 'property', 'lease', 'tenant'], load);

  const filtered = useMemo(
    () =>
      units.filter((u) => {
        const hay = [u.unit_number, u.unit_name, u.propertyTitle, u.tenant_name].filter(Boolean).join(' ');
        return hay.includes(search) && (!propertyFilter || u.propertyId === propertyFilter);
      }),
    [units, search, propertyFilter],
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
      <PageHeader
        title="יחידות"
        description="כל היחידות בנכסים המנוהלים"
        action={
          <Button onClick={() => openQuickAdd('unit', propertyFilter ? { propertyId: propertyFilter } : undefined)}>
            <Plus className="h-4 w-4" />
            יחידה חדשה
          </Button>
        }
      />

      <FilterBar search={search} onSearchChange={setSearch} placeholder="חיפוש יחידות..." />

      {filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="אין יחידות להצגה"
          actionLabel="יחידה חדשה"
          onAction={() => openQuickAdd('unit')}
        />
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>מספר</TableHead>
                  <TableHead>שם</TableHead>
                  <TableHead>נכס</TableHead>
                  <TableHead>שוכר</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>שטח</TableHead>
                  <TableHead>שכ&quot;ד</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((unit) => (
                  <TableRow
                    key={unit.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/broker/units/${unit.id}`)}
                  >
                    <TableCell className="font-medium">#{unit.unit_number}</TableCell>
                    <TableCell>{unit.unit_name ?? '—'}</TableCell>
                    <TableCell>
                      <Link
                        to={`/broker/properties/${unit.propertyId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-primary hover:underline"
                      >
                        {unit.propertyTitle}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {unit.tenant_id ? (
                        <Link
                          to={`/broker/tenants/${unit.tenant_id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-primary hover:underline"
                        >
                          {unit.tenant_name}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[unit.unit_status] ?? 'outline'}>
                        {UNIT_STATUS_LABELS[unit.unit_status as keyof typeof UNIT_STATUS_LABELS] ?? unit.unit_status}
                      </Badge>
                    </TableCell>
                    <TableCell>{unit.area_sqm ? `${unit.area_sqm} מ"ר` : '—'}</TableCell>
                    <TableCell className="font-medium text-primary">
                      {unit.monthly_rent ? formatCurrency(unit.monthly_rent) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 md:hidden">
            {filtered.map((unit) => (
              <Link key={unit.id} to={`/broker/units/${unit.id}`} className="block rounded-xl border border-border p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-medium">יחידה {unit.unit_number}</p>
                  <Badge variant={STATUS_VARIANT[unit.unit_status] ?? 'outline'}>
                    {UNIT_STATUS_LABELS[unit.unit_status as keyof typeof UNIT_STATUS_LABELS] ?? unit.unit_status}
                  </Badge>
                </div>
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  {unit.propertyTitle}
                </p>
                {unit.monthly_rent && (
                  <p className="mt-2 text-lg font-bold text-primary">{formatCurrency(unit.monthly_rent)}</p>
                )}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
