"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

import {
  getGoogleMaps,
  loadGoogleMaps,
  type GoogleLatLngLiteral,
  type GoogleMapInstance,
  type GoogleMapMouseEvent,
} from "@/lib/google-maps-loader";
import { createMapPickerPin, type MapPickerPin } from "@/lib/map-picker-pin";
import { centerMapOnUser } from "@/lib/map-locate";
import MapControls from "@/app/browse/map/components/MapControls";

const DEFAULT_CENTER = { lat: 14.665, lng: 120.967 };

interface MapView {
  center: GoogleLatLngLiteral;
  zoom: number;
}

interface Props {
  latitude: number | null;
  longitude: number | null;
  onPick?: (lat: number, lng: number) => void;
  error?: string;
  showHeader?: boolean;
  mapHeightClass?: string;
  readOnly?: boolean;
  /** Prints the coordinates under the map (the pin picker's default). */
  showCoordinates?: boolean;
  /** Replaces the rounded border around the map, for callers that supply their own frame. */
  frameClassName?: string;
  /** Swaps Google's controls for the map search's (zoom, locate, optional expand). */
  appControls?: boolean;
  /** Adds the expand button to the app controls. */
  onExpand?: () => void;
}

type Status = "loading" | "ready" | "missing-key" | "error";

export default function GoogleMapPicker({
  latitude,
  longitude,
  onPick,
  error,
  showHeader = true,
  mapHeightClass = "h-80",
  readOnly = false,
  showCoordinates = true,
  frameClassName,
  appControls = false,
  onExpand,
}: Props) {
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMapInstance | null>(null);
  const pinRef = useRef<MapPickerPin | null>(null);
  const onPickRef = useRef(onPick);
  const coordinatesRef = useRef({ latitude, longitude });
  const savedViewRef = useRef<MapView | null>(null);

  useEffect(() => {
    onPickRef.current = onPick;
  });

  useEffect(() => {
    coordinatesRef.current = { latitude, longitude };
  }, [latitude, longitude]);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const [status, setStatus] = useState<Status>(() => (!apiKey ? "missing-key" : "loading"));

  useEffect(() => {
    if (!apiKey || !resolvedTheme) return;

    let cancelled = false;

    loadGoogleMaps(apiKey)
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const maps = getGoogleMaps();
        if (!maps) {
          setStatus("error");
          return;
        }

        const coords = coordinatesRef.current;
        const hasPin = coords.latitude != null && coords.longitude != null;
        const initial: GoogleLatLngLiteral =
          coords.latitude != null && coords.longitude != null
            ? { lat: coords.latitude, lng: coords.longitude }
            : DEFAULT_CENTER;

        // Google only reads colorScheme at construction. Restore the camera
        // when rebuilding after an Appearance change. Always use Map view.
        const map = new maps.Map(containerRef.current, {
          center: savedViewRef.current?.center ?? initial,
          zoom: savedViewRef.current?.zoom ?? (hasPin ? 15 : 13),
          mapTypeId: "roadmap",
          colorScheme: resolvedTheme === "dark" ? "DARK" : "LIGHT",
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          ...(appControls ? { disableDefaultUI: true } : {}),
        });
        mapRef.current = map;

        map.addListener("click", (e: GoogleMapMouseEvent) => {
          if (readOnly || !e.latLng) return;
          onPickRef.current?.(e.latLng.lat(), e.latLng.lng());
        });

        if (coords.latitude != null && coords.longitude != null) {
          const pin = createMapPickerPin(maps, {
            position: { lat: coords.latitude, lng: coords.longitude },
            draggable: !readOnly,
            onDragEnd: ({ lat, lng }) => onPickRef.current?.(lat, lng),
          });
          pin.setMap(map);
          pinRef.current = pin;
        }

        setStatus("ready");
      })
      .catch((error: unknown) => {
        console.error("Google Maps initialization failed", error);
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      const maps = getGoogleMaps();
      const map = mapRef.current;
      if (map) {
        const center = map.getCenter();
        if (center) {
          savedViewRef.current = {
            center: { lat: center.lat(), lng: center.lng() },
            zoom: map.getZoom() ?? 13,
          };
        }
        maps?.event.clearInstanceListeners(map);
        mapRef.current = null;
      }
      if (pinRef.current) {
        pinRef.current.setMap(null);
        pinRef.current = null;
      }
    };
  }, [apiKey, resolvedTheme, readOnly, appControls]);

  useEffect(() => {
    const maps = getGoogleMaps();
    const map = mapRef.current;
    if (!maps || !map || status !== "ready") return;

    const pin = pinRef.current;
    if (latitude == null || longitude == null) {
      if (pin) {
        pin.setMap(null);
        pinRef.current = null;
      }
      return;
    }

    const position: GoogleLatLngLiteral = { lat: latitude, lng: longitude };
    map.setCenter(position);

    if (pin) {
      pin.setPosition(position);
    } else {
      const next = createMapPickerPin(maps, {
        position,
        draggable: !readOnly,
        onDragEnd: ({ lat, lng }) => onPickRef.current?.(lat, lng),
      });
      next.setMap(map);
      pinRef.current = next;
    }
  }, [latitude, longitude, readOnly, status]);

  // Recalculate tiles after mount/open transitions (e.g. expand modal
  // animation) so the map never renders half-loaded.
  useEffect(() => {
    if (status !== "ready") return;
    const timer = setTimeout(() => {
      const maps = getGoogleMaps();
      const map = mapRef.current;
      if (!maps || !map) return;
      maps.event.trigger(map, "resize");
    }, 350);
    return () => clearTimeout(timer);
  }, [status, latitude, longitude]);

  const zoomBy = (step: number) => {
    const map = mapRef.current;
    if (map) map.setZoom((map.getZoom() ?? 15) + step);
  };

  return (
    <div className="flex flex-col gap-1.5">
      {showHeader && (
        <>
          <p className="font-nunito text-sm font-medium text-foreground">
            Pin Location <span className="text-danger">*</span>
          </p>
          <p className="text-xs text-muted-foreground mb-1">
            Click anywhere on the map to drop a pin on your property&apos;s exact location.
          </p>
        </>
      )}

      <div
        className={`relative w-full ${mapHeightClass} overflow-hidden ${
          frameClassName ?? `rounded-3xl border transition ${error ? "border-danger" : "border-border"}`
        }`}
      >
        {status === "missing-key" ? (
          <div className="w-full h-full flex items-center justify-center bg-muted p-4 text-center">
            <p className="text-xs text-muted-foreground">
              Google Maps API key is missing. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable
              map pinning — or enter coordinates manually.
            </p>
          </div>
        ) : status === "error" ? (
          <div className="w-full h-full flex items-center justify-center bg-muted p-4 text-center">
            <p className="text-xs text-danger">
              Google Maps failed to load. Check your connection and API key, or enter
              coordinates manually.
            </p>
          </div>
        ) : (
          <>
            {status === "loading" && (
              <div className="w-full h-full bg-muted animate-pulse" aria-label="Loading map" />
            )}
            <div ref={containerRef} className="w-full h-full" />
            {appControls && status === "ready" && (
              <MapControls
                onToggleExpand={onExpand}
                expandOnPhones
                onZoomIn={() => zoomBy(1)}
                onZoomOut={() => zoomBy(-1)}
                onLocate={() => {
                  if (mapRef.current) centerMapOnUser(mapRef.current);
                }}
              />
            )}
          </>
        )}
      </div>

      {showCoordinates && latitude != null && longitude != null && (
        <p className="text-xs text-muted-foreground">
          📍 {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </p>
      )}

      {error && <p className="text-danger text-xs">{error}</p>}
    </div>
  );
}
