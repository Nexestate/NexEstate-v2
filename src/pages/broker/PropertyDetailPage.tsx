import { ArrowRight, Building2, MapPin, Pencil, Plus, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuickAdd } from '../../contexts/QuickAddContext';
import {
  PropertyFormModal,
  propertyFormToPayload,
  type PropertyFormValues,
} from '../../components/property/PropertyFormModal';
import { PropertySharesPanel } from '../../components/property/PropertySharesPanel';
import { SharePropertyModal } from '../../components/property/SharePropertyModal';
import { PageLoader } from '../../components/ui/PageLoader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { fetchProperty, updateProperty } from '../../lib/services';
import { supabase } from '../../lib/supabase';
import { formatCurrency, getOccupancyPercent } from '../../lib/utils';
import type { PropertyKind, PropertyStatus, PropertyVisibility } from '../../types';
import type { PropertyWithUnits } from '../../types/domain';
import { UNIT_STATUS_LABELS } from '../../types/domain';

const STATUS_VARIANT: Record<string, 'success' | 'primary' | 'warning' | 'outline'> = {
  occupied: 'success',
  available: 'primary',
  maintenance: 'warning',
  reserved: 'outline',
};

export function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { openQuickAdd } = useQuickAdd();
  const navigate = useNavigate();
  const [property, setProperty] = useState<PropertyWithUnits | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editInitial, setEditInitial] = useState<Partial<PropertyFormValues> | undefined>();

  const load = () => {
    if (!id) return;
    setLoading(true);
    fetchProperty(id).then((p) => {
      setProperty(p ?? null);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const openEdit = async () => {
    if (!id || !property) return;
    let initial: Partial<PropertyFormValues> = {
      title: property.title,
      kind: (property.kind as PropertyKind) || 'apartment',
      status: (property.status as PropertyStatus) || 'for_sale',
      price: property.price != null ? String(property.price) : '',
      city: property.city,
      address: property.address,
      area_sqm: property.area_sqm != null ? String(property.area_sqm) : '',
    };

    if (supabase) {
      const { data } = await supabase.from('properties').select('*').eq('id', id).maybeSingle();
      if (data) {
        initial = {
          title: data.title ?? '',
          kind: (data.kind as PropertyKind) || 'apartment',
          status: (data.status as PropertyStatus) || 'for_sale',
          visibility: (data.visibility as PropertyVisibility) || 'private',
          price: data.price != null ? String(data.price) : '',
          city: data.city ?? '',
          address: data.address ?? '',
          rooms: data.rooms != null ? String(data.rooms) : '',
          bathrooms: data.bathrooms != null ? String(data.bathrooms) : '',
          area_sqm: data.area_sqm != null ? String(data.area_sqm) : '',
          floor: data.floor != null ? String(data.floor) : '',
          total_floors: data.total_floors != null ? String(data.total_floors) : '',
          parking_spots: data.parking_spots != null ? String(data.parking_spots) : '',
          year_built: data.year_built != null ? String(data.year_built) : '',
          lat: data.lat != null ? String(data.lat) : '',
          lng: data.lng != null ? String(data.lng) : '',
          description: data.description ?? '',
          featured: Boolean(data.featured),
        };
      }
    }

    setEditInitial(initial);
    setEditOpen(true);
  };

  const handleEdit = async (values: PropertyFormValues) => {
    if (!user || !id) throw new Error('not auth');
    const payload = propertyFormToPayload(values, user.id);
    const { broker_id: _broker, ...rest } = payload;
    await updateProperty(id, rest);
    load();
  };

  if (loading) return <PageLoader />;
  if (!property) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">נכס לא נמצא</p>
        <Link to="/broker/properties" className="mt-4 text-primary hover:underline">
          חזרה לנכסים
        </Link>
      </div>
    );
  }

  const occupancy = getOccupancyPercent(property.occupiedUnits, property.totalUnits);

  return (
    <div className="space-y-6">
      <Link to="/broker/properties" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowRight className="h-4 w-4" />
        חזרה לנכסים
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Building2 className="h-7 w-7" />
          </span>
          <div>
            <h2 className="text-2xl font-bold">{property.title}</h2>
            <p className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {property.address}, {property.city}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void openEdit()}>
            <Pencil className="h-4 w-4" />
            עריכה
          </Button>
          <Button onClick={() => setShareOpen(true)}>
            <Share2 className="h-4 w-4" />
            שתף נכס
          </Button>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-6">
        {[
          { label: 'הכנסה שנתית', value: formatCurrency(property.monthlyIncome * 12) },
          { label: 'ממוצע ליחידה', value: formatCurrency(property.occupiedUnits ? property.monthlyIncome / property.occupiedUnits : 0) },
          { label: 'הכנסה חודשית', value: formatCurrency(property.monthlyIncome) },
          { label: 'תפוסה', value: `${occupancy}%` },
          { label: 'שוכרים', value: String(property.occupiedUnits) },
          { label: 'יחידות', value: String(property.totalUnits) },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="py-4 text-center">
              <p className="text-lg font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">יחידות בנכס</h3>
        <Button size="sm" onClick={() => openQuickAdd('unit', { propertyId: property.id })}>
          <Plus className="h-4 w-4" />
          יחידה חדשה
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {property.units.map((unit) => (
          <button
            key={unit.id}
            type="button"
            onClick={() => navigate(`/broker/units/${unit.id}`)}
            className="rounded-xl border border-border bg-card p-4 text-start transition-colors hover:border-primary/50 hover:bg-muted/30"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">יחידה #{unit.unit_number}</p>
                <p className="text-sm text-muted-foreground">{unit.unit_name || unit.tenant_name || '—'}</p>
              </div>
              <Badge variant={STATUS_VARIANT[unit.unit_status] ?? 'outline'}>
                {unit.unit_status === 'occupied' ? 'מושכרת' : UNIT_STATUS_LABELS[unit.unit_status]}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              קומה {unit.floor ?? '—'} • {unit.area_sqm ? `${unit.area_sqm} מ"ר` : 'ללא שטח'}
            </p>
            <div className="mt-3 flex items-end justify-between">
              <p className="text-lg font-bold text-primary">
                {unit.monthly_rent ? formatCurrency(unit.monthly_rent) : '₪0'}
              </p>
              <p className="text-xs text-muted-foreground">שכירות חודשית</p>
            </div>
          </button>
        ))}
      </div>

      <PropertySharesPanel propertyId={property.id} onInvite={() => setShareOpen(true)} />

      <SharePropertyModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        propertyId={property.id}
        propertyTitle={property.title}
      />

      <PropertyFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEdit}
        initial={editInitial}
        title="עריכת נכס"
      />
    </div>
  );
}
