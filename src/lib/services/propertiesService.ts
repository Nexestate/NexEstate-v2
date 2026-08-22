import { DEMO_PROPERTIES, getDemoProperty, DEMO_LEASES } from '../../data/demoData';
import type { PropertyUnit, PropertyWithUnits } from '../../types/domain';
import { isDemoMode, requireSupabase, ServiceError, throwIfError } from './serviceHelpers';

type LeaseLink = { id: string; tenant_id: string; tenant_name: string };

function mapUnitRow(u: Record<string, unknown>): PropertyUnit {
  return {
    id: u.id as string,
    property_id: u.property_id as string,
    unit_number: u.unit_number as string,
    unit_name: (u.unit_name as string | null) ?? undefined,
    area_sqm: (u.area_sqm as number | null) ?? undefined,
    monthly_rent: (u.monthly_rent as number | null) ?? undefined,
    unit_status: u.unit_status as PropertyUnit['unit_status'],
  };
}

function demoLeasesByUnit(propertyId: string): Map<string, LeaseLink> {
  const map = new Map<string, LeaseLink>();
  for (const lease of DEMO_LEASES) {
    if (lease.property_id === propertyId && lease.is_active && lease.unit_id) {
      map.set(lease.unit_id, {
        id: lease.id,
        tenant_id: lease.tenant_id,
        tenant_name: lease.tenant_name,
      });
    }
  }
  return map;
}

function enrichUnitsWithLeases(
  units: PropertyUnit[],
  leasesByUnit: Map<string, LeaseLink>,
): PropertyUnit[] {
  return units.map((unit) => {
    const lease = leasesByUnit.get(unit.id);
    if (!lease) return unit;
    return {
      ...unit,
      tenant_id: lease.tenant_id,
      tenant_name: lease.tenant_name || unit.tenant_name,
      lease_id: lease.id,
    };
  });
}

async function fetchLeasesByUnitForProperties(
  propertyIds: string[],
): Promise<Map<string, Map<string, LeaseLink>>> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('leases')
    .select('id, property_id, unit_id, tenant_id, tenants(full_name)')
    .in('property_id', propertyIds)
    .eq('is_active', true);
  throwIfError(error);

  const byProperty = new Map<string, Map<string, LeaseLink>>();
  for (const row of data ?? []) {
    if (!row.unit_id) continue;
    const propertyId = row.property_id as string;
    if (!byProperty.has(propertyId)) byProperty.set(propertyId, new Map());
    byProperty.get(propertyId)!.set(row.unit_id as string, {
      id: row.id as string,
      tenant_id: row.tenant_id as string,
      tenant_name: (row.tenants as { full_name?: string } | null)?.full_name ?? '',
    });
  }
  return byProperty;
}

function mapProperty(row: unknown, units: PropertyWithUnits['units']): PropertyWithUnits {
  const data = row as Record<string, unknown>;
  const occupied = units.filter((u) => u.unit_status === 'occupied').length;
  const income = units
    .filter((u) => u.unit_status === 'occupied')
    .reduce((sum, u) => sum + (u.monthly_rent ?? 0), 0);

  return {
    id: data.id as string,
    title: data.title as string,
    address: data.address as string,
    city: data.city as string,
    kind: data.kind as string,
    status: data.status as string,
    price: data.price as number | undefined,
    area_sqm: data.area_sqm as number | undefined,
    broker_id: data.broker_id as string | undefined,
    created_at: data.created_at as string | undefined,
    units,
    totalUnits: units.length,
    occupiedUnits: occupied,
    monthlyIncome: income,
  };
}

export async function fetchProperties(brokerId?: string): Promise<PropertyWithUnits[]> {
  if (isDemoMode()) {
    return DEMO_PROPERTIES.map((prop) =>
      mapProperty(
        prop,
        enrichUnitsWithLeases(prop.units, demoLeasesByUnit(prop.id)),
      ),
    );
  }

  const client = requireSupabase();
  let query = client.from('properties').select('*').order('created_at', { ascending: false });
  if (brokerId) query = query.eq('broker_id', brokerId);

  const { data: properties, error } = await query;
  throwIfError(error);
  if (!properties?.length) return [];

  const propertyIds = properties.map((p) => p.id as string);
  const leasesByProperty = await fetchLeasesByUnitForProperties(propertyIds);

  const result: PropertyWithUnits[] = [];
  for (const prop of properties) {
    const { data: units, error: unitsError } = await client
      .from('property_units')
      .select('*')
      .eq('property_id', prop.id)
      .order('unit_number');
    throwIfError(unitsError);

    const propId = prop.id as string;
    const mappedUnits = enrichUnitsWithLeases(
      (units ?? []).map(mapUnitRow),
      leasesByProperty.get(propId) ?? new Map(),
    );

    result.push(mapProperty(prop, mappedUnits));
  }

  return result;
}

export async function fetchProperty(id: string): Promise<PropertyWithUnits | undefined> {
  if (isDemoMode()) {
    const prop = getDemoProperty(id);
    if (!prop) return undefined;
    return mapProperty(prop, enrichUnitsWithLeases(prop.units, demoLeasesByUnit(prop.id)));
  }

  const client = requireSupabase();
  const { data: prop, error } = await client.from('properties').select('*').eq('id', id).single();
  throwIfError(error);
  if (!prop) return undefined;

  const { data: units, error: unitsError } = await client
    .from('property_units')
    .select('*')
    .eq('property_id', id)
    .order('unit_number');
  throwIfError(unitsError);

  const leasesByProperty = await fetchLeasesByUnitForProperties([id]);
  const mappedUnits = enrichUnitsWithLeases(
    (units ?? []).map(mapUnitRow),
    leasesByProperty.get(id) ?? new Map(),
  );

  return mapProperty(prop, mappedUnits);
}

export type PropertyInsert = {
  title: string;
  kind: string;
  status: string;
  visibility: string;
  price: number;
  city: string;
  address: string;
  rooms?: number | null;
  bathrooms?: number | null;
  area_sqm?: number | null;
  floor?: number | null;
  total_floors?: number | null;
  parking_spots?: number | null;
  year_built?: number | null;
  lat?: number | null;
  lng?: number | null;
  description?: string | null;
  featured?: boolean;
  broker_id: string;
};

export async function createProperty(payload: PropertyInsert): Promise<string> {
  if (isDemoMode()) {
    const id = `prop-${Date.now()}`;
    DEMO_PROPERTIES.unshift({
      id,
      title: payload.title,
      address: payload.address,
      city: payload.city,
      kind: payload.kind,
      status: payload.status,
      price: payload.price,
      area_sqm: payload.area_sqm ?? undefined,
      broker_id: payload.broker_id,
      units: [],
      totalUnits: 0,
      occupiedUnits: 0,
      monthlyIncome: 0,
    });
    return id;
  }

  const client = requireSupabase();
  const { data, error } = await client.from('properties').insert(payload).select('id').single();
  throwIfError(error);
  if (!data) throw new ServiceError('Property insert returned no data');
  return data.id as string;
}

export async function updateProperty(id: string, payload: Partial<PropertyInsert>): Promise<void> {
  if (isDemoMode()) {
    const p = DEMO_PROPERTIES.find((x) => x.id === id);
    if (p) Object.assign(p, payload);
    return;
  }
  const client = requireSupabase();
  const { error } = await client.from('properties').update(payload).eq('id', id);
  throwIfError(error);
}
