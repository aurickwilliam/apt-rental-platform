"use client";

import { useCallback } from "react";

import { useAsyncResource } from "@/hooks/use-async-resource";

import {
  deleteFavorite,
  fetchFavoriteApartmentIds,
  getTenantContext,
  insertFavorite,
} from "@/service/favoritesService";

export type ToggleFavoriteErrorCode = "AUTH_REQUIRED" | "NOT_TENANT";

export type ToggleFavoriteError = Error & {
  code?: ToggleFavoriteErrorCode;
};

interface FavoritesData {
  tenantId: string | null;
  role: string | null;
  isAuthenticated: boolean;
  favoriteApartmentIds: Set<string>;
}

const NO_FAVORITES: FavoritesData = {
  tenantId: null,
  role: null,
  isAuthenticated: false,
  favoriteApartmentIds: new Set(),
};

export function useFavorites() {
  const load = useCallback(async (): Promise<FavoritesData> => {
    const context = await getTenantContext();
    if (!context.tenantId) {
      return { ...NO_FAVORITES, role: context.role, isAuthenticated: context.isAuthenticated };
    }
    const apartmentIds = await fetchFavoriteApartmentIds(context.tenantId);
    return {
      tenantId: context.tenantId,
      role: context.role,
      isAuthenticated: context.isAuthenticated,
      favoriteApartmentIds: new Set(apartmentIds),
    };
  }, []);
  const { data, loading, error, refresh: refreshFavorites, setData } = useAsyncResource(
    load,
    NO_FAVORITES,
    "Failed to load favorites.",
  );
  const { tenantId, role, isAuthenticated, favoriteApartmentIds } = data;

  const isFavorite = useCallback(
    (apartmentId: string) => favoriteApartmentIds.has(apartmentId),
    [favoriteApartmentIds],
  );

  const toggleFavorite = useCallback(
    async (apartmentId: string) => {
      if (!tenantId) {
        const err: ToggleFavoriteError = new Error(
          isAuthenticated
            ? "Only tenants can save favorites."
            : "Sign in to save favorites.",
        );
        err.code = isAuthenticated ? "NOT_TENANT" : "AUTH_REQUIRED";
        throw err;
      }

      const favorited = favoriteApartmentIds.has(apartmentId);

      if (favorited) {
        await deleteFavorite(tenantId, apartmentId);
      } else {
        await insertFavorite(tenantId, apartmentId);
      }

      setData((prev) => {
        const next = new Set(prev.favoriteApartmentIds);
        if (next.has(apartmentId)) next.delete(apartmentId);
        else next.add(apartmentId);
        return { ...prev, favoriteApartmentIds: next };
      });

      return !favorited;
    },
    [favoriteApartmentIds, isAuthenticated, tenantId, setData],
  );

  return {
    tenantId,
    role,
    isAuthenticated,
    favoriteApartmentIds,
    loading,
    error,
    refreshFavorites,
    isFavorite,
    toggleFavorite,
  };
}
