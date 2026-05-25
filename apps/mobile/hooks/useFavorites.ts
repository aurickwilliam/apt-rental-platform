import { createElement, useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useToast } from 'heroui-native';
import { IconAlertTriangle, IconHeartFilled, IconHeartOff } from '@tabler/icons-react-native';
import { COLORS } from '@repo/constants';

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
  const { toast } = useToast();

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
        toast.show({
          variant: 'danger',
          label: 'No tenant profile found',
          icon: createElement(IconAlertTriangle, { size: 18, color: COLORS.danger }),
        });
        throw new Error('No tenant profile found.');
      }

      const wasAlreadyFavorite = favoriteApartmentIds.has(apartmentId);

      try {
        if (wasAlreadyFavorite) {
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

        toast.show({
          variant: wasAlreadyFavorite ? 'default' : 'success',
          label: wasAlreadyFavorite ? 'Removed from favorites' : 'Added to favorites',
          icon: wasAlreadyFavorite
            ? createElement(IconHeartOff, { size: 18, color: COLORS.text, style: { marginTop: 3 } })
            : createElement(IconHeartFilled, {
                size: 18,
                color: COLORS.greenHulk,
                style: { marginTop: 3 },
              }),
        });
      } catch (err) {
        console.error('Error toggling favorite:', err);
        toast.show({
          variant: 'danger',
          label: 'Something went wrong',
          icon: createElement(IconAlertTriangle, { size: 18, color: COLORS.danger }),
        });
        throw err;
      }
    },
    [favoriteApartmentIds, tenantId, toast]
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
