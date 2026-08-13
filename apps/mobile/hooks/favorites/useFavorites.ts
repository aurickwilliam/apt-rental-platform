import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useCurrentUser } from "@/hooks/auth";

import {
  deleteFavorite,
  fetchApartmentsByIds,
  fetchFavoriteApartmentIds,
  insertFavorite,
  type FavoriteApartment,
} from "@/service/favoritesService";

export const getFavoritesQueryKey = (tenantId: string) =>
  ["favorites", tenantId] as const;
export const getFavoriteApartmentsQueryKey = (tenantId: string) =>
  ["favorite-apartments", tenantId] as const;

function getErrorMessage(error: unknown, fallback: string): string | null {
  if (!error) return null;
  if (error instanceof Error) return error.message;

  if (
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return fallback;
}

export function useFavorites() {
  const queryClient = useQueryClient();
  const currentUserQuery = useCurrentUser();
  const tenantId = currentUserQuery.data?.id ?? null;

  const favoritesQuery = useQuery({
    queryKey: ["favorites", tenantId] as const,
    queryFn: () => fetchFavoriteApartmentIds(tenantId as string),
    enabled: tenantId !== null,
  });

  const favoriteApartmentIdList = favoritesQuery.data ?? [];
  const favoriteApartmentIds = useMemo(
    () => new Set(favoriteApartmentIdList),
    [favoriteApartmentIdList],
  );

  const refreshFavorites = useCallback(async () => {
    if (!tenantId) return;

    await favoritesQuery.refetch();
  }, [favoritesQuery, tenantId]);

  const isFavorite = useCallback(
    (apartmentId: string) => favoriteApartmentIds.has(apartmentId),
    [favoriteApartmentIds],
  );

  const toggleFavorite = useCallback(
    async (apartmentId: string) => {
      if (!tenantId) {
        throw new Error("No tenant profile found.");
      }

      const queryKey = getFavoritesQueryKey(tenantId);
      const previousApartmentIds =
        queryClient.getQueryData<string[]>(queryKey) ?? favoriteApartmentIdList;
      const wasFavorite = previousApartmentIds.includes(apartmentId);

      await queryClient.cancelQueries({ queryKey, exact: true });
      queryClient.setQueryData<string[]>(queryKey, (currentIds = []) =>
        wasFavorite
          ? currentIds.filter((id) => id !== apartmentId)
          : [apartmentId, ...currentIds],
      );

      try {
        if (wasFavorite) {
          await deleteFavorite(tenantId, apartmentId);
        } else {
          await insertFavorite(tenantId, apartmentId);
        }

        await queryClient.invalidateQueries({
          queryKey: getFavoriteApartmentsQueryKey(tenantId),
          exact: true,
        });

        return { wasFavorite };
      } catch (error) {
        queryClient.setQueryData<string[]>(queryKey, (currentIds = []) =>
          wasFavorite
            ? currentIds.includes(apartmentId)
              ? currentIds
              : [apartmentId, ...currentIds]
            : currentIds.filter((id) => id !== apartmentId),
        );
        await queryClient.invalidateQueries({
          queryKey: getFavoriteApartmentsQueryKey(tenantId),
          exact: true,
        });
        throw error;
      }
    },
    [favoriteApartmentIdList, queryClient, tenantId],
  );

  return {
    tenantId,
    favoriteApartmentIds,
    loading: currentUserQuery.isLoading || favoritesQuery.isLoading,
    error:
      getErrorMessage(currentUserQuery.error, "Failed to load favorites.") ??
      getErrorMessage(favoritesQuery.error, "Failed to load favorites."),
    refreshFavorites,
    isFavorite,
    toggleFavorite,
  };
}

export function useFavoriteApartments() {
  const queryClient = useQueryClient();
  const currentUserQuery = useCurrentUser();
  const tenantId = currentUserQuery.data?.id ?? null;

  const favoriteApartmentsQuery = useQuery({
    queryKey: ["favorite-apartments", tenantId] as const,
    queryFn: async (): Promise<FavoriteApartment[]> => {
      const resolvedTenantId = tenantId as string;
      const favoriteApartmentIds = await queryClient.ensureQueryData({
        queryKey: getFavoritesQueryKey(resolvedTenantId),
        queryFn: () => fetchFavoriteApartmentIds(resolvedTenantId),
      });
      const apartmentRows = await fetchApartmentsByIds(favoriteApartmentIds);
      const apartmentById = new Map(apartmentRows.map((apartment) => [apartment.id, apartment]));

      return favoriteApartmentIds
        .map((id) => apartmentById.get(id))
        .filter((apartment): apartment is FavoriteApartment => apartment !== undefined);
    },
    enabled: tenantId !== null,
  });

  const refreshFavoriteApartments = useCallback(async () => {
    if (!tenantId) return;

    await queryClient.invalidateQueries({
      queryKey: getFavoritesQueryKey(tenantId),
      exact: true,
    });
    await favoriteApartmentsQuery.refetch();
  }, [favoriteApartmentsQuery, queryClient, tenantId]);

  return {
    favoriteApartments: favoriteApartmentsQuery.data ?? [],
    loading: currentUserQuery.isLoading || favoriteApartmentsQuery.isLoading,
    refreshing:
      favoriteApartmentsQuery.isFetching && !favoriteApartmentsQuery.isLoading,
    error:
      getErrorMessage(currentUserQuery.error, "Failed to load favorites.") ??
      getErrorMessage(favoriteApartmentsQuery.error, "Failed to load favorites."),
    refreshFavoriteApartments,
  };
}
