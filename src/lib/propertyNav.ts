export function unitDetailUrl(propertyId: string, unitId: string): string {
  return `/broker/units?property=${propertyId}&open=${unitId}`;
}

export function tenantsPageUrl(options?: { property?: string; tab?: 'tenants' | 'leases' }): string {
  const params = new URLSearchParams();
  if (options?.property) params.set('property', options.property);
  if (options?.tab === 'leases') params.set('tab', 'leases');
  const qs = params.toString();
  return qs ? `/broker/tenants?${qs}` : '/broker/tenants';
}

export function isPropertySubNavActive(
  pathname: string,
  search: string,
  to: string,
  end?: boolean,
): boolean {
  const [itemPath, itemSearch] = to.split('?');
  if (itemSearch) {
    const params = new URLSearchParams(itemSearch);
    const property = params.get('property');
    const currentProperty = new URLSearchParams(search).get('property');
    return pathname === itemPath && property === currentProperty;
  }
  if (end) return pathname === itemPath;
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

export type PropertySubNavSection = 'overview' | 'units' | 'tenants' | 'payments';

export function propertySubNavUrl(section: PropertySubNavSection, propertyId: string): string {
  if (section === 'overview') return `/broker/properties/${propertyId}`;
  return `/broker/${section}?property=${propertyId}`;
}
