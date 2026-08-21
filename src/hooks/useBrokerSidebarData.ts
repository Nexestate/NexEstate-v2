import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchManagedPropertySidebar,
  type ManagedPropertySidebarItem,
} from '../lib/services/brokerStatsService';
import { fetchSharedWithUser } from '../lib/services/sharedPropertiesService';
import type { PermissionLevel } from '../types';

export function useBrokerSidebarData() {
  const { user } = useAuth();
  const [managedProperties, setManagedProperties] = useState<ManagedPropertySidebarItem[]>([]);
  const [sharedProperties, setSharedProperties] = useState<
    Array<{ id: string; title: string; permissionLevel: PermissionLevel }>
  >([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
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
      setManagedProperties(sidebar);
      setSharedProperties(
        shared.map((s) => ({
          id: s.id,
          title: s.title,
          permissionLevel: s.permissionLevel,
        })),
      );
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { managedProperties, sharedProperties, loading, refresh };
}
