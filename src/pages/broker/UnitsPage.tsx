import { Building2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { FilterBar } from '../../components/ui/FilterBar';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { useAuth } from '../../contexts/AuthContext';
import { useQuickAdd } from '../../contexts/QuickAddContext';
import { fetchManagedPropertySidebar } from '../../lib/services';
import { formatCurrency } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Plus } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  vacant: 'פנויה',
  occupied: 'תפוסה',
  maintenance: 'תחזוקה',
};

export function UnitsPage() {
  const { user } = useAuth();
  const { openQuickAdd } = useQuickAdd();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [units, setUnits] = useState<
    Array<{
      id: string;
      propertyId: string;
      propertyTitle: string;
      unit_number: string;
      unit_name?: string;
      unit_status: string;
      area_sqm?: number;
      monthly_rent?: number;
      floor?: number;
    }>
  >([]);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    fetchManagedPropertySidebar(user.id).then(({ properties }) => {
      const flat = properties.flatMap((p) =>
        p.units.map((u) => ({
          id: u.id,
          propertyId: p.id,
          propertyTitle: p.title,
          unit_number: u.unit_number,
          unit_name: u.unit_name,
          unit_status: u.unit_status,
          area_sqm: u.area_sqm,
          monthly_rent: u.monthly_rent,
        })),
      );
      setUnits(flat);
      setLoading(false);
    });
  }, [user?.id]);

  const filtered = useMemo(
    () =>
      units.filter(
        (u) =>
          u.unit_number.includes(search) ||
          (u.unit_name?.includes(search) ?? false) ||
          u.propertyTitle.includes(search),
      ),
    [units, search],
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader title="יחידות" description="כל היחידות בנכסים המנוהלים" />
        <Button size="sm" onClick={() => openQuickAdd('property')}>
          <Plus className="h-4 w-4" />
          יחידה חדשה
        </Button>
      </div>

      <FilterBar search={search} onSearchChange={setSearch} placeholder="חיפוש יחידות..." />

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>מספר</TableHead>
              <TableHead>שם</TableHead>
              <TableHead>נכס</TableHead>
              <TableHead>סטטוס</TableHead>
              <TableHead>שטח</TableHead>
              <TableHead>שכ&quot;ד</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((unit) => (
              <TableRow key={unit.id}>
                <TableCell className="font-medium">{unit.unit_number}</TableCell>
                <TableCell>{unit.unit_name ?? '—'}</TableCell>
                <TableCell>
                  <Link to={`/broker/properties/${unit.propertyId}`} className="text-primary hover:underline">
                    {unit.propertyTitle}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={unit.unit_status === 'occupied' ? 'success' : 'outline'}>
                    {STATUS_LABELS[unit.unit_status] ?? unit.unit_status}
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
          <div key={unit.id} className="rounded-xl border border-border p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-medium">יחידה {unit.unit_number}</p>
              <Badge variant={unit.unit_status === 'occupied' ? 'success' : 'outline'}>
                {STATUS_LABELS[unit.unit_status] ?? unit.unit_status}
              </Badge>
            </div>
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              {unit.propertyTitle}
            </p>
            {unit.monthly_rent && (
              <p className="mt-2 text-lg font-bold text-primary">{formatCurrency(unit.monthly_rent)}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
