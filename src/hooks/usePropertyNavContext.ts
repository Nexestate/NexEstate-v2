import { useLocation, useParams } from 'react-router-dom';

const PROPERTY_SCOPED_PATHS = /^\/broker\/(units|tenants|leases|payments)(\/|$)/;

/** Returns active managed-property id from route params or ?property= query. */
export function usePropertyNavContext(): string | null {
  const location = useLocation();
  const params = useParams();

  if (location.pathname.startsWith('/broker/properties/') && params.id) {
    return params.id;
  }

  const propertyId = new URLSearchParams(location.search).get('property');
  if (propertyId && PROPERTY_SCOPED_PATHS.test(location.pathname)) {
    return propertyId;
  }

  return null;
}
