import { Navigate, useParams, useSearchParams } from 'react-router-dom';

/** Legacy /broker/leases routes redirect to tenants page with leases tab. */
export function LeasesPage() {
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const next = new URLSearchParams(searchParams);
  next.set('tab', 'leases');
  if (id) next.set('open', id);
  const query = next.toString();
  return <Navigate to={`/broker/tenants${query ? `?${query}` : ''}`} replace />;
}
