"use client";

import { memo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { Button, Spinner } from "@heroui/react";
import { IconMapPin } from "@tabler/icons-react";

import ApartmentCard from "@/app/components/ui/ApartmentCard";
import ErrorBanner from "@/app/components/display/ErrorBanner";
import { useTranslation } from "@/app/components/i18n/LocaleProvider";

import { MAP_LIST_GRID_CLASS } from "../../lib/browse-layout";
import { MAP_RESULT_LIMIT, type MapApartment } from "../../lib/fetch-map-results";
import { BrowseCardsSkeleton } from "../../components/BrowsePageSkeleton";

interface MapResultsListProps {
  /** Listings inside the visible map area. */
  apartments: MapApartment[];
  /** Nothing has loaded yet (first search for this view). */
  initialLoading: boolean;
  /** A search for the current view is running; the list keeps its cards meanwhile. */
  searching: boolean;
  capped: boolean;
  error: string | null;
  onRetry: () => void;
  selectedId: string | null;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  /** Favorites state and toggle, owned by the page so the map's preview card shares them. */
  isFavorite: (id: string) => boolean;
  activeFavoriteId: string | null;
  onToggleFavorite: (id: string) => void;
  basePath: string;
}

const ResultCard = memo(function ResultCard({
  apartment,
  active,
  isFavorite,
  isFavoriteLoading,
  onOpen,
  onToggleFavorite,
  onHover,
  registerRef,
}: {
  apartment: MapApartment;
  active: boolean;
  isFavorite: boolean;
  isFavoriteLoading: boolean;
  onOpen: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onHover: (id: string | null) => void;
  registerRef: (id: string, element: HTMLDivElement | null) => void;
}) {
  return (
    <div
      ref={(element) => registerRef(apartment.id, element)}
      className={`min-w-0 scroll-mt-28 rounded-xl transition-shadow ${active ? "ring-2 ring-primary" : ""}`}
      onMouseEnter={() => onHover(apartment.id)}
      onMouseLeave={() => onHover(null)}
    >
      <ApartmentCard
        name={apartment.name}
        location={apartment.location}
        price={apartment.price}
        rating={apartment.rating}
        isVerified={apartment.isVerified}
        thumbnailUrl={apartment.image}
        isFavorite={isFavorite}
        isFavoriteLoading={isFavoriteLoading}
        onFavoritePress={() => onToggleFavorite(apartment.id)}
        onPress={() => onOpen(apartment.id)}
        sizes="(max-width: 1024px) 50vw, 25vw"
      />
    </div>
  );
});

export default function MapResultsList({
  apartments,
  initialLoading,
  searching,
  capped,
  error,
  onRetry,
  selectedId,
  hoveredId,
  onHover,
  isFavorite,
  activeFavoriteId,
  onToggleFavorite,
  basePath,
}: MapResultsListProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const cardRefs = useRef(new Map<string, HTMLDivElement>());

  const registerRef = (id: string, element: HTMLDivElement | null) => {
    if (element) cardRefs.current.set(id, element);
    else cardRefs.current.delete(id);
  };

  // Picking a pin on the map brings its card into view; hovering never scrolls.
  useEffect(() => {
    if (!selectedId) return;
    cardRefs.current.get(selectedId)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedId]);

  const openApartment = (id: string) => router.push(`${basePath}/${id}`);
  const count = apartments.length;

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex min-h-8 items-center justify-between gap-2">
        <h2 className="font-nunito text-lg font-semibold" aria-live="polite">
          {initialLoading
            ? t("browse.map.searchingArea")
            : capped
              ? t("browse.map.countCapped", { count })
              : count === 1
                ? t("browse.map.countOne", { count })
                : t("browse.map.countOther", { count })}
        </h2>
        {searching && !initialLoading ? (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Spinner size="sm" color="current" aria-label={t("browse.map.searching")} />
            {t("browse.map.searchingEllipsis")}
          </span>
        ) : null}
      </div>

      {error ? (
        <ErrorBanner message={error}>
          <Button size="sm" variant="tertiary" className="mt-2 cursor-pointer" onPress={onRetry}>
            {t("browse.map.retry")}
          </Button>
        </ErrorBanner>
      ) : null}

      {initialLoading ? (
        <BrowseCardsSkeleton count={6} className={MAP_LIST_GRID_CLASS} />
      ) : count === 0 && !error ? (
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-16 text-center text-muted-foreground">
          <IconMapPin size={32} aria-hidden="true" />
          <p className="text-base font-medium text-foreground">{t("browse.map.emptyTitle")}</p>
          <p className="text-sm">{t("browse.map.emptyHint")}</p>
        </div>
      ) : (
        <div className={MAP_LIST_GRID_CLASS}>
          {apartments.map((apartment) => (
            <ResultCard
              key={apartment.id}
              apartment={apartment}
              active={apartment.id === selectedId || apartment.id === hoveredId}
              isFavorite={isFavorite(apartment.id)}
              isFavoriteLoading={activeFavoriteId === apartment.id}
              onOpen={openApartment}
              onToggleFavorite={onToggleFavorite}
              onHover={onHover}
              registerRef={registerRef}
            />
          ))}
        </div>
      )}

      {capped && !initialLoading ? (
        <p className="text-center text-sm text-muted-foreground">
          {t("browse.map.capped", { count: MAP_RESULT_LIMIT })}
        </p>
      ) : null}
    </div>
  );
}
