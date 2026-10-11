import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchAccessiblePropertyById } from '../lib/services/accessiblePropertiesService';
import {
  fetchLeasesForProperties,
  fetchPayments,
  fetchSigningLinks,
  fetchTenantsForProperties,
} from '../lib/services';
import {
  buildPropertyActivity,
  buildWorkspaceActions,
  buildWorkspaceSnapshot,
} from '../lib/propertyWorkspace';
import type { Lease, Payment, PropertyWithUnits, SigningLink, Tenant } from '../types/domain';

async function loadOptional<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.warn(`[usePropertyWorkspace] ${label} failed`, err);
    return fallback;
  }
}

export function usePropertyWorkspace(propertyId?: string) {
  const { user, loading: authLoading } = useAuth();
  const [property, setProperty] = useState<PropertyWithUnits | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [links, setLinks] = useState<SigningLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(() => {
    if (!propertyId) {
      setProperty(null);
      setLoading(false);
      return;
    }
    if (authLoading || !user?.id) {
      setLoading(true);
      return;
    }

    setLoading(true);
    setLoadError(null);

    void (async () => {
      try {
        const p = await fetchAccessiblePropertyById(user.id, propertyId, user.role);
        if (!p) {
          setProperty(null);
          setTenants([]);
          setLeases([]);
          setPayments([]);
          setLinks([]);
          return;
        }

        setProperty(p);

        const [t, l, pay, allLinks] = await Promise.all([
          loadOptional('tenants', () => fetchTenantsForProperties([propertyId]), [] as Tenant[]),
          loadOptional('leases', () => fetchLeasesForProperties([propertyId]), [] as Lease[]),
          loadOptional('payments', () => fetchPayments([propertyId]), [] as Payment[]),
          loadOptional('signing links', () => fetchSigningLinks(user.id), [] as SigningLink[]),
        ]);

        setTenants(t);
        setLeases(l);
        setPayments(pay);
        setLinks(allLinks.filter((link) => link.property_id === propertyId));
      } catch (err) {
        console.error('[usePropertyWorkspace] load failed', err);
        setLoadError(err instanceof Error ? err.message : 'שגיאה בטעינת הנכס');
        setProperty(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [propertyId, authLoading, user?.id, user?.role]);

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

  return {
    property,
    tenants,
    leases,
    payments,
    links,
    snapshot,
    actions,
    activity,
    loading,
    loadError,
    reload,
  };
}
