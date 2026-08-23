import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEntityCreated } from './useEntityCreated';
import {
  fetchManagedPropertySidebar,
  fetchPropertySidebarItem,
  type ManagedPropertySidebarItem,
} from '../lib/services/brokerStatsService';
import { fetchProperties } from '../lib/services';
import { fetchSharedWithUser } from '../lib/services/sharedPropertiesService';
import type { PermissionLevel } from '../types';

export function useBrokerSidebarData() {
  const { user, loading: authLoading } = useAuth();
  const [managedProperties, setManagedProperties] = useState<ManagedPropertySidebarItem[]>([]);
  const [sharedProperties, setSharedProperties] = useState<
    Array<{ id: string; title: string; permissionLevel: PermissionLevel }>
  >([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (authLoading) return;

    if (!user?.id) {
      setManagedProperties([]);
      setSharedProperties([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [{ sidebar }, shared] = await Promise.all([
        fetchManagedPropertySidebar(user.id),
        fetchSharedWithUser(user.id),
      ]);

      const ownedIds = new Set(sidebar.map((p) => p.id));
      const sharedOnly = shared.filter((s) => !ownedIds.has(s.id));
      const sharedSidebar = await Promise.all(
        sharedOnly.map((s) => fetchPropertySidebarItem(s.id, s.title)),
      );

      setManagedProperties([...sidebar, ...sharedSidebar]);
      setSharedProperties(
        shared.map((s) => ({
          id: s.id,
          title: s.title,
          permissionLevel: s.permissionLevel,
        })),
      );
    } catch (err) {
      console.error('[useBrokerSidebarData] refresh failed', err);
      try {
        const properties = await fetchProperties(user.id);
        setManagedProperties(
          properties.map((p) => ({
            id: p.id,
            title: p.title,
            totalUnits: p.totalUnits,
            tenantCount: 0,
            leaseCount: 0,
            paymentCount: 0,
          })),
        );
      } catch (fallbackErr) {
        console.error('[useBrokerSidebarData] properties fallback failed', fallbackErr);
        setManagedProperties([]);
      }
      setSharedProperties([]);
    } finally {
      setLoading(false);
    }
  }, [authLoading, user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onFocus = () => void refresh();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refresh]);

  useEntityCreated(['property', 'unit', 'tenant', 'lease'], refresh);

  return { managedProperties, sharedProperties, loading, refresh };
}
