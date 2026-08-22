import { DEMO_PROPERTIES } from '../../data/demoData';
import type { PropertyUnit, UnitStatus } from '../../types/domain';
import { isDemoMode, requireSupabase, ServiceError, throwIfError } from './serviceHelpers';

export type UnitInsert = {
  property_id: string;
  unit_number: string;
  unit_name?: string;
  area_sqm?: number;
  monthly_rent?: number;
  unit_status?: UnitStatus;
  floor?: number;
  broker_id?: string;
};

export type UnitUpdate = Partial<Omit<UnitInsert, 'property_id'>>;

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
      area_sqm: payload.area_sqm,
      monthly_rent: payload.monthly_rent,
      unit_status: payload.unit_status ?? 'available',
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
      area_sqm: payload.area_sqm ?? null,
      monthly_rent: payload.monthly_rent ?? null,
      unit_status: payload.unit_status ?? 'available',
      floor: payload.floor ?? null,
      broker_id: payload.broker_id ?? null,
    })
    .select('id')
    .single();
  throwIfError(error);
  if (!data) throw new ServiceError('Unit insert returned no data');
  return data.id as string;
}

export async function updateUnit(id: string, payload: UnitUpdate): Promise<void> {
  if (isDemoMode()) {
    for (const property of DEMO_PROPERTIES) {
      const unit = property.units.find((u) => u.id === id);
      if (unit) {
        Object.assign(unit, payload);
        property.occupiedUnits = property.units.filter((u) => u.unit_status === 'occupied').length;
        property.monthlyIncome = property.units
          .filter((u) => u.unit_status === 'occupied')
          .reduce((sum, u) => sum + (u.monthly_rent ?? 0), 0);
        return;
      }
    }
    throw new ServiceError('Unit not found');
  }

  const client = requireSupabase();
  const { error } = await client.from('property_units').update(payload).eq('id', id);
  throwIfError(error);
}
