import type { AttachTenantToUnitInput, CreateTenantWithLeaseInput } from './leasesService';
import { attachTenantToUnit, createTenantWithLease } from './leasesService';
import { createUnit, type UnitInsert } from './unitsService';

export type UnitOccupancyMode = 'vacant' | 'existing_tenant' | 'new_tenant';

export type UnitOnboardingSubmit = {
  unit: UnitInsert;
  occupancy: UnitOccupancyMode;
  existingTenant?: AttachTenantToUnitInput;
  newTenant?: Omit<CreateTenantWithLeaseInput, 'property_id' | 'unit_id'>;
};

export async function saveUnitOnboarding(userId: string, payload: UnitOnboardingSubmit): Promise<string> {
  const unitId = await createUnit(payload.unit);

  if (payload.occupancy === 'existing_tenant' && payload.existingTenant) {
    await attachTenantToUnit(userId, { ...payload.existingTenant, unit_id: unitId });
  }

  if (payload.occupancy === 'new_tenant' && payload.newTenant) {
    await createTenantWithLease(userId, {
      ...payload.newTenant,
      property_id: payload.unit.property_id,
      unit_id: unitId,
    });
  }

  return unitId;
}
