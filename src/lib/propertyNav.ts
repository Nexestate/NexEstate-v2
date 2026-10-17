export function unitDetailUrl(propertyId: string, unitId: string): string {
  return `/broker/units?property=${propertyId}&open=${unitId}`;
}

export function tenantPaymentsHref(tenantId: string, propertyId?: string): string {
  const params = new URLSearchParams({ tenant: tenantId });
  if (propertyId) params.set('property', propertyId);
  return `/broker/payments?${params.toString()}`;
}

export const unitDetailHref = unitDetailUrl;

export function tenantsPageUrl(options?: {
  property?: string;
  tab?: 'tenants' | 'leases';
  attention?: 'renewal';
}): string {
  const params = new URLSearchParams();
  if (options?.property) params.set('property', options.property);
  if (options?.tab === 'leases') params.set('tab', 'leases');
  if (options?.attention) params.set('attention', options.attention);
  const qs = params.toString();
  return qs ? `/broker/tenants?${qs}` : '/broker/tenants';
}

export function propertyLeasesAttentionHref(propertyId: string): string {
  return tenantsPageUrl({ property: propertyId, tab: 'leases', attention: 'renewal' });
}

export function crmSigningAgreementsHref(propertyId?: string): string {
  return propertyId ? `/broker/agreements?property=${propertyId}` : '/broker/agreements';
}

export type PropertySubNavSection =
  | 'overview'
  | 'units'
  | 'tenants'
  | 'activity'
  | 'maintenance';

const WORKSPACE_TABS = new Set(['activity', 'maintenance']);

export function propertySubNavUrl(section: PropertySubNavSection, propertyId: string): string {
  if (section === 'overview') return `/broker/properties/${propertyId}`;
  if (section === 'units') return `/broker/units?property=${propertyId}`;
  if (section === 'tenants') return `/broker/tenants?property=${propertyId}`;
  return `/broker/properties/${propertyId}?tab=${section}`;
}

export function propertyNavHref(propertyId: string, section: PropertySubNavSection): string {
  return propertySubNavUrl(section, propertyId);
}

export function isPropertySubNavActive(
  pathname: string,
  search: string,
  to: string,
  end?: boolean,
): boolean {
  const [itemPath, itemSearch] = to.split('?');
  const itemParams = new URLSearchParams(itemSearch ?? '');
  const currentParams = new URLSearchParams(search);
  const itemTab = itemParams.get('tab');

  if (WORKSPACE_TABS.has(itemTab ?? '')) {
    return pathname === itemPath && currentParams.get('tab') === itemTab;
  }

  if (itemPath.startsWith('/broker/properties/') && !itemTab) {
    return pathname === itemPath && !currentParams.get('tab');
  }

  if (itemSearch) {
    const property = itemParams.get('property');
    const currentProperty = currentParams.get('property');
    return pathname === itemPath && property === currentProperty;
  }

  if (end) return pathname === itemPath;
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

export const isPropertyNavActive = isPropertySubNavActive;
