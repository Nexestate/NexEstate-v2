export function unitDetailUrl(propertyId: string, unitId: string): string {
  return `/broker/units?property=${propertyId}&open=${unitId}`;
}

export function tenantPaymentsHref(tenantId: string, propertyId?: string): string {
  const params = new URLSearchParams({ tenant: tenantId });
  if (propertyId) params.set('property', propertyId);
  return `/broker/payments?${params.toString()}`;
}

export const unitDetailHref = unitDetailUrl;

export function propertyTenantsHref(
  propertyId: string,
  options?: { list?: 'leases'; attention?: 'renewal' | 'docs' },
): string {
  const params = new URLSearchParams({ tab: 'tenants' });
  if (options?.list === 'leases') params.set('list', 'leases');
  if (options?.attention) params.set('attention', options.attention);
  return `/broker/properties/${propertyId}?${params.toString()}`;
}

export function tenantsPageUrl(options?: {
  property?: string;
  tab?: 'tenants' | 'leases';
  attention?: 'renewal' | 'docs';
}): string {
  if (options?.property) {
    return propertyTenantsHref(options.property, {
      list: options.tab === 'leases' ? 'leases' : undefined,
      attention: options.attention,
    });
  }
  return '/broker/tenants';
}

export function propertyLeasesAttentionHref(propertyId: string): string {
  return propertyTenantsHref(propertyId, { list: 'leases', attention: 'renewal' });
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
  if (section === 'tenants') return `/broker/properties/${propertyId}?tab=tenants`;
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

  if (itemTab === 'tenants') {
    return pathname === itemPath && currentParams.get('tab') === 'tenants';
  }

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
