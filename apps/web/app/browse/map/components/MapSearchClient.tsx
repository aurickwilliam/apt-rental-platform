"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@heroui/react";
import { IconList, IconMap2 } from "@tabler/icons-react";

import { bboxContains, expandBBox, filterPinsToVisible, type BBox } from "@repo/utils";
import { createClient } from "@repo/supabase/browser";

import AuthPromptModal from "@/app/components/ui/AuthPromptModal";
import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { useFavoriteActions } from "@/hooks/use-favorite-actions";

import FilterDrawerButton from "../../components/FilterDrawerButton";
import SearchContainer from "../../components/SearchContainer";
import type { MapSearchLayout } from "../../lib/browse-layout";
import { fetchApartmentsInBounds, type MapResults } from "../../lib/fetch-map-results";
import {
  DEFAULT_MAP_BBOX,
  browseFilterParams,
  filterParamsKey,
  filtersFromKey,
  mapViewParams,
  parseMapView,
  type MapView,
} from "../../lib/map-view";
import BrowseMap from "./BrowseMap";
import MapPreviewCard from "./MapPreviewCard";
import MapResultsList from "./MapResultsList";
import type { MapPin } from "./useMapPins";

/** Extra area queried per side, so small pans reuse loaded results instead of refetching. */
const QUERY_MARGIN = 0.25;
const EMPTY_RESULTS: MapResults = { apartments: [], capped: false };
const FALLBACK_QUERIED = expandBBox(DEFAULT_MAP_BBOX, QUERY_MARGIN);
const HAS_MAP_KEY = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);

interface MapSearchClientProps {
  /** Where listings live: `/browse` (public) or `/tenant/browse`. */
  basePath: string;
  /** Desktop height of the split view (the page itself doesn't scroll). */
  layout: MapSearchLayout;
}

