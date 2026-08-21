import { Building2, ChevronDown, ChevronUp, Layers, MapPin, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { FilterBar } from '../../components/ui/FilterBar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import {
  PropertyFormModal,
  propertyFormToPayload,
  type PropertyFormValues,
} from '../../components/property/PropertyFormModal';
import { useAuth } from '../../contexts/AuthContext';
import { createProperty, fetchProperties } from '../../lib/services';
import { formatCurrency, getOccupancyPercent } from '../../lib/utils';
import type { PropertyWithUnits } from '../../types/domain';
import { UNIT_STATUS_LABELS } from '../../types/domain';

const STATUS_VARIANT: Record<string, 'success' | 'primary' | 'warning' | 'outline'> = {
  occupied: 'success',
  available: 'primary',
  maintenance: 'warning',
  reserved: 'outline',
};

export function PropertiesPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<PropertyWithUnits[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const load = () => {
    setLoading(true);
    fetchProperties(user?.id).then((data) => {
      setProperties(data);
      if (data.length) setExpanded(data[0].id);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleCreate = async (values: PropertyFormValues) => {
    if (!user) throw new Error('not auth');
    await createProperty(propertyFormToPayload(values, user.id));
    load();
  };

  const filtered = properties.filter(
    (p) =>
      p.title.includes(search) ||
      p.city.includes(search) ||
      p.address.includes(search),
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
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">נכסים מנוהלים</h2>
          <p className="text-sm text-muted-foreground">ניהול נכסים ויחידות</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="primary">{properties.length} נכסים</Badge>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            נכס חדש
          </Button>
        </div>
      </div>

      <FilterBar search={search} onSearchChange={setSearch} placeholder="חיפוש נכס..." />

      <div className="space-y-4">
        {filtered.map((property) => {
          const isOpen = expanded === property.id;
          const occupancy = getOccupancyPercent(property.occupiedUnits, property.totalUnits);

          return (
            <Card key={property.id}>
              <CardHeader
                className="cursor-pointer"
                onClick={() => setExpanded(isOpen ? null : property.id)}
              >
                <div className="flex items-center gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Building2 className="h-6 w-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base">{property.title}</CardTitle>
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {property.address}, {property.city}
                    </p>
                  </div>
                  <div className="hidden items-center gap-4 sm:flex">
                    <div className="text-end">
                      <p className="text-xs text-muted-foreground">תפוסה</p>
                      <p className="font-bold text-success">{occupancy}%</p>
                    </div>
                    <div className="text-end">
                      <p className="text-xs text-muted-foreground">הכנסה חודשית</p>
                      <p className="font-bold">{formatCurrency(property.monthlyIncome)}</p>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Layers className="h-4 w-4" />
                      {property.occupiedUnits}/{property.totalUnits}
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>

              {isOpen && (
                <CardContent className="border-t border-border pt-4">
                  <div className="mb-4 flex flex-wrap gap-3 sm:hidden">
                    <Badge variant="success">תפוסה {occupancy}%</Badge>
                    <Badge variant="primary">{formatCurrency(property.monthlyIncome)}/חודש</Badge>
                    <Badge variant="outline">{property.occupiedUnits}/{property.totalUnits} יחידות</Badge>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>יחידה</TableHead>
                        <TableHead>שם</TableHead>
                        <TableHead>שטח</TableHead>
                        <TableHead>שכ&quot;ד</TableHead>
                        <TableHead>סטטוס</TableHead>
                        <TableHead>שוכר</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {property.units.map((unit) => (
                        <TableRow key={unit.id}>
                          <TableCell className="font-medium">{unit.unit_number}</TableCell>
                          <TableCell>{unit.unit_name ?? '—'}</TableCell>
                          <TableCell>{unit.area_sqm ? `${unit.area_sqm} מ"ר` : '—'}</TableCell>
                          <TableCell>
                            {unit.monthly_rent ? formatCurrency(unit.monthly_rent) : '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={STATUS_VARIANT[unit.unit_status] ?? 'outline'}>
                              {UNIT_STATUS_LABELS[unit.unit_status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {unit.tenant_name ?? '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="mt-4 text-end">
                    <Link to={`/broker/properties/${property.id}`} className="text-sm text-primary hover:underline">
                      פרטי נכס מלאים ←
                    </Link>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <PropertyFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
