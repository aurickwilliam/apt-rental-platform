"use client";

import { useCallback, useEffect, useState } from "react";

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

export function useFavorites() {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [favoriteApartmentIds, setFavoriteApartmentIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshFavorites = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const context = await getTenantContext();
      setRole(context.role);
      setIsAuthenticated(context.isAuthenticated);

      if (!context.tenantId) {
        setTenantId(null);
        setFavoriteApartmentIds(new Set());
        return;
      }

      const apartmentIds = await fetchFavoriteApartmentIds(context.tenantId);
      setTenantId(context.tenantId);
      setFavoriteApartmentIds(new Set(apartmentIds));
    } catch (err: any) {
      console.error("useFavorites:", err);
      setError(err?.message ?? "Failed to load favorites.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshFavorites();
  }, [refreshFavorites]);

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

      setFavoriteApartmentIds((prev) => {
        const next = new Set(prev);
        if (next.has(apartmentId)) next.delete(apartmentId);
        else next.add(apartmentId);
        return next;
      });

      return !favorited;
    },
    [favoriteApartmentIds, isAuthenticated, tenantId],
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