export default function MapSearchClient({ basePath, layout }: MapSearchClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const mapPath = `${basePath}/map`;

  // Filters come from the URL; the camera params must not count as a filter
  // change or every pan would refetch.
  const filtersKey = filterParamsKey(browseFilterParams(searchParams));
  const filters = useMemo(() => filtersFromKey(filtersKey), [filtersKey]);

  const [initialView] = useState<MapView>(() => parseMapView(searchParams));
  const [visible, setVisible] = useState<BBox | null>(null);
  const [queried, setQueried] = useState<BBox | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  // Phones show one pane at a time; the map first, like the mobile app.
  const [phonePane, setPhonePane] = useState<"map" | "list">("map");
  // Desktop only: the map takes the whole split view (Airbnb's expand button).
  const [expanded, setExpanded] = useState(false);
  const lastViewRef = useRef<MapView | null>(null);
  const { isFavorite, activeFavoriteId, onToggleFavorite, isAuthModalOpen, setIsAuthModalOpen } =
    useFavoriteActions();
  const toggleFavorite = useCallback(
    (id: string) => {
      void onToggleFavorite(id);
    },
    [onToggleFavorite],
  );

  const mapUnavailable = !HAS_MAP_KEY || loadFailed;
  const activeVisible = visible ?? (mapUnavailable ? DEFAULT_MAP_BBOX : null);
  const activeQueried = queried ?? (mapUnavailable ? FALLBACK_QUERIED : null);

  const load = useCallback(async (): Promise<MapResults> => {
    if (!activeQueried) return EMPTY_RESULTS;
    return fetchApartmentsInBounds(createClient(), filters, activeQueried);
  }, [activeQueried, filters]);

  const { data, loading, error, refresh } = useAsyncResource(
    load,
    EMPTY_RESULTS,
    t("browse.map.loadFailed"),
  );

  // Search and filter changes update the URL in place: a router navigation would
  // remount the page and drop the map and its results. Next folds a native
  // history update into useSearchParams, but only when the state argument is not
  // the router's own (so null, never window.history.state).
  const replaceUrl = useCallback((href: string) => {
    window.history.replaceState(null, "", href);
  }, []);

  const handleViewportChange = useCallback((nextVisible: BBox, view: MapView) => {
    setVisible(nextVisible);
    // Small pans stay inside the buffered area already loaded; only leaving it searches again.
    setQueried((current) =>
      current && bboxContains(current, nextVisible) ? current : expandBBox(nextVisible, QUERY_MARGIN),
    );

    // Keep the camera in the URL so Back from a listing reopens this area.
    lastViewRef.current = view;
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(mapViewParams(view))) url.searchParams.set(key, value);
    window.history.replaceState(null, "", url);
  }, []);

  // A filter change rewrites the query string without the camera; put it back.
  const hasCameraParams = searchParams.has("lat");
  useEffect(() => {
    const view = lastViewRef.current;
    if (!view || hasCameraParams) return;
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(mapViewParams(view))) url.searchParams.set(key, value);
    window.history.replaceState(null, "", url);
  }, [hasCameraParams, filtersKey]);

  useEffect(() => {
    if (!expanded) return;
    const collapseOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", collapseOnEscape);
    return () => window.removeEventListener("keydown", collapseOnEscape);
  }, [expanded]);

  const visibleApartments = useMemo(
    () => (activeVisible ? filterPinsToVisible(data.apartments, activeVisible, { keepSelected: false }) : []),
    [data.apartments, activeVisible],
  );
  const pins = useMemo<MapPin[]>(
    () =>
      data.apartments.map((apartment) => ({
        id: apartment.id,
        latitude: apartment.latitude,
        longitude: apartment.longitude,
        price: apartment.price,
      })),
    [data.apartments],
  );
  const selected = useMemo(
    () => data.apartments.find((apartment) => apartment.id === selectedId) ?? null,
    [data.apartments, selectedId],
  );

  // Nothing has been searched for yet: waiting on the map's first viewport, or on its first reply.
  const initialLoading = data === EMPTY_RESULTS && !error && (activeQueried === null || loading);

  const listQuery = new URLSearchParams(filtersKey).toString();
  const listHref = listQuery ? `${basePath}?${listQuery}` : basePath;
  const filterCount = initialLoading ? undefined : visibleApartments.length;

  return (
    <div className="w-full px-4 pb-4 sm:px-6">
      <div
        className={`z-20 -mx-4 flex items-center gap-2 bg-background px-4 py-4 sm:-mx-6 sm:px-6 lg:sticky ${layout.barTop}`}
      >
        <Button
          variant="tertiary"
          size="lg"
          className="shrink-0 cursor-pointer"
          onPress={() => router.push(listHref)}
          aria-label={t("browse.map.backToList")}
        >
          <IconList size={18} />
          <span className="hidden sm:inline">{t("browse.map.list")}</span>
        </Button>
        <div className="min-w-0 flex-1">
          <Suspense>
            <SearchContainer
              compact
              basePath={mapPath}
              navigate={replaceUrl}
              filterButton={
                <FilterDrawerButton basePath={mapPath} resultCount={filterCount} navigate={replaceUrl} />
              }
            />
          </Suspense>
        </div>
      </div>

      <div
        className={`grid gap-4 ${expanded ? "lg:grid-cols-1" : "lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]"}`}
      >
        <section
          aria-label={t("browse.map.listAria")}
          className={`min-w-0 ${phonePane === "map" ? "hidden" : ""} ${expanded ? "lg:hidden" : "lg:block"}`}
        >
          <MapResultsList
            apartments={visibleApartments}
            initialLoading={initialLoading}
            searching={loading}
            capped={data.capped}
            error={error}
            onRetry={() => void refresh()}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onHover={setHoveredId}
            isFavorite={isFavorite}
            activeFavoriteId={activeFavoriteId}
            onToggleFavorite={toggleFavorite}
            basePath={basePath}
          />
        </section>

        <section
          aria-label={t("browse.map.aria")}
          className={`min-w-0 h-[calc(100dvh-14rem)] lg:sticky lg:self-start ${layout.mapSticky} ${
            phonePane === "list" ? "hidden lg:block" : ""
          }`}
        >
          <BrowseMap
            initialView={initialView}
            pins={pins}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onSelect={setSelectedId}
            onHover={setHoveredId}
            onViewportChange={handleViewportChange}
            onUnavailable={() => setLoadFailed(true)}
            expanded={expanded}
            onToggleExpand={() => setExpanded((current) => !current)}
            popupAnchor={selected ? { id: selected.id, lat: selected.latitude, lng: selected.longitude } : null}
            popup={
              selected ? (
                <MapPreviewCard
                  apartment={selected}
                  isFavorite={isFavorite(selected.id)}
                  isFavoriteLoading={activeFavoriteId === selected.id}
                  onToggleFavorite={() => toggleFavorite(selected.id)}
                  onOpen={() => router.push(`${basePath}/${selected.id}`)}
                  onClose={() => setSelectedId(null)}
                />
              ) : null
            }
          />
        </section>
      </div>

      <AuthPromptModal
        isOpen={isAuthModalOpen}
        onOpenChange={setIsAuthModalOpen}
        title={t("favorites.signInTitle")}
        description={t("favorites.signInBody")}
      />

      <Button
        size="lg"
        onPress={() => setPhonePane(phonePane === "map" ? "list" : "map")}
        data-fab-clearance="browse-map-toggle"
        className="fixed bottom-6 left-1/2 z-20 -translate-x-1/2 cursor-pointer rounded-full shadow-xl lg:hidden"
      >
        {phonePane === "map" ? <IconList size={18} /> : <IconMap2 size={18} />}
        {phonePane === "map" ? t("browse.map.showList") : t("browse.map.showMap")}
      </Button>
    </div>
  );
}
