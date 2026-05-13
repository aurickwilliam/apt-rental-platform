import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import {
  deleteFavorite,
  fetchFavoriteApartmentIds,
  getCurrentTenantId,
  insertFavorite,
} from '@/service/favoritesService';

export function useFavorites() {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [favoriteApartmentIds, setFavoriteApartmentIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshFavorites = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const currentTenantId = await getCurrentTenantId();
      if (!currentTenantId) {
        setTenantId(null);
        setFavoriteApartmentIds(new Set());
        return;
      }

      const apartmentIds = await fetchFavoriteApartmentIds(currentTenantId);
      setTenantId(currentTenantId);
      setFavoriteApartmentIds(new Set(apartmentIds));
    } catch (err: any) {
      console.error('useFavorites:', err);
      setError(err?.message ?? 'Failed to load favorites.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshFavorites();
    }, [refreshFavorites])
  );

  const isFavorite = useCallback(
    (apartmentId: string) => favoriteApartmentIds.has(apartmentId),
    [favoriteApartmentIds]
  );

  const toggleFavorite = useCallback(
    async (apartmentId: string) => {
      if (!tenantId) {
        throw new Error('No tenant profile found.');
      }

      const favorited = favoriteApartmentIds.has(apartmentId);

      if (favorited) {
        await deleteFavorite(tenantId, apartmentId);
      } else {
        await insertFavorite(tenantId, apartmentId);
      }

      setFavoriteApartmentIds((prev) => {
        const next = new Set(prev);
        if (next.has(apartmentId)) next.delete(apartmentId);
        else next.add(apartmentId);
        return next;
      });
    },
    [favoriteApartmentIds, tenantId]
  );

  return {
    tenantId,
    favoriteApartmentIds,
    loading,
    error,
    refreshFavorites,
    isFavorite,
    toggleFavorite,
  };
}
