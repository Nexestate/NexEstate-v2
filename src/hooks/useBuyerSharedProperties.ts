import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchSharedWithUser,
  type SharedPropertySummary,
} from '../lib/services/sharedPropertiesService';

export function useBuyerSharedProperties() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<SharedPropertySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setProperties([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSharedWithUser(user.id);
      setProperties(data);
    } catch {
      setError('שגיאה בטעינת נכסים משותפים');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { properties, loading, error, refresh };
}
