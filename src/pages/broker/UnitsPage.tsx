import { Building2, Pencil, Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { UnitFormModal, type UnitFormValues } from '../../components/property/UnitFormModal';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { FilterBar } from '../../components/ui/FilterBar';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { useQuickAdd } from '../../contexts/QuickAddContext';
import { useAuth } from '../../contexts/AuthContext';
import { useEntityCreated } from '../../hooks/useEntityCreated';
import { fetchAccessibleProperties, updateUnit } from '../../lib/services';
import { formatCurrency } from '../../lib/utils';
import type { PropertyUnit, PropertyWithUnits } from '../../types/domain';
import { UNIT_STATUS_LABELS } from '../../types/domain';
import { EntityLinkButton } from '../../components/broker/EntityLinkButton';
import { PropertySubNav } from '../../components/broker/PropertySubNav';
import { BackButton } from '../../components/ui/BackButton';
import { useEntityDetail } from '../../contexts/EntityDetailContext';

const STATUS_VARIANT: Record<string, 'success' | 'primary' | 'warning' | 'outline'> = {
  occupied: 'success',
  available: 'primary',
  maintenance: 'warning',
  reserved: 'outline',
};

export function UnitsPage() {
  const { user } = useAuth();
  const { openQuickAdd } = useQuickAdd();
  const { openUnit, openUnitById, openTenantById, openLeaseById } = useEntityDetail();
  const [searchParams] = useSearchParams();
  const propertyFilter = searchParams.get('property');
  const openId = searchParams.get('open');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<PropertyWithUnits[]>([]);
  const [editingUnit, setEditingUnit] = useState<(PropertyUnit & { propertyTitle: string }) | null>(null);

  const load = useCallback(() => {
    if (!user?.id) return;
    setLoading(true);
    fetchAccessibleProperties(user.id, user.role).then((data) => {
      setProperties(data);
      setLoading(false);
    });
  }, [user?.id, user?.role]);

  useEffect(() => {
    load();
  }, [load]);

  useEntityCreated(['property', 'unit'], load);

  const units = useMemo(
    () =>
      properties.flatMap((p) =>
        p.units.map((u) => ({
          ...u,
          propertyTitle: p.title,
        })),
      ),
    [properties],
  );

  const filtered = useMemo(
    () =>
      units.filter((u) => {
        const matchesProperty = !propertyFilter || u.property_id === propertyFilter;
        const matchesSearch =
          u.unit_number.includes(search) ||
          (u.unit_name?.includes(search) ?? false) ||
          u.propertyTitle.includes(search) ||
          (u.tenant_name?.includes(search) ?? false);
        return matchesProperty && matchesSearch;
      }),
    [units, search, propertyFilter],
  );

  useEffect(() => {
    if (!openId || loading) return;
    const unit = units.find((u) => u.id === openId);
    if (unit) {
      openUnit({ ...unit, propertyTitle: unit.propertyTitle, property_id: unit.property_id });
      return;
    }
    if (propertyFilter) void openUnitById(propertyFilter, openId);
  }, [openId, units, loading, propertyFilter, openUnit, openUnitById]);

  const propertyTitle = propertyFilter
    ? properties.find((p) => p.id === propertyFilter)?.title
    : undefined;

  const handleUnitUpdate = async (values: UnitFormValues) => {
    if (!editingUnit) return;
    await updateUnit(editingUnit.id, {
      unit_number: values.unit_number.trim(),
      unit_name: values.unit_name.trim() || undefined,
      area_sqm: values.area_sqm ? Number(values.area_sqm) : undefined,
      monthly_rent: values.monthly_rent ? Number(values.monthly_rent) : undefined,
      unit_status: values.unit_status,
      floor: values.floor ? Number(values.floor) : undefined,
    });
    setEditingUnit(null);
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
      {propertyFilter && (
        <>
          <BackButton to="/broker/units" label="חזרה לכל היחידות" />
          <PropertySubNav propertyId={propertyFilter} />
        </>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <PageHeader
            title="יחידות"
            description={
              propertyTitle
                ? `יחידות בנכס: ${propertyTitle}`
                : 'כל היחידות בנכסים המנוהלים'
            }
          />
          {propertyFilter && (
            <Link to="/broker/units" className="text-sm text-primary hover:underline">
              הצג את כל היחידות
            </Link>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => {
            if (propertyFilter) openQuickAdd('unit', { propertyId: propertyFilter });
            else openQuickAdd('property');
          }}
        >
          <Plus className="h-4 w-4" />
          יחידה חדשה
        </Button>
      </div>

      <FilterBar search={search} onSearchChange={setSearch} placeholder="חיפוש יחידה, נכס או שוכר..." />

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>מספר</TableHead>
              <TableHead>שם</TableHead>
              <TableHead>נכס</TableHead>
              <TableHead>סטטוס</TableHead>
              <TableHead>שוכר</TableHead>
              <TableHead>חוזה</TableHead>
              <TableHead>שטח</TableHead>
              <TableHead>שכ&quot;ד</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((unit) => (
              <TableRow
                key={unit.id}
                className={`cursor-pointer ${openId === unit.id ? 'bg-primary/5 ring-1 ring-primary/30' : ''}`}
                onClick={() => openUnit({ ...unit, propertyTitle: unit.propertyTitle, property_id: unit.property_id })}
              >
                <TableCell className="font-medium">{unit.unit_number}</TableCell>
                <TableCell>{unit.unit_name ?? '—'}</TableCell>
                <TableCell>
                  <Link to={`/broker/properties/${unit.property_id}`} className="text-primary hover:underline">
                    {unit.propertyTitle}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[unit.unit_status] ?? 'outline'}>
                    {UNIT_STATUS_LABELS[unit.unit_status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {unit.tenant_id ? (
                    <EntityLinkButton onClick={() => void openTenantById(unit.tenant_id!)}>
                      {unit.tenant_name}
                    </EntityLinkButton>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell>
                  {unit.lease_id ? (
                    <EntityLinkButton onClick={() => void openLeaseById(unit.lease_id!)}>
                      צפייה
                    </EntityLinkButton>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell>{unit.area_sqm ? `${unit.area_sqm} מ"ר` : '—'}</TableCell>
                <TableCell className="font-medium text-primary">
                  {unit.monthly_rent ? formatCurrency(unit.monthly_rent) : '—'}
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label="עריכת יחידה"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingUnit(unit);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 md:hidden">
        {filtered.map((unit) => (
          <div
            key={unit.id}
            className={`rounded-xl border border-border p-4 ${openId === unit.id ? 'ring-1 ring-primary/30' : ''}`}
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="font-medium">יחידה {unit.unit_number}</p>
              <Badge variant={unit.unit_status === 'occupied' ? 'success' : 'outline'}>
                {UNIT_STATUS_LABELS[unit.unit_status]}
              </Badge>
            </div>
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              <Link to={`/broker/properties/${unit.property_id}`} className="text-primary hover:underline">
                {unit.propertyTitle}
              </Link>
            </p>
            {unit.tenant_name && (
              <p className="mt-1 text-sm">
                שוכר:{' '}
                {unit.tenant_id ? (
                  <EntityLinkButton onClick={() => void openTenantById(unit.tenant_id!)}>{unit.tenant_name}</EntityLinkButton>
                ) : (
                  unit.tenant_name
                )}
              </p>
            )}
            {unit.monthly_rent && (
              <p className="mt-2 text-lg font-bold text-primary">{formatCurrency(unit.monthly_rent)}</p>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={(e) => {
                      e.stopPropagation();
                      setEditingUnit(unit);
                    }}
            >
              <Pencil className="h-4 w-4" />
              עריכה
            </Button>
          </div>
        ))}
      </div>

      <UnitFormModal
        open={Boolean(editingUnit)}
        onClose={() => setEditingUnit(null)}
        onSubmit={handleUnitUpdate}
        title={editingUnit ? `עריכת יחידה ${editingUnit.unit_number}` : 'עריכת יחידה'}
        initial={
          editingUnit
            ? {
                unit_number: editingUnit.unit_number,
                unit_name: editingUnit.unit_name ?? '',
                area_sqm: editingUnit.area_sqm != null ? String(editingUnit.area_sqm) : '',
                monthly_rent: editingUnit.monthly_rent != null ? String(editingUnit.monthly_rent) : '',
                unit_status: editingUnit.unit_status,
                floor: '',
              }
            : undefined
        }
      />
    </div>
  );
}
