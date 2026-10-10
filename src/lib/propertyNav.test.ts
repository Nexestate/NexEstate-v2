import { describe, expect, it } from 'vitest';
import { isPropertySubNavActive, propertySubNavUrl } from './propertyNav';

describe('property workspace URLs', () => {
  it('keeps operational lists on existing routes', () => {
    expect(propertySubNavUrl('tenants', 'p1')).toBe('/broker/tenants?property=p1');
    expect(propertySubNavUrl('payments', 'p1')).toBe('/broker/payments?property=p1');
  });

  it('keeps documents/agreements on the property page', () => {
    expect(propertySubNavUrl('documents', 'p1')).toBe('/broker/properties/p1?tab=documents');
    expect(
      isPropertySubNavActive('/broker/properties/p1', '?tab=documents', '/broker/properties/p1?tab=documents'),
    ).toBe(true);
    expect(isPropertySubNavActive('/broker/properties/p1', '', '/broker/properties/p1')).toBe(true);
    expect(isPropertySubNavActive('/broker/properties/p1', '?tab=documents', '/broker/properties/p1')).toBe(false);
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
