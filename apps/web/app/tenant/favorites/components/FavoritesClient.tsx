"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, toast } from "@heroui/react";
import { IconAlertCircle, IconArrowRight, IconHeart, IconLayoutGrid as LayoutGrid, IconLayoutList as LayoutList } from "@tabler/icons-react";

import ApartmentCard from "@/app/components/ui/ApartmentCard";
import { useFavorites } from "@/hooks/use-favorites";
import {
  fetchApartmentsByIds,
  type FavoriteApartment,
} from "@/service/favoritesService";

import FavoriteListCard from "@/app/tenant/favorites/components/FavoriteListCard";
import { FavoritesPageHeader, FavoritesPageShell } from "./FavoritesPageLayout";
import { FavoritesCardsSkeleton } from "./FavoritesSkeleton";

export default function FavoritesClient() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [apartments, setApartments] = useState<FavoriteApartment[]>([]);
  const [loadingApartments, setLoadingApartments] = useState(false);
  const [apartmentsError, setApartmentsError] = useState<string | null>(null);
  const [activeFavoriteId, setActiveFavoriteId] = useState<string | null>(null);

  const { favoriteApartmentIds, loading, error, isFavorite, toggleFavorite, refreshFavorites } = useFavorites();

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
    <FavoritesPageShell>
      <FavoritesPageHeader />

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
        <p className="font-nunito text-sm font-semibold text-card-foreground" aria-live="polite">
          {isLoading ? "Loading saved apartments…" : combinedError ? "Saved apartments" : `${apartments.length} saved ${apartments.length === 1 ? "apartment" : "apartments"}`}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-full border border-border bg-background p-1" role="group" aria-label="Favorites view">
            <Button
              isIconOnly
              size="sm"
              variant={viewMode === "grid" ? "primary" : "ghost"}
              onPress={() => setViewMode("grid")}
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
            >
              <LayoutGrid size={16} aria-hidden="true" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant={viewMode === "list" ? "primary" : "ghost"}
              onPress={() => setViewMode("list")}
              aria-label="List view"
              aria-pressed={viewMode === "list"}
            >
              <LayoutList size={16} aria-hidden="true" />
            </Button>
          </div>
          {apartments.length > 0 && !combinedError && (
            <Button variant="secondary" size="sm" onPress={() => router.push("/tenant/browse")}>
              Browse apartments
              <IconArrowRight size={16} aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <FavoritesCardsSkeleton viewMode={viewMode} />
      ) : combinedError ? (
        <Card className="favorites-state-card">
          <Card.Content className="items-center gap-4 px-4 py-10 text-center">
            <IconAlertCircle size={32} className="text-danger" aria-hidden="true" />
            <div className="space-y-1">
              <h2 className="font-nunito text-lg font-bold text-card-foreground">Couldn&apos;t load your favorites</h2>
              <p className="text-sm text-muted-foreground" role="alert">{combinedError}</p>
            </div>
            <Button variant="secondary" onPress={() => void refreshFavorites()}>Try again</Button>
          </Card.Content>
        </Card>
      ) : apartments.length === 0 ? (
        <Card className="favorites-state-card">
          <Card.Content className="items-center gap-4 px-4 py-12 text-center">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <IconHeart size={32} aria-hidden="true" />
            </span>
            <div className="max-w-sm space-y-2">
              <h2 className="font-nunito text-xl font-bold text-card-foreground">Your shortlist starts here</h2>
              <p className="text-sm text-muted-foreground">Tap the heart on an apartment to save it here and return to it whenever you&apos;re ready.</p>
            </div>
            <Button onPress={() => router.push("/tenant/browse")}>
              Browse apartments
              <IconArrowRight size={16} aria-hidden="true" />
            </Button>
          </Card.Content>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="favorites-grid grid grid-cols-1 gap-5 @min-[36rem]/favorites:grid-cols-2 @min-[64rem]/favorites:grid-cols-3">
          {apartments.map((apartment) => (
            <ApartmentCard
              key={apartment.id}
              name={apartment.name}
              location={`${apartment.barangay}, ${apartment.city}`}
              price={apartment.monthly_rent ?? 0}
              rating={apartment.average_rating ?? 0}
              thumbnailUrl={resolveThumbnail(apartment)}
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
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
              href={`/browse/${apartment.id}`}
            />
          ))}
        </div>
      )}
    </FavoritesPageShell>
  );
}
