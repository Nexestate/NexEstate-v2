import { DEMO_LEASES, DEMO_PROPERTIES } from '../../data/demoData';
import type { PropertyUnit, UnitStatus, UnitType } from '../../types/domain';
import { isDemoMode, requireSupabase, ServiceError, throwIfError } from './serviceHelpers';

export type UnitInsert = {
  property_id: string;
  unit_number: string;
  unit_name?: string;
  unit_type?: UnitType;
  area_sqm?: number;
  monthly_rent?: number;
  unit_status?: UnitStatus;
  floor?: number;
  building?: string;
  rooms?: number;
  bathrooms?: number;
  management_fee?: number;
  amenities?: string[];
  description?: string;
  notes?: string;
  broker_id?: string;
};

export type UnitUpdate = Partial<Omit<UnitInsert, 'property_id'>> & {
  tenant_id?: string | null;
};

export async function createUnit(payload: UnitInsert): Promise<string> {
  if (isDemoMode()) {
    const property = DEMO_PROPERTIES.find((p) => p.id === payload.property_id);
    if (!property) throw new ServiceError('Property not found');
    const id = `unit-${payload.property_id}-${Date.now()}`;
    const unit: PropertyUnit = {
      id,
      property_id: payload.property_id,
      unit_number: payload.unit_number,
      unit_name: payload.unit_name,
      unit_type: payload.unit_type,
      area_sqm: payload.area_sqm,
      monthly_rent: payload.monthly_rent,
      unit_status: payload.unit_status ?? 'available',
      floor: payload.floor,
      building: payload.building,
      rooms: payload.rooms,
      bathrooms: payload.bathrooms,
      management_fee: payload.management_fee,
      amenities: payload.amenities,
      description: payload.description,
      notes: payload.notes,
    };
    property.units.push(unit);
    property.totalUnits = property.units.length;
    property.occupiedUnits = property.units.filter((u) => u.unit_status === 'occupied').length;
    property.monthlyIncome = property.units
      .filter((u) => u.unit_status === 'occupied')
      .reduce((sum, u) => sum + (u.monthly_rent ?? 0), 0);
    return id;
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from('property_units')
    .insert({
      property_id: payload.property_id,
      unit_number: payload.unit_number,
      unit_name: payload.unit_name ?? null,
      unit_type: payload.unit_type ?? 'office',
      area_sqm: payload.area_sqm ?? null,
      monthly_rent: payload.monthly_rent ?? null,
      unit_status: payload.unit_status ?? 'available',
      floor: payload.floor ?? null,
      building: payload.building ?? null,
      rooms: payload.rooms ?? null,
      bathrooms: payload.bathrooms ?? null,
      management_fee: payload.management_fee ?? null,
      amenities: payload.amenities ?? [],
      description: payload.description ?? null,
      notes: payload.notes ?? null,
      broker_id: payload.broker_id ?? null,
    })
    .select('id')
    .single();
  throwIfError(error);
  if (!data) throw new ServiceError('Unit insert returned no data');
  return data.id as string;
}

/** End active leases on this unit and clear tenant link (when unit is not occupied). */
export async function releaseUnitOccupancy(unitId: string): Promise<void> {
  if (isDemoMode()) {
    for (const lease of DEMO_LEASES) {
      if (lease.unit_id === unitId && lease.is_active) lease.is_active = false;
    }
    for (const property of DEMO_PROPERTIES) {
      const unit = property.units.find((u) => u.id === unitId);
      if (unit) {
        unit.tenant_id = undefined;
        unit.tenant_name = undefined;
        unit.lease_id = undefined;
        unit.unit_name = undefined;
        unit.unit_status = 'available';
      }
    }
    return;
  }

  const client = requireSupabase();
  const now = new Date().toISOString();
  const { data: leases, error: leaseErr } = await client
    .from('leases')
    .select('id')
    .eq('unit_id', unitId)
    .eq('is_active', true);
  throwIfError(leaseErr);

  for (const row of leases ?? []) {
    const { error } = await client
      .from('leases')
      .update({ is_active: false, updated_at: now })
      .eq('id', row.id as string);
    throwIfError(error);
  }

  const { error: unitErr } = await client
    .from('property_units')
    .update({
      tenant_id: null,
      unit_name: null,
      unit_status: 'available',
      updated_at: now,
    })
    .eq('id', unitId);
  throwIfError(unitErr);
}

export async function updateUnit(id: string, payload: UnitUpdate): Promise<void> {
  const nextStatus = payload.unit_status;
  const vacating = nextStatus !== undefined && nextStatus !== 'occupied';

  if (isDemoMode()) {
    for (const property of DEMO_PROPERTIES) {
      const unit = property.units.find((u) => u.id === id);
      if (unit) {
        if (vacating) await releaseUnitOccupancy(id);
        Object.assign(unit, payload);
        if (vacating) {
          unit.tenant_id = undefined;
          unit.tenant_name = undefined;
          unit.lease_id = undefined;
          unit.unit_name = undefined;
        }
        property.occupiedUnits = property.units.filter((u) => u.unit_status === 'occupied').length;
        property.monthlyIncome = property.units
          .filter((u) => u.unit_status === 'occupied')
          .reduce((sum, u) => sum + (u.monthly_rent ?? 0), 0);
        return;
      }
    }
    throw new ServiceError('Unit not found');
  }

  if (vacating) {
    await releaseUnitOccupancy(id);
  }

  const client = requireSupabase();
  const update: Record<string, unknown> = { ...payload, updated_at: new Date().toISOString() };
  if (vacating) {
    update.tenant_id = null;
    update.unit_name = null;
  }
  const { error } = await client.from('property_units').update(update).eq('id', id);
  throwIfError(error);
}
