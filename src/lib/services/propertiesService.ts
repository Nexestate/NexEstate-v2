import { DEMO_PROPERTIES, getDemoProperty } from '../../data/demoData';
import type { PropertyWithUnits } from '../../types/domain';
import { isDemoMode, requireSupabase, ServiceError, throwIfError } from './serviceHelpers';

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

    const mappedUnits = (units ?? []).map((u) => ({
      id: u.id,
      property_id: u.property_id,
      unit_number: u.unit_number,
      unit_name: u.unit_name ?? undefined,
      area_sqm: u.area_sqm ?? undefined,
      monthly_rent: u.monthly_rent ?? undefined,
      unit_status: u.unit_status,
    }));

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

  const mappedUnits = (units ?? []).map((u) => ({
    id: u.id,
    property_id: u.property_id,
    unit_number: u.unit_number,
    unit_name: u.unit_name ?? undefined,
    area_sqm: u.area_sqm ?? undefined,
    monthly_rent: u.monthly_rent ?? undefined,
    unit_status: u.unit_status,
  }));

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
