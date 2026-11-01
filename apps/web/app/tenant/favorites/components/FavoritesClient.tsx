"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, toast } from "@heroui/react";
import { IconAlertCircle, IconArrowRight, IconHeart, IconLayoutGrid as LayoutGrid, IconLayoutList as LayoutList } from "@tabler/icons-react";

import ApartmentCard from "@/app/components/ui/ApartmentCard";
import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import { useFavoritePresentation } from "@/hooks/use-favorite-presentation";
import type { FavoriteCursor, FavoritePresentationScope } from "@/lib/favorite-resource";
import type { FavoriteApartment } from "@/service/favoritesService";

import FavoriteListCard from "@/app/tenant/favorites/components/FavoriteListCard";
import { FavoritesPageHeader, FavoritesPageShell } from "./FavoritesPageLayout";
import { FavoritesCardsSkeleton } from "./FavoritesSkeleton";

export default function FavoritesClient(scope: FavoritePresentationScope) {
  const router = useRouter();
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeFavoriteId, setActiveFavoriteId] = useState<string | null>(null);
  const [cursors, setCursors] = useState<(FavoriteCursor | null)[]>([null]);

  const { apartments, nextCursor, loading, error, hasData, refreshing, isFavorite, toggleFavorite, refreshFavorites } = useFavoritePresentation(scope, cursors.at(-1) ?? null);

  const resolveThumbnail = useCallback((apartment: FavoriteApartment) => {
    const images = apartment.apartment_images ?? [];
    const coverImage = images.find((img) => img.is_cover);
    const cover = coverImage?.url_thumb || coverImage?.url;
    if (cover) return cover;

    const oldest = [...images].sort(
      (a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime(),
    )[0];

    return oldest?.url_thumb || oldest?.url || "/default/default-thumbnail.jpeg";
  }, []);

  const handleFavoriteToggle = useCallback(
    async (id: string) => {
      setActiveFavoriteId(id);

      try {
        const nextValue = await toggleFavorite(id);

        if (nextValue) {
          toast.success(t("favorites.saved"));
        } else {
          toast(t("favorites.removed"));
        }
        
      } catch (err: unknown) {

        const error = err as { message?: string };
        toast.danger(error?.message ?? t("favorites.updateFailed"));

      } finally {
        setActiveFavoriteId(null);
      }
    },
    [t, toggleFavorite],
  );

  const isLoading = loading;
  const combinedError = error;

  return (
    <FavoritesPageShell>
      <FavoritesPageHeader />

      {hasData && error ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
          <span>{t("favorites.refreshFailed")}</span>
          <Button variant="secondary" size="sm" onPress={() => void refreshFavorites()}>{t("favorites.tryAgain")}</Button>
        </div>
      ) : null}
      {refreshing ? <span role="status" className="sr-only">{t("favorites.refreshing")}</span> : null}

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
        <p className="font-nunito text-sm font-semibold text-card-foreground" aria-live="polite">
          {isLoading
            ? t("favorites.loadingSaved")
            : combinedError
              ? t("favorites.savedApartments")
              : nextCursor || cursors.length > 1
                ? apartments.length === 1
                  ? t("favorites.countPage", { count: apartments.length })
                  : t("favorites.countPagePlural", { count: apartments.length })
                : apartments.length === 1
                  ? t("favorites.count", { count: apartments.length })
                  : t("favorites.countPlural", { count: apartments.length })}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-full border border-border bg-background p-1" role="group" aria-label={t("favorites.viewGroupAria")}>
            <Button
              isIconOnly
              size="sm"
              variant={viewMode === "grid" ? "primary" : "ghost"}
              onPress={() => setViewMode("grid")}
              aria-label={t("favorites.gridView")}
              aria-pressed={viewMode === "grid"}
            >
              <LayoutGrid size={16} aria-hidden="true" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant={viewMode === "list" ? "primary" : "ghost"}
              onPress={() => setViewMode("list")}
              aria-label={t("favorites.listView")}
              aria-pressed={viewMode === "list"}
            >
              <LayoutList size={16} aria-hidden="true" />
            </Button>
          </div>
          {apartments.length > 0 && !combinedError && (
            <Button variant="secondary" size="sm" onPress={() => router.push("/tenant/browse")}>
              {t("favorites.browse")}
              <IconArrowRight size={16} aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <FavoritesCardsSkeleton viewMode={viewMode} />
      ) : combinedError && !hasData ? (
        <Card className="favorites-state-card">
          <Card.Content className="items-center gap-4 px-4 py-10 text-center">
            <IconAlertCircle size={32} className="text-danger" aria-hidden="true" />
            <div className="space-y-1">
              <h2 className="font-nunito text-lg font-bold text-card-foreground">{t("favorites.loadTitle")}</h2>
              <p className="text-sm text-muted-foreground" role="alert">{combinedError}</p>
            </div>
            <Button variant="secondary" onPress={() => void refreshFavorites()}>{t("favorites.tryAgain")}</Button>
          </Card.Content>
        </Card>
      ) : apartments.length === 0 ? (
        <Card className="favorites-state-card">
          <Card.Content className="items-center gap-4 px-4 py-12 text-center">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <IconHeart size={32} aria-hidden="true" />
            </span>
            <div className="max-w-sm space-y-2">
              <h2 className="font-nunito text-xl font-bold text-card-foreground">
                {cursors.length > 1 || nextCursor ? t("favorites.emptyPageTitle") : t("favorites.emptyTitle")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {cursors.length > 1 || nextCursor ? t("favorites.emptyPageBody") : t("favorites.emptyBody")}
              </p>
            </div>
            <Button onPress={() => router.push("/tenant/browse")}>
              {t("favorites.browse")}
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
      {cursors.length > 1 || nextCursor ? (
        <nav aria-label={t("favorites.pagesAria")} className="flex items-center justify-end gap-3">
          <Button variant="secondary" size="sm" isDisabled={cursors.length === 1} onPress={() => setCursors((current) => current.slice(0, -1))}>{t("favorites.previous")}</Button>
          <span className="text-sm text-muted-foreground">{t("favorites.page", { count: cursors.length })}</span>
          <Button variant="secondary" size="sm" isDisabled={!nextCursor || isLoading} onPress={() => { if (nextCursor) setCursors((current) => [...current, nextCursor]); }}>{t("favorites.next")}</Button>
        </nav>
      ) : null}
    </FavoritesPageShell>
  );
}
