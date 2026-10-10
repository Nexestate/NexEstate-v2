import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchLeasesForProperties,
  fetchPayments,
  fetchProperty,
  fetchSigningLinks,
  fetchTenantsForProperties,
} from '../lib/services';
import {
  buildPropertyActivity,
  buildWorkspaceActions,
  buildWorkspaceSnapshot,
} from '../lib/propertyWorkspace';
import type { Lease, Payment, PropertyWithUnits, SigningLink, Tenant } from '../types/domain';

export function usePropertyWorkspace(propertyId?: string) {
  const { user } = useAuth();
  const [property, setProperty] = useState<PropertyWithUnits | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [links, setLinks] = useState<SigningLink[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    if (!propertyId) return;
    setLoading(true);
    Promise.all([
      fetchProperty(propertyId),
      fetchTenantsForProperties([propertyId]),
      fetchLeasesForProperties([propertyId]),
      fetchPayments([propertyId]),
      fetchSigningLinks(user?.id),
    ])
      .then(([p, t, l, pay, allLinks]) => {
        setProperty(p ?? null);
        setTenants(t);
        setLeases(l);
        setPayments(pay);
        setLinks(allLinks.filter((link) => link.property_id === propertyId));
      })
      .catch((err) => {
        console.error('[usePropertyWorkspace] load failed', err);
      })
      .finally(() => setLoading(false));
  }, [propertyId, user?.id]);

  useEffect(() => {
    reload();
  }, [reload]);

  const snapshot = useMemo(
    () =>
      property
        ? buildWorkspaceSnapshot({ property, tenants, leases, payments, links })
        : null,
    [property, tenants, leases, payments, links],
  );

  const actions = useMemo(
    () => (snapshot && propertyId ? buildWorkspaceActions(snapshot, propertyId) : []),
    [snapshot, propertyId],
  );

  const activity = useMemo(
    () => buildPropertyActivity({ leases, payments, links }),
    [leases, payments, links],
  );

  return { property, tenants, leases, payments, links, snapshot, actions, activity, loading, reload };
}
