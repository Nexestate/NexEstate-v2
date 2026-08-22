import { DEMO_PROPERTIES, getDemoProperty } from '../../data/demoData';
import type { PropertyUnit, PropertyWithUnits } from '../../types/domain';
import { isDemoMode, requireSupabase, ServiceError, throwIfError } from './serviceHelpers';

type UnitRow = Record<string, unknown>;

function mapUnit(u: UnitRow): PropertyUnit {
  return {
    id: String(u.id),
    property_id: String(u.property_id),
    unit_number: String(u.unit_number ?? ''),
    unit_name: (u.unit_name as string | undefined) ?? undefined,
    unit_type: (u.unit_type as PropertyUnit['unit_type']) ?? undefined,
    area_sqm: u.area_sqm != null ? Number(u.area_sqm) : undefined,
    monthly_rent: u.monthly_rent != null ? Number(u.monthly_rent) : undefined,
    unit_status: (u.unit_status as PropertyUnit['unit_status']) ?? 'available',
    tenant_id: (u.tenant_id as string | undefined) ?? undefined,
    floor: u.floor != null ? Number(u.floor) : undefined,
    notes: (u.notes as string | undefined) ?? undefined,
    description: (u.description as string | undefined) ?? undefined,
  };
}

async function attachTenantsToUnits(
  units: PropertyUnit[],
): Promise<PropertyUnit[]> {
  if (!units.length || isDemoMode()) return units;
  const client = requireSupabase();
  const { data: leases } = await client
    .from('leases')
    .select('unit_id, tenant_id, is_active, tenants(full_name, company_name)')
    .in(
      'unit_id',
      units.map((u) => u.id),
    )
    .eq('is_active', true);

  const byUnit = new Map<string, { tenant_id?: string; tenant_name?: string }>();
  for (const lease of leases ?? []) {
    const unitId = lease.unit_id as string | undefined;
    if (!unitId || byUnit.has(unitId)) continue;
    const tenant = lease.tenants as { full_name?: string; company_name?: string } | null;
    byUnit.set(unitId, {
      tenant_id: (lease.tenant_id as string | undefined) ?? undefined,
      tenant_name: tenant?.company_name || tenant?.full_name,
    });
  }
  return units.map((u) => ({ ...u, ...byUnit.get(u.id) }));
}

function mapProperty(row: Record<string, unknown>, units: PropertyWithUnits['units']): PropertyWithUnits {
  const occupied = units.filter((u) => u.unit_status === 'occupied').length;
  const income = units
    .filter((u) => u.unit_status === 'occupied')
    .reduce((sum, u) => sum + (u.monthly_rent ?? 0), 0);

  return {
    id: row.id as string,
    title: row.title as string,
    address: row.address as string,
    city: row.city as string,
    kind: row.kind as string,
    status: row.status as string,
    price: row.price as number | undefined,
    area_sqm: row.area_sqm as number | undefined,
    broker_id: row.broker_id as string | undefined,
    created_at: row.created_at as string | undefined,
    units,
    totalUnits: units.length,
    occupiedUnits: occupied,
    monthlyIncome: income,
  };
}

export async function fetchProperties(brokerId?: string): Promise<PropertyWithUnits[]> {
  if (isDemoMode()) return DEMO_PROPERTIES;

  const client = requireSupabase();
  let query = client.from('properties').select('*').order('created_at', { ascending: false });
  if (brokerId) query = query.eq('broker_id', brokerId);

  const { data: properties, error } = await query;
  throwIfError(error);
  if (!properties?.length) return [];

  const result: PropertyWithUnits[] = [];
  for (const prop of properties) {
    const { data: units, error: unitsError } = await client
      .from('property_units')
      .select('*')
      .eq('property_id', prop.id)
      .order('unit_number');
    throwIfError(unitsError);

    const mappedUnits = await attachTenantsToUnits((units ?? []).map((u) => mapUnit(u as UnitRow)));
    result.push(mapProperty(prop, mappedUnits));
  }

  return result;
}

export async function fetchProperty(id: string): Promise<PropertyWithUnits | undefined> {
  if (isDemoMode()) return getDemoProperty(id);

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

  const mappedUnits = await attachTenantsToUnits((units ?? []).map((u) => mapUnit(u as UnitRow)));
  return mapProperty(prop, mappedUnits);
}

export async function fetchUnit(
  id: string,
): Promise<(PropertyUnit & { property_title?: string; property_city?: string; property_address?: string }) | undefined> {
  if (isDemoMode()) {
    for (const p of DEMO_PROPERTIES) {
      const unit = p.units.find((u) => u.id === id);
      if (unit) return { ...unit, property_title: p.title, property_city: p.city, property_address: p.address };
    }
    return undefined;
  }

  const client = requireSupabase();
  const { data, error } = await client.from('property_units').select('*').eq('id', id).maybeSingle();
  throwIfError(error);
  if (!data) return undefined;

  const [withTenant] = await attachTenantsToUnits([mapUnit(data as UnitRow)]);
  const { data: property } = await client
    .from('properties')
    .select('title, city, address')
    .eq('id', data.property_id)
    .maybeSingle();

  return {
    ...withTenant,
    property_title: property?.title,
    property_city: property?.city,
    property_address: property?.address,
  };
}

export type UnitInsert = {
  property_id: string;
  broker_id: string;
  unit_number: string;
  unit_name?: string;
  unit_type?: string;
  unit_status?: string;
  area_sqm?: number | null;
  monthly_rent?: number | null;
  floor?: number | null;
};

export async function createUnit(payload: UnitInsert): Promise<string> {
  if (isDemoMode()) {
    const id = `unit-${Date.now()}`;
    const property = DEMO_PROPERTIES.find((p) => p.id === payload.property_id);
    property?.units.push({
      id,
      property_id: payload.property_id,
      unit_number: payload.unit_number,
      unit_name: payload.unit_name,
      unit_status: (payload.unit_status as PropertyUnit['unit_status']) ?? 'available',
      area_sqm: payload.area_sqm ?? undefined,
      monthly_rent: payload.monthly_rent ?? undefined,
      floor: payload.floor ?? undefined,
    });
    if (property) {
      property.totalUnits = property.units.length;
    }
    return id;
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from('property_units')
    .insert({
      property_id: payload.property_id,
      broker_id: payload.broker_id,
      unit_number: payload.unit_number,
      unit_name: payload.unit_name ?? null,
      unit_type: payload.unit_type ?? 'office',
      unit_status: payload.unit_status ?? 'available',
      area_sqm: payload.area_sqm ?? null,
      monthly_rent: payload.monthly_rent ?? null,
      floor: payload.floor ?? null,
    })
    .select('id')
    .single();
  throwIfError(error);
  if (!data) throw new ServiceError('Unit insert returned no data');
  return data.id as string;
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
