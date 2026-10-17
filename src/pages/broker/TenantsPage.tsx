import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PropertyTenantsSection } from '../../components/broker/PropertyTenantsSection';

/** Global tenants list. Property-scoped URLs redirect to property detail. */
export function TenantsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const propertyFilter = searchParams.get('property');

  useEffect(() => {
    if (!propertyFilter) return;
    const next = new URLSearchParams(searchParams);
    next.delete('property');
    const legacyTab = next.get('tab');
    next.delete('tab');
    next.set('tab', 'tenants');
    if (legacyTab === 'leases') next.set('list', 'leases');
    navigate(`/broker/properties/${propertyFilter}?${next.toString()}`, { replace: true });
  }, [propertyFilter, searchParams, navigate]);

  if (propertyFilter) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <PropertyTenantsSection />;
}
