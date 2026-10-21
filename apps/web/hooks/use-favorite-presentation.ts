"use client";

import { useCallback } from "react";
import { useBrowserResource } from "@/hooks/use-browser-resource";
import { favoritePresentationKey, type FavoriteCursor, type FavoritePresentationScope } from "@/lib/favorite-resource";
import {
  deleteFavorite, fetchFavoritePresentation, getTenantContext,
} from "@/service/favoritesService";

export function useFavoritePresentation(scope: FavoritePresentationScope, cursor: FavoriteCursor | null) {
  const load = useCallback(() => fetchFavoritePresentation(scope.profileId, cursor), [scope.profileId, cursor]);
  const resource = useBrowserResource(favoritePresentationKey(scope, cursor), load, "Failed to load favorites.");
  const toggleFavorite = useCallback(async (apartmentId: string) => {
    // A retained card is presentation only, never identity/role authorization.
    const context = await getTenantContext();
    if (context.tenantId !== scope.profileId) throw new Error("Please sign in to update your favorites.");
    await deleteFavorite(context.tenantId, apartmentId);
    return false;
  }, [scope.profileId]);

  return {
    apartments: resource.data?.apartments ?? [], nextCursor: resource.data?.nextCursor ?? null,
    loading: resource.loading, error: resource.error,
    hasData: resource.hasData, refreshing: resource.refreshing,
    refreshFavorites: resource.refresh, toggleFavorite,
    isFavorite: (id: string) => resource.data?.apartments.some((row) => row.id === id) ?? false,
  };
}
