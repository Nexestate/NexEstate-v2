import { ArrowRight, Building2, MapPin, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/PageLoader';
import { fetchLeases, fetchUnit } from '../../lib/services';
import { formatCurrency, formatDate } from '../../lib/utils';
import type { Lease, PropertyUnit } from '../../types/domain';
import { UNIT_STATUS_LABELS, UNIT_TYPE_LABELS } from '../../types/domain';

const STATUS_VARIANT: Record<string, 'success' | 'primary' | 'warning' | 'outline'> = {
  occupied: 'success',
  available: 'primary',
  maintenance: 'warning',
  reserved: 'outline',
};

type UnitDetail = PropertyUnit & {
  property_title?: string;
  property_city?: string;
  property_address?: string;
};

export function UnitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [unit, setUnit] = useState<UnitDetail | null>(null);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([fetchUnit(id), fetchLeases()]).then(([u, allLeases]) => {
      setUnit(u ?? null);
      setLeases(allLeases.filter((l) => l.unit_id === id));
      setLoading(false);
    });
  }, [id]);

  if (loading) return <PageLoader />;
  if (!unit) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">יחידה לא נמצאה</p>
        <Link to="/broker/units" className="mt-4 inline-block text-primary hover:underline">
          חזרה ליחידות
        </Link>
      </div>
    );
  }

  const activeLease = leases.find((l) => l.is_active);

  return (
    <div className="space-y-6">
      <Link to="/broker/units" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowRight className="h-4 w-4" />
        חזרה ליחידות
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">יחידה #{unit.unit_number}</h2>
          <p className="text-lg text-muted-foreground">{unit.unit_name || 'ללא שם'}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant={STATUS_VARIANT[unit.unit_status] ?? 'outline'}>
              {UNIT_STATUS_LABELS[unit.unit_status]}
            </Badge>
            {unit.unit_type && <Badge variant="outline">{UNIT_TYPE_LABELS[unit.unit_type]}</Badge>}
          </div>
        </div>
        <p className="text-2xl font-bold text-primary">
          {unit.monthly_rent ? formatCurrency(unit.monthly_rent) : '—'}
          <span className="text-sm font-normal text-muted-foreground"> / חודש</span>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="space-y-2 py-4">
            <p className="text-xs text-muted-foreground">נכס</p>
            <Link to={`/broker/properties/${unit.property_id}`} className="flex items-center gap-2 font-medium text-primary hover:underline">
              <Building2 className="h-4 w-4" />
              {unit.property_title || 'פרטי נכס'}
            </Link>
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {[unit.property_address, unit.property_city].filter(Boolean).join(', ') || '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 py-4">
            <p className="text-xs text-muted-foreground">שוכר</p>
            {unit.tenant_id ? (
              <Link to={`/broker/tenants/${unit.tenant_id}`} className="flex items-center gap-2 font-medium text-primary hover:underline">
                <User className="h-4 w-4" />
                {unit.tenant_name}
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">פנויה</p>
            )}
            <p className="text-sm text-muted-foreground">
              קומה {unit.floor ?? '—'} • {unit.area_sqm ? `${unit.area_sqm} מ"ר` : 'ללא שטח'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 py-4">
            <p className="text-xs text-muted-foreground">חוזה פעיל</p>
            {activeLease ? (
              <Link to={`/broker/leases/${activeLease.id}`} className="font-medium text-primary hover:underline">
                {formatDate(activeLease.start_date)} – {formatDate(activeLease.end_date)}
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">אין חוזה פעיל</p>
            )}
          </CardContent>
        </Card>
      </div>

      {(unit.notes || unit.description) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">פרטים נוספים</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {unit.description || unit.notes}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
