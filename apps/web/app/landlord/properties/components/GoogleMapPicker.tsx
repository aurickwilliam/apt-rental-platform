"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

import {
  getGoogleMaps,
  loadGoogleMaps,
  type GoogleLatLngLiteral,
  type GoogleMapInstance,
  type GoogleMapMouseEvent,
  type GoogleMarkerInstance,
} from "@/lib/google-maps-loader";

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
}: Props) {
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMapInstance | null>(null);
  const markerRef = useRef<GoogleMarkerInstance | null>(null);
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
        });
        mapRef.current = map;

        map.addListener("click", (e: GoogleMapMouseEvent) => {
          if (readOnly || !e.latLng) return;
          onPickRef.current?.(e.latLng.lat(), e.latLng.lng());
        });

        if (coords.latitude != null && coords.longitude != null) {
          const marker = new maps.Marker({
            position: { lat: coords.latitude, lng: coords.longitude },
            map,
            draggable: !readOnly,
          });
          if (!readOnly) {
            marker.addListener("dragend", () => {
              const pos = marker.getPosition();
              if (!pos) return;
              onPickRef.current?.(pos.lat(), pos.lng());
            });
          }
          markerRef.current = marker;
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
      if (markerRef.current) {
        maps?.event.clearInstanceListeners(markerRef.current);
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
    };
  }, [apiKey, resolvedTheme, readOnly]);

  useEffect(() => {
    const maps = getGoogleMaps();
    const map = mapRef.current;
    if (!maps || !map || status !== "ready") return;

    const marker = markerRef.current;
    if (latitude == null || longitude == null) {
      if (marker) {
        maps.event.clearInstanceListeners(marker);
        marker.setMap(null);
        markerRef.current = null;
      }
      return;
    }

    const position: GoogleLatLngLiteral = { lat: latitude, lng: longitude };
    map.setCenter(position);

    if (marker) {
      marker.setPosition(position);
    } else {
      const next = new maps.Marker({ position, map, draggable: !readOnly });
      if (!readOnly) {
        next.addListener("dragend", () => {
          const pos = next.getPosition();
          if (!pos) return;
          onPickRef.current?.(pos.lat(), pos.lng());
        });
      }
      markerRef.current = next;
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
        className={`relative w-full ${mapHeightClass} overflow-hidden rounded-3xl border transition ${
          error ? "border-danger" : "border-border"
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
          </>
        )}
      </div>

      {latitude != null && longitude != null && (
        <p className="text-xs text-muted-foreground">
          📍 {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </p>
      )}

      {error && <p className="text-danger text-xs">{error}</p>}
    </div>
  );
}
