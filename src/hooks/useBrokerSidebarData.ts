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

  const isSharedOnlyRole = user?.role === 'partner' || user?.role === 'manager';

  const refresh = useCallback(async () => {
    if (authLoading) return;

    if (!user?.id) {
      setManagedProperties([]);
      setSharedProperties([]);
      setLoading(false);
      return;
    }

    const isInitialLoad = managedProperties.length === 0;
    if (isInitialLoad) setLoading(true);
    try {
      if (isSharedOnlyRole) {
        const shared = await fetchSharedWithUser(user.id);
        const sharedSidebar = await Promise.all(
          shared.map((s) => fetchPropertySidebarItem(s.id, s.title)),
        );
        setManagedProperties(sharedSidebar);
        setSharedProperties(
          shared.map((s) => ({
            id: s.id,
            title: s.title,
            permissionLevel: s.permissionLevel,
          })),
        );
        return;
      }

      const { sidebar } = await fetchManagedPropertySidebar(user.id);

      let sharedSidebar: ManagedPropertySidebarItem[] = [];
      let shared: Awaited<ReturnType<typeof fetchSharedWithUser>> = [];
      try {
        shared = await fetchSharedWithUser(user.id);
        const ownedIds = new Set(sidebar.map((p) => p.id));
        const sharedOnly = shared.filter((s) => !ownedIds.has(s.id));
        sharedSidebar = await Promise.all(
          sharedOnly.map((s) => fetchPropertySidebarItem(s.id, s.title)),
        );
      } catch (sharedErr) {
        console.error('[useBrokerSidebarData] shared properties failed', sharedErr);
      }

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
        const fallbackSidebar = await Promise.all(
          properties.map((p) => fetchPropertySidebarItem(p.id, p.title)),
        );
        setManagedProperties(fallbackSidebar);
      } catch (fallbackErr) {
        console.error('[useBrokerSidebarData] properties fallback failed', fallbackErr);
        setManagedProperties([]);
      }
      setSharedProperties([]);
    } finally {
      setLoading(false);
    }
  }, [authLoading, isSharedOnlyRole, managedProperties.length, user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onFocus = () => void refresh();
    const onClaimed = () => void refresh();
    window.addEventListener('focus', onFocus);
    window.addEventListener('nexestate:invites-claimed', onClaimed);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('nexestate:invites-claimed', onClaimed);
    };
  }, [refresh]);

  useEntityCreated(['property', 'unit', 'tenant', 'lease'], refresh);

  return { managedProperties, sharedProperties, loading, refresh };
}
