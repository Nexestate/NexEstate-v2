import { ArrowRight, Building2, MapPin, Pencil, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  PropertyFormModal,
  propertyFormToPayload,
  type PropertyFormValues,
} from '../../components/property/PropertyFormModal';
import { SharePropertyModal } from '../../components/property/SharePropertyModal';
import { PageLoader } from '../../components/ui/PageLoader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">יחידות ({property.units.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
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
                  <TableCell>{unit.monthly_rent ? formatCurrency(unit.monthly_rent) : '—'}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[unit.unit_status] ?? 'outline'}>
                      {UNIT_STATUS_LABELS[unit.unit_status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{unit.tenant_name ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
    </div>
  );
}
