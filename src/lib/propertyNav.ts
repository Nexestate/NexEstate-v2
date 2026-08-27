export type PropertyNavTab = 'overview' | 'units' | 'tenants' | 'payments';

export interface PropertyNavItem {
  id: PropertyNavTab;
  label: string;
}

export const PROPERTY_NAV_ITEMS: PropertyNavItem[] = [
  { id: 'overview', label: 'סקירה' },
  { id: 'units', label: 'יחידות' },
  { id: 'tenants', label: 'שוכרים וחוזים' },
  { id: 'payments', label: 'תשלומים' },
];

export function propertyNavHref(propertyId: string, tab: PropertyNavTab): string {
  switch (tab) {
    case 'overview':
      return `/broker/properties/${propertyId}`;
    case 'units':
      return `/broker/units?property=${propertyId}`;
    case 'tenants':
      return `/broker/tenants?property=${propertyId}`;
    case 'payments':
      return `/broker/payments?property=${propertyId}`;
  }
}

export function unitDetailHref(propertyId: string, unitId: string): string {
  return `/broker/units?property=${propertyId}&open=${unitId}`;
}

export function resolvePropertyIdFromLocation(pathname: string, search: string): string | null {
  const fromPath = pathname.match(/^\/broker\/properties\/([^/]+)/)?.[1];
  if (fromPath) return fromPath;
  return new URLSearchParams(search).get('property');
}

export function resolveActivePropertyNavTab(pathname: string, _search: string): PropertyNavTab | null {
  if (pathname.match(/^\/broker\/properties\/[^/]+$/)) return 'overview';
  if (pathname.startsWith('/broker/units')) return 'units';
  if (pathname.startsWith('/broker/tenants') || pathname.startsWith('/broker/leases')) return 'tenants';
  if (pathname.startsWith('/broker/payments')) return 'payments';
  return null;
}

export function isPropertyNavActive(
  tab: PropertyNavTab,
  pathname: string,
  search: string,
): boolean {
  return resolveActivePropertyNavTab(pathname, search) === tab;
}
