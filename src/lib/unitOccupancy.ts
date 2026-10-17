import type { PropertyUnit } from '../types/domain';

/** Tenant is shown on a unit row only when the unit is marked occupied. */
export function unitShowsTenant(unit: Pick<PropertyUnit, 'unit_status' | 'tenant_id' | 'tenant_name'>): boolean {
  return unit.unit_status === 'occupied' && Boolean(unit.tenant_id ?? unit.tenant_name);
}

/** Strip stale tenant/lease labels from non-occupied units in UI lists. */
export function presentationUnit(unit: PropertyUnit): PropertyUnit {
  if (unit.unit_status === 'occupied') return unit;
  return {
    ...unit,
    tenant_id: undefined,
    tenant_name: undefined,
    lease_id: undefined,
    unit_name: undefined,
  };
}

export type UnitWithMeta = PropertyUnit & { propertyTitle: string };

export type TenantUnitGroup = {
  tenantId: string;
  tenantName: string;
  propertyId: string;
  propertyTitle: string;
  units: UnitWithMeta[];
  totalRent: number;
};

export function groupOccupiedUnitsByTenant(units: UnitWithMeta[]): {
  groups: TenantUnitGroup[];
  unassigned: UnitWithMeta[];
} {
  const byTenant = new Map<string, TenantUnitGroup>();
  const unassigned: UnitWithMeta[] = [];

  for (const unit of units) {
    const tenantId = unit.tenant_id;
    const effectivelyOccupied =
      unit.unit_status === 'occupied' && Boolean(tenantId) && Boolean(unit.lease_id);
    if (!effectivelyOccupied || !tenantId) {
      unassigned.push(unit);
      continue;
    }
    const existing = byTenant.get(tenantId);
    if (existing) {
      existing.units.push(unit);
      existing.totalRent += unit.monthly_rent ?? 0;
    } else {
      byTenant.set(tenantId, {
        tenantId,
        tenantName: unit.tenant_name ?? 'שוכר',
        propertyId: unit.property_id,
        propertyTitle: unit.propertyTitle,
        units: [unit],
        totalRent: unit.monthly_rent ?? 0,
      });
    }
  }

  for (const g of byTenant.values()) {
    g.units.sort((a, b) => a.unit_number.localeCompare(b.unit_number, 'he', { numeric: true }));
  }

  const groups = [...byTenant.values()].sort((a, b) => a.tenantName.localeCompare(b.tenantName, 'he'));
  unassigned.sort((a, b) => a.unit_number.localeCompare(b.unit_number, 'he', { numeric: true }));
  return { groups, unassigned };
}
