import { ArrowRight, Building2, MapPin, Pencil, Plus, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ManagedUnitsTable } from '../../components/broker/ManagedUnitsTable';
import { PropertyTenantsSection } from '../../components/broker/PropertyTenantsSection';
import { PropertySubNav } from '../../components/broker/PropertySubNav';
import { PropertyUnitCards } from '../../components/broker/PropertyUnitCards';
import {
  ActivityPanel,
  AttentionList,
  MaintenancePanel,
  OverviewFacts,
} from '../../components/property/PropertyWorkspacePanels';
import {
  PropertyFormModal,
  propertyFormToPayload,
  type PropertyFormValues,
} from '../../components/property/PropertyFormModal';
import { SharePropertyModal } from '../../components/property/SharePropertyModal';
import { UnitOnboardingModal } from '../../components/broker/UnitOnboardingModal';
import { UnitFormModal, type UnitFormValues } from '../../components/property/UnitFormModal';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { PageSkeleton } from '../../components/ui/Skeleton';
import { notifyEntityCreated } from '../../contexts/QuickAddContext';
import { useAuth } from '../../contexts/AuthContext';
import { useEntityCreated } from '../../hooks/useEntityCreated';
import { usePropertyWorkspace } from '../../hooks/usePropertyWorkspace';
import type { WorkspaceTab } from '../../lib/propertyWorkspace';
import {
  attachTenantToUnit,
  fetchTenants,
  saveUnitOnboarding,
  updateProperty,
  updateUnit,
} from '../../lib/services';
import { supabase } from '../../lib/supabase';
import type { PropertyKind, PropertyStatus, PropertyVisibility } from '../../types';
import type { PropertyUnit, Tenant } from '../../types/domain';

const WORKSPACE_TABS: WorkspaceTab[] = ['activity', 'maintenance'];

