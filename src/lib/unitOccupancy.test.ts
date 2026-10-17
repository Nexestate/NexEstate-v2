import { describe, expect, it } from 'vitest';
import { groupOccupiedUnitsByTenant, unitShowsTenant } from './unitOccupancy';
import type { PropertyUnit } from '../types/domain';

const base = (over: Partial<PropertyUnit & { propertyTitle: string }>) =>
  ({
    id: 'u1',
    property_id: 'p1',
    unit_number: '1',
    unit_status: 'occupied',
    propertyTitle: 'בניין',
    ...over,
  }) as PropertyUnit & { propertyTitle: string };

describe('unitShowsTenant', () => {
  it('hides tenant when unit is vacant', () => {
    expect(unitShowsTenant({ unit_status: 'available', tenant_id: 't1', tenant_name: 'דנה' })).toBe(false);
  });
});

describe('groupOccupiedUnitsByTenant', () => {
  it('groups multiple units under one tenant', () => {
    const { groups, unassigned } = groupOccupiedUnitsByTenant([
      base({ id: 'u3', unit_number: '3', tenant_id: 't1', tenant_name: 'לוטר', monthly_rent: 100 }),
      base({ id: 'u4', unit_number: '4', tenant_id: 't1', tenant_name: 'לוטר', monthly_rent: 50 }),
      base({ id: 'u5', unit_number: '5', unit_status: 'available' }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.units).toHaveLength(2);
    expect(groups[0]?.totalRent).toBe(150);
    expect(unassigned).toHaveLength(1);
  });
});
