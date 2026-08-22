import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { addFavorite, fetchFavorites, removeFavorite } from '../lib/services/favoritesService';
import type { FavoriteProperty } from '../types/domain';

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const favoriteIds = useMemo(() => new Set(favorites.map((f) => f.id)), [favorites]);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setFavorites([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFavorites(user.id);
      setFavorites(data);
    } catch {
      setError('שגיאה בטעינת מועדפים');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const isFavorite = useCallback((propertyId: string) => favoriteIds.has(propertyId), [favoriteIds]);

  const toggleFavorite = useCallback(
    async (propertyId: string) => {
      if (!user?.id) return;
      try {
        if (favoriteIds.has(propertyId)) {
          await removeFavorite(user.id, propertyId);
        } else {
          await addFavorite(user.id, propertyId);
        }
        await refresh();
      } catch {
        setError('שגיאה בעדכון מועדפים');
      }
    },
    [user?.id, favoriteIds, refresh],
  );

  const remove = useCallback(
    async (propertyId: string) => {
      if (!user?.id) return;
      try {
        await removeFavorite(user.id, propertyId);
        await refresh();
      } catch {
        setError('שגיאה בהסרת מועדף');
      }
    },
    [user?.id, refresh],
  );

  return {
    favorites,
    favoriteIds,
    loading,
    error,
    refresh,
    isFavorite,
    toggleFavorite,
    removeFavorite: remove,
    count: favorites.length,
  };
}
