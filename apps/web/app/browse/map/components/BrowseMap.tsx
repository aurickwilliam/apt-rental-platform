"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "next-themes";
import { Button, toast } from "@heroui/react";
import { IconCurrentLocation } from "@tabler/icons-react";

import type { BBox } from "@repo/utils";

import { getGoogleMaps, loadGoogleMaps, type GoogleMapInstance } from "@/lib/google-maps-loader";

import type { MapView } from "../../lib/map-view";
import { useMapPins, type MapPin } from "./useMapPins";
import { useMapPopup } from "./useMapPopup";

/** Wait for the camera to settle before reporting it, so a drag is one search, not hundreds. */
const IDLE_DEBOUNCE_MS = 350;
const LOCATE_ZOOM = 15;

interface BrowseMapProps {
  initialView: MapView;
  pins: MapPin[];
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string | null) => void;
  onHover: (id: string | null) => void;
  /** The visible area and camera after every settled pan or zoom (and once on load). */
  onViewportChange: (visible: BBox, view: MapView) => void;
  /** The map failed to load; the page falls back to listing the default area. (A missing key is detected by the page.) */
  onUnavailable: () => void;
  /** Where the popup opens: a point on the map, above its pin. `id` restarts it for a new listing. */
  popupAnchor?: { id: string; lat: number; lng: number } | null;
  /** The popup content, e.g. the selected listing's preview card. */
  popup?: ReactNode;
}

/** Breathing room kept between an opened popup and the map's edges. */
const POPUP_EDGE_PADDING_PX = 16;

type Status = "loading" | "ready" | "missing-key" | "error";

export default function BrowseMap({
  initialView,
  pins,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  onViewportChange,
  onUnavailable,
  popupAnchor = null,
  popup,
}: BrowseMapProps) {
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const savedViewRef = useRef<MapView | null>(null);
  const initialViewRef = useRef(initialView);
  const handlersRef = useRef({ onSelect, onViewportChange, onUnavailable });

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const [status, setStatus] = useState<Status>(() => (!apiKey ? "missing-key" : "loading"));
  const [map, setMap] = useState<GoogleMapInstance | null>(null);

  useEffect(() => {
    handlersRef.current = { onSelect, onViewportChange, onUnavailable };
  });

  useMapPins({ map, pins, selectedId, hoveredId, onSelect: (id) => onSelect(id), onHover });
  const popupElement = useMapPopup(map, popupAnchor, popupAnchor?.id ?? null);

  // A popup opened near an edge would be cut off: pan the map just enough to
  // bring all of it into view.
  useEffect(() => {
    const container = containerRef.current;
    if (!map || !popupElement || !container) return;
    const frame = requestAnimationFrame(() => {
      const bounds = container.getBoundingClientRect();
      const card = popupElement.getBoundingClientRect();
      if (card.width === 0) return;
      const pad = POPUP_EDGE_PADDING_PX;
      const shiftX = Math.max(0, bounds.left + pad - card.left) - Math.max(0, card.right - (bounds.right - pad));
      const shiftY = Math.max(0, bounds.top + pad - card.top) - Math.max(0, card.bottom - (bounds.bottom - pad));
      // The content must move by (shiftX, shiftY), which is the map center moving the other way.
      if (shiftX !== 0 || shiftY !== 0) map.panBy(-shiftX, -shiftY);
    });
    return () => cancelAnimationFrame(frame);
  }, [map, popupElement]);
  useEffect(() => {
    if (!apiKey || !resolvedTheme) return;

    let cancelled = false;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    let instance: GoogleMapInstance | null = null;

    loadGoogleMaps(apiKey)
      .then(() => {
        const maps = getGoogleMaps();
        if (cancelled || !containerRef.current) return;
        if (!maps) {
          setStatus("error");
          handlersRef.current.onUnavailable();
          return;
        }

        // Google only reads colorScheme at construction, so an Appearance change
        // rebuilds the map; restore the camera it had.
        const start = savedViewRef.current ?? initialViewRef.current;
        const created = new maps.Map(containerRef.current, {
          center: { lat: start.lat, lng: start.lng },
          zoom: start.zoom,
          mapTypeId: "roadmap",
          colorScheme: resolvedTheme === "dark" ? "DARK" : "LIGHT",
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          // The map owns its column, so the wheel should zoom it directly.
          gestureHandling: "greedy",
        });
        instance = created;

        const emitViewport = () => {
          const bounds = created.getBounds();
          const center = created.getCenter();
          if (!bounds || !center) return;
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();
          const view = { lat: center.lat(), lng: center.lng(), zoom: created.getZoom() ?? start.zoom };
          savedViewRef.current = view;
          handlersRef.current.onViewportChange(
            { minLat: sw.lat(), maxLat: ne.lat(), minLng: sw.lng(), maxLng: ne.lng() },
            view,
          );
        };

        let firstIdle = true;
        created.addListener("idle", () => {
          if (idleTimer) clearTimeout(idleTimer);
          if (firstIdle) {
            firstIdle = false;
            emitViewport();
            return;
          }
          idleTimer = setTimeout(emitViewport, IDLE_DEBOUNCE_MS);
        });
        created.addListener("click", () => handlersRef.current.onSelect(null));

        setMap(created);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        console.error("Google Maps initialization failed", error);
        if (cancelled) return;
        setStatus("error");
        handlersRef.current.onUnavailable();
      });

    return () => {
      cancelled = true;
      if (idleTimer) clearTimeout(idleTimer);
      if (instance) getGoogleMaps()?.event.clearInstanceListeners(instance);
      setMap(null);
    };
  }, [apiKey, resolvedTheme]);

  // The map column can start hidden (phone list view) or change size; Google
  // only redraws tiles when told the container's size changed.
  useEffect(() => {
    const element = containerRef.current;
    if (!map || !element) return;
    const observer = new ResizeObserver(() => {
      if (element.clientWidth > 0) getGoogleMaps()?.event.trigger(map, "resize");
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [map]);

  const locateMe = () => {
    if (!map || !navigator.geolocation) {
      toast.warning("Your browser can't share your location");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        map.panTo({ lat: position.coords.latitude, lng: position.coords.longitude });
        map.setZoom(LOCATE_ZOOM);
      },
      () => toast.warning("Allow location access to center the map on you"),
      { maximumAge: 60_000, timeout: 10_000 },
    );
  };

  if (status === "missing-key" || status === "error") {
    return (
      <div className="flex size-full items-center justify-center rounded-2xl border border-border bg-surface-secondary p-6 text-center">
        <p className={`text-sm ${status === "error" ? "text-danger" : "text-muted-foreground"}`}>
          {status === "error"
            ? "The map couldn't load. Check your connection; the list still shows listings in the default area."
            : "The map isn't available right now. The list shows listings in the default area."}
        </p>
      </div>
    );
  }

  return (
    <div className="relative size-full overflow-hidden rounded-2xl border border-border bg-surface-secondary">
      {status === "loading" ? (
        <div className="absolute inset-0 animate-pulse bg-surface-secondary" aria-label="Loading map" role="status" />
      ) : null}
      <div ref={containerRef} className="size-full" />

      <Button
        isIconOnly
        variant="tertiary"
        size="lg"
        onPress={locateMe}
        aria-label="Center the map on my location"
        data-fab-clearance="browse-map-controls"
        className="absolute top-3 right-3 cursor-pointer shadow-lg"
      >
        <IconCurrentLocation size={20} />
      </Button>

      {popupElement && popup ? createPortal(popup, popupElement) : null}
    </div>
  );
}
