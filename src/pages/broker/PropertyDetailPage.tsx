import { ArrowRight, Building2, MapPin, Pencil, Plus, Share2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ManagedUnitsTable } from '../../components/broker/ManagedUnitsTable';
import {
  PropertyFormModal,
  propertyFormToPayload,
  type PropertyFormValues,
} from '../../components/property/PropertyFormModal';
import { SharePropertyModal } from '../../components/property/SharePropertyModal';
import { UnitFormModal, type UnitFormValues } from '../../components/property/UnitFormModal';
import { PageLoader } from '../../components/ui/PageLoader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { notifyEntityCreated } from '../../contexts/QuickAddContext';
import { useAuth } from '../../contexts/AuthContext';
import { useEntityCreated } from '../../hooks/useEntityCreated';
import { createUnit, fetchProperty, updateProperty, updateUnit } from '../../lib/services';
import { supabase } from '../../lib/supabase';
import { formatCurrency, getOccupancyPercent } from '../../lib/utils';
import type { PropertyKind, PropertyStatus, PropertyVisibility } from '../../types';
import type { PropertyUnit, PropertyWithUnits } from '../../types/domain';

export function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [property, setProperty] = useState<PropertyWithUnits | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editInitial, setEditInitial] = useState<Partial<PropertyFormValues> | undefined>();
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<PropertyUnit | null>(null);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    fetchProperty(id).then((p) => {
      setProperty(p ?? null);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEntityCreated(['unit', 'tenant', 'lease'], load);

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
    const rest: Partial<typeof payload> = { ...payload };
    delete rest.broker_id;
    await updateProperty(id, rest);
    load();
  };

  const openUnitCreate = () => {
    setEditingUnit(null);
    setUnitModalOpen(true);
  };

  const openUnitEdit = (unit: PropertyUnit) => {
    setEditingUnit(unit);
    setUnitModalOpen(true);
  };

  const handleUnitSubmit = async (values: UnitFormValues) => {
    if (!id || !user) throw new Error('not auth');
    const payload = {
      unit_number: values.unit_number.trim(),
      unit_name: values.unit_name.trim() || undefined,
      area_sqm: values.area_sqm ? Number(values.area_sqm) : undefined,
      monthly_rent: values.monthly_rent ? Number(values.monthly_rent) : undefined,
      unit_status: values.unit_status,
      floor: values.floor ? Number(values.floor) : undefined,
    };

    if (editingUnit) {
      await updateUnit(editingUnit.id, payload);
    } else {
      await createUnit({ ...payload, property_id: id, broker_id: user.id });
      notifyEntityCreated('unit');
    }
    setUnitModalOpen(false);
    setEditingUnit(null);
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

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'תפוסה', value: `${occupancy}%`, variant: 'success' as const },
          { label: 'הכנסה חודשית', value: formatCurrency(property.monthlyIncome), variant: 'primary' as const },
          { label: 'יחידות', value: `${property.occupiedUnits}/${property.totalUnits}`, variant: 'outline' as const },
          { label: 'שטח', value: property.area_sqm ? `${property.area_sqm} מ"ר` : '—', variant: 'outline' as const },
        ].map(({ label, value, variant }) => (
          <Card key={label}>
            <CardContent className="py-4 text-center">
              <Badge variant={variant} className="mb-2">{label}</Badge>
              <p className="text-xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          to={`/broker/units?property=${property.id}`}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-4 text-sm font-medium hover:bg-muted"
        >
          כל היחידות
        </Link>
        <Link
          to={`/broker/tenants?property=${property.id}`}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-4 text-sm font-medium hover:bg-muted"
        >
          שוכרים
        </Link>
        <Link
          to={`/broker/leases?property=${property.id}`}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-4 text-sm font-medium hover:bg-muted"
        >
          חוזים
        </Link>
        <Link
          to={`/broker/payments?property=${property.id}`}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-4 text-sm font-medium hover:bg-muted"
        >
          תשלומים
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">יחידות ({property.units.length})</CardTitle>
          <Button size="sm" onClick={openUnitCreate}>
            <Plus className="h-4 w-4" />
            יחידה חדשה
          </Button>
        </CardHeader>
        <CardContent>
          <ManagedUnitsTable
            propertyId={property.id}
            units={property.units}
            onEdit={openUnitEdit}
          />
        </CardContent>
      </Card>

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

      <UnitFormModal
        open={unitModalOpen}
        onClose={() => {
          setUnitModalOpen(false);
          setEditingUnit(null);
        }}
        onSubmit={handleUnitSubmit}
        title={editingUnit ? `עריכת יחידה ${editingUnit.unit_number}` : 'יחידה חדשה'}
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
