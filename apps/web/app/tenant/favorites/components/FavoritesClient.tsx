"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Spinner, toast } from "@heroui/react";
import { LayoutGrid, LayoutList } from "lucide-react";

import ApartmentCard from "@/app/components/ui/ApartmentCard";
import { useFavorites } from "@/hooks/use-favorites";
import {
  fetchApartmentsByIds,
  type FavoriteApartment,
} from "@/service/favoritesService";

import FavoriteListCard from "@/app/tenant/favorites/components/FavoriteListCard";

export default function FavoritesClient() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [apartments, setApartments] = useState<FavoriteApartment[]>([]);
  const [loadingApartments, setLoadingApartments] = useState(false);
  const [apartmentsError, setApartmentsError] = useState<string | null>(null);
  const [activeFavoriteId, setActiveFavoriteId] = useState<string | null>(null);

  const { favoriteApartmentIds, loading, error, isFavorite, toggleFavorite } = useFavorites();

  const favoriteApartmentIdList = useMemo(
    () => Array.from(favoriteApartmentIds),
    [favoriteApartmentIds],
  );

  const resolveThumbnail = useCallback((apartment: FavoriteApartment) => {
    const images = apartment.apartment_images ?? [];
    const cover = images.find((img) => img.is_cover)?.url;
    if (cover) return cover;

    const oldest = [...images].sort(
      (a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime(),
    )[0]?.url;

    return oldest ?? "/default/default-thumbnail.jpeg";
  }, []);

  useEffect(() => {
    const loadFavoriteApartments = async () => {
      if (favoriteApartmentIdList.length === 0) {
        setApartments([]);
        setApartmentsError(null);
        return;
      }

      try {
        setLoadingApartments(true);
        setApartmentsError(null);

        const apartmentRows = await fetchApartmentsByIds(favoriteApartmentIdList);
        const apartmentById = new Map(apartmentRows.map((row) => [row.id, row]));
        const orderedApartments = favoriteApartmentIdList
          .map((id) => apartmentById.get(id))
          .filter(Boolean) as FavoriteApartment[];

        setApartments(orderedApartments);
      } catch (err: unknown) {
        const error = err as { message?: string };
        console.error("Error fetching favorite apartments:", err);
        setApartmentsError(error?.message ?? "Failed to load favorites.");
      } finally {
        setLoadingApartments(false);
      }
    };

    void loadFavoriteApartments();
  }, [favoriteApartmentIdList]);

  const handleFavoriteToggle = useCallback(
    async (id: string) => {
      setActiveFavoriteId(id);

      try {
        const nextValue = await toggleFavorite(id);

        if (nextValue) {
          toast.success("Saved to favorites");
        } else {
          toast("Removed from favorites");
        }
        
      } catch (err: unknown) {

        const error = err as { message?: string };
        toast.danger(error?.message ?? "Unable to update favorites");

      } finally {
        setActiveFavoriteId(null);
      }
    },
    [toggleFavorite],
  );

  const isLoading = loading || loadingApartments;
  const combinedError = error ?? apartmentsError;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-default-400 uppercase tracking-widest">Favorites</p>
          <h1 className="text-2xl font-semibold text-foreground">Saved apartments</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            isIconOnly
            variant={viewMode === "grid" ? "primary" : "ghost"}
            onPress={() => setViewMode("grid")}
          >
            <LayoutGrid size={16} />
          </Button>
          <Button
            isIconOnly
            variant={viewMode === "list" ? "primary" : "ghost"}
            onPress={() => setViewMode("list")}
          >
            <LayoutList size={16} />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner color="accent" />
        </div>
      ) : combinedError ? (
        <Card className="border border-default-200">
          <Card.Content className="text-center text-sm text-danger">
            {combinedError}
          </Card.Content>
        </Card>
      ) : apartments.length === 0 ? (
        <Card className="border border-default-200">
          <Card.Content className="text-center text-sm text-default-500">
            No favorite apartments yet.
          </Card.Content>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 gap-y-5">
          {apartments.map((apartment) => (
            <ApartmentCard
              key={apartment.id}
              name={apartment.name}
              location={`${apartment.barangay}, ${apartment.city}`}
              price={apartment.monthly_rent ?? 0}
              rating={apartment.average_rating ?? 0}
              thumbnailUrl={resolveThumbnail(apartment)}
              isFavorite={isFavorite(apartment.id)}
              isFavoriteLoading={activeFavoriteId === apartment.id}
              onFavoritePress={() => {
                void handleFavoriteToggle(apartment.id);
              }}
              onPress={() => router.push(`/browse/${apartment.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {apartments.map((apartment) => (
            <FavoriteListCard
              key={apartment.id}
              apartment={apartment}
              thumbnailUrl={resolveThumbnail(apartment)}
              isFavorite={isFavorite(apartment.id)}
              isFavoriteLoading={activeFavoriteId === apartment.id}
              onFavoritePress={() => {
                void handleFavoriteToggle(apartment.id);
              }}
              onPress={() => router.push(`/browse/${apartment.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
