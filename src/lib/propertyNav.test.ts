import { describe, expect, it } from 'vitest';
import { isPropertySubNavActive, propertySubNavUrl } from './propertyNav';

describe('property workspace URLs', () => {
  it('keeps operational lists on existing routes', () => {
    expect(propertySubNavUrl('tenants', 'p1')).toBe('/broker/tenants?property=p1');
    expect(propertySubNavUrl('payments', 'p1')).toBe('/broker/payments?property=p1');
  });

  it('keeps agreements on the property workspace page', () => {
    expect(propertySubNavUrl('agreements', 'p1')).toBe('/broker/properties/p1?tab=agreements');
    expect(
      isPropertySubNavActive('/broker/properties/p1', '?tab=agreements', '/broker/properties/p1?tab=agreements'),
    ).toBe(true);
    expect(isPropertySubNavActive('/broker/properties/p1', '', '/broker/properties/p1')).toBe(true);
  });

  it('marks list routes active only for the same property', () => {
    expect(
      isPropertySubNavActive('/broker/units', '?property=p1', '/broker/units?property=p1'),
    ).toBe(true);
    expect(
      isPropertySubNavActive('/broker/units', '?property=p2', '/broker/units?property=p1'),
    ).toBe(false);
    expect(
      isPropertySubNavActive('/broker/properties/p1', '', '/broker/units?property=p1'),
    ).toBe(false);
  });
});