export function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab =
    tabParam === 'tenants'
      ? 'tenants'
      : WORKSPACE_TABS.includes(tabParam as WorkspaceTab)
        ? (tabParam as WorkspaceTab)
        : 'overview';

  useEffect(() => {
    if (!id || !tabParam) return;
    if (tabParam === 'documents') navigate(`/broker/properties/${id}?tab=tenants&attention=docs`, { replace: true });
    if (tabParam === 'agreements') navigate(`/broker/agreements?property=${id}`, { replace: true });
    if (tabParam === 'payments') navigate(`/broker/payments?property=${id}`, { replace: true });
  }, [tabParam, id, navigate]);
  const { user } = useAuth();
  const { toast } = useToast();
  const { property, tenants, leases, snapshot, actions, activity, loading, loadError, reload } =
    usePropertyWorkspace(id);
  const [shareOpen, setShareOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editInitial, setEditInitial] = useState<Partial<PropertyFormValues> | undefined>();
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<PropertyUnit | null>(null);
  const [unitPickerTenants, setUnitPickerTenants] = useState<Tenant[]>([]);

  useEntityCreated(['unit', 'tenant', 'lease', 'agreement'], reload);

  useEffect(() => {
    if (!editingUnit || !user?.id) {
      setUnitPickerTenants([]);
      return;
    }
    void fetchTenants(user.id).then(setUnitPickerTenants);
  }, [editingUnit, user?.id]);

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
    reload();
  };

  const handleUnitSubmit = async (values: UnitFormValues) => {
    if (!id || !user) throw new Error('not auth');
    if (!editingUnit) return;
    const unit_status = values.tenant_id ? 'occupied' : values.unit_status;
    await updateUnit(editingUnit.id, {
      unit_number: values.unit_number.trim(),
      unit_name: values.unit_name.trim() || undefined,
      area_sqm: values.area_sqm ? Number(values.area_sqm) : undefined,
      monthly_rent: values.monthly_rent ? Number(values.monthly_rent) : undefined,
      unit_status,
      floor: values.floor ? Number(values.floor) : undefined,
    });

    const needsAttach =
      Boolean(values.tenant_id) &&
      values.tenant_id !== editingUnit.tenant_id &&
      !editingUnit.lease_id;

    if (needsAttach) {
      const tenant = unitPickerTenants.find((t) => t.id === values.tenant_id);
      if (tenant) {
        const start = new Date();
        const end = new Date(start);
        end.setFullYear(end.getFullYear() + 1);
        await attachTenantToUnit(user.id, {
          property_id: id,
          unit_id: editingUnit.id,
          tenant_id: tenant.id,
          tenant_name: tenant.full_name,
          start_date: start.toISOString().slice(0, 10),
          end_date: end.toISOString().slice(0, 10),
          monthly_rent: values.monthly_rent ? Number(values.monthly_rent) : editingUnit.monthly_rent ?? 0,
        });
      }
    }

    setUnitModalOpen(false);
    setEditingUnit(null);
    reload();
  };

  if (loading) return <PageSkeleton cards={4} />;
  if (!property || !snapshot) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">{loadError ?? 'נכס לא נמצא'}</p>
        <p className="text-meta mt-2">ייתכן שאין הרשאה לצפות בנכס או שהקישור לא תקין.</p>
        <Link to="/broker/properties" className="mt-4 inline-block text-primary hover:underline">
          חזרה לנכסים
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <Link
        to="/broker/properties"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowRight className="h-4 w-4" />
        חזרה לנכסים
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Building2 className="h-7 w-7" />
          </span>
          <div>
            <h2 className="text-display">{property.title}</h2>
            <p className="text-meta mt-1 flex items-center gap-1">
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
          {tab === 'overview' && (
            <Button onClick={() => setShareOpen(true)}>
              <Share2 className="h-4 w-4" />
              שתף נכס
            </Button>
          )}
        </div>
      </div>

      <PropertySubNav propertyId={property.id} />

      {tab === 'overview' && (
        <div className="space-y-8">
          <AttentionList actions={actions} propertyId={property.id} />
          <OverviewFacts property={property} tenants={tenants} leases={leases} snapshot={snapshot} />
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>יחידות בנכס</CardTitle>
              <Button size="sm" onClick={() => { setEditingUnit(null); setUnitModalOpen(true); }}>
                <Plus className="h-4 w-4" />
                יחידה חדשה
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <PropertyUnitCards units={property.units} />
              <ManagedUnitsTable
                propertyId={property.id}
                units={property.units}
                onEdit={(unit) => {
                  setEditingUnit(unit);
                  setUnitModalOpen(true);
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'tenants' && id && <PropertyTenantsSection propertyId={id} />}

      {tab === 'activity' && <ActivityPanel items={activity} />}
      {tab === 'maintenance' && (
        <MaintenancePanel count={snapshot.maintenanceUnits} propertyId={property.id} />
      )}

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

      <UnitOnboardingModal
        open={unitModalOpen && !editingUnit}
        onClose={() => setUnitModalOpen(false)}
        propertyId={id}
        brokerId={user?.id ?? ''}
        onSubmit={async (payload) => {
          if (!user || !id) throw new Error('not auth');
          await saveUnitOnboarding(user.id, payload);
          if (payload.occupancy === 'new_tenant') notifyEntityCreated('tenant');
          if (payload.occupancy !== 'vacant') notifyEntityCreated('lease');
          notifyEntityCreated('unit');
          toast({ variant: 'success', title: 'היחידה נשמרה בהצלחה' });
          setUnitModalOpen(false);
          reload();
        }}
      />

      <UnitFormModal
        open={Boolean(editingUnit)}
        onClose={() => {
          setUnitModalOpen(false);
          setEditingUnit(null);
        }}
        onSubmit={handleUnitSubmit}
        title={editingUnit ? `עריכת יחידה ${editingUnit.unit_number}` : 'עריכת יחידה'}
        propertyId={id}
        tenants={unitPickerTenants.map((t) => ({
          id: t.id,
          full_name: t.full_name,
          company_name: t.company_name,
        }))}
        initial={
          editingUnit
            ? {
                unit_number: editingUnit.unit_number,
                unit_name: editingUnit.unit_name ?? '',
                area_sqm: editingUnit.area_sqm != null ? String(editingUnit.area_sqm) : '',
                monthly_rent: editingUnit.monthly_rent != null ? String(editingUnit.monthly_rent) : '',
                unit_status: editingUnit.unit_status,
                floor: editingUnit.floor != null ? String(editingUnit.floor) : '',
                tenant_id: editingUnit.tenant_id ?? '',
              }
            : undefined
        }
      />
    </div>
  );
}
