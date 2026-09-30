"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_CENTER = { lat: 14.665, lng: 120.967 };
const SCRIPT_ID = "google-maps-js";

interface GoogleLatLngLiteral {
  lat: number;
  lng: number;
}

interface GoogleLatLng {
  lat(): number;
  lng(): number;
}

interface GoogleMapMouseEvent {
  latLng: GoogleLatLng | null;
}

interface GoogleMapInstance {
  addListener(eventName: string, handler: (e: GoogleMapMouseEvent) => void): void;
  setCenter(position: GoogleLatLngLiteral): void;
}

interface GoogleMarkerInstance {
  addListener(eventName: string, handler: () => void): void;
  setPosition(position: GoogleLatLngLiteral): void;
  setMap(map: GoogleMapInstance | null): void;
  getPosition(): GoogleLatLng | null;
}

interface GoogleMapsNamespace {
  Map: new (
    element: HTMLElement,
    options: {
      center: GoogleLatLngLiteral;
      zoom: number;
      mapTypeControl?: boolean;
      streetViewControl?: boolean;
      fullscreenControl?: boolean;
    },
  ) => GoogleMapInstance;
  Marker: new (options: {
    position: GoogleLatLngLiteral;
    map: GoogleMapInstance;
    draggable?: boolean;
  }) => GoogleMarkerInstance;
  event: {
    clearInstanceListeners(instance: unknown): void;
    trigger(instance: unknown, eventName: string): void;
  };
}

function getGoogleMaps(): GoogleMapsNamespace | null {
  const w = window as unknown as { google?: { maps?: GoogleMapsNamespace } };
  return w.google?.maps ?? null;
}

let loadPromise: Promise<void> | null = null;

function loadGoogleMaps(apiKey: string): Promise<void> {
  const existing = getGoogleMaps();
  if (existing) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (getGoogleMaps()) {
        resolve();
      } else {
        loadPromise = null;
        reject(new Error("Google Maps failed to initialize."));
      }
    };
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Google Maps script failed to load."));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

interface Props {
  latitude: number | null;
  longitude: number | null;
  onPick: (lat: number, lng: number) => void;
  error?: string;
  showHeader?: boolean;
  mapHeightClass?: string;
}

type Status = "loading" | "ready" | "missing-key" | "error";

export default function GoogleMapPicker({
  latitude,
  longitude,
  onPick,
  error,
  showHeader = true,
  mapHeightClass = "h-80",
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMapInstance | null>(null);
  const markerRef = useRef<GoogleMarkerInstance | null>(null);
  const onPickRef = useRef(onPick);

  useEffect(() => {
    onPickRef.current = onPick;
  });

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const [status, setStatus] = useState<Status>(() => (!apiKey ? "missing-key" : "loading"));
  const [initialCoords] = useState(() => ({ latitude, longitude }));

  useEffect(() => {
    if (!apiKey) return;

    let cancelled = false;

    loadGoogleMaps(apiKey)
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const maps = getGoogleMaps();
        if (!maps) {
          setStatus("error");
          return;
        }

        const initial: GoogleLatLngLiteral =
          initialCoords.latitude != null && initialCoords.longitude != null
            ? { lat: initialCoords.latitude, lng: initialCoords.longitude }
            : DEFAULT_CENTER;

        const map = new maps.Map(containerRef.current, {
          center: initial,
          zoom: initialCoords.latitude != null && initialCoords.longitude != null ? 15 : 13,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: false,
        });
        mapRef.current = map;

        map.addListener("click", (e: GoogleMapMouseEvent) => {
          if (!e.latLng) return;
          onPickRef.current(e.latLng.lat(), e.latLng.lng());
        });

        if (initialCoords.latitude != null && initialCoords.longitude != null) {
          const marker = new maps.Marker({
            position: { lat: initialCoords.latitude, lng: initialCoords.longitude },
            map,
            draggable: true,
          });
          marker.addListener("dragend", () => {
            const pos = marker.getPosition();
            if (!pos) return;
            onPickRef.current(pos.lat(), pos.lng());
          });
          markerRef.current = marker;
        }

        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey, initialCoords]);

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
      const next = new maps.Marker({ position, map, draggable: true });
      next.addListener("dragend", () => {
        const pos = next.getPosition();
        if (!pos) return;
        onPickRef.current(pos.lat(), pos.lng());
      });
      markerRef.current = next;
    }
  }, [latitude, longitude, status]);

  useEffect(() => {
    return () => {
      const maps = getGoogleMaps();
      if (maps) {
        if (markerRef.current) {
          maps.event.clearInstanceListeners(markerRef.current);
          markerRef.current.setMap(null);
          markerRef.current = null;
        }
        if (mapRef.current) {
          maps.event.clearInstanceListeners(mapRef.current);
          mapRef.current = null;
        }
      }
    };
  }, []);

  // Recalculate tiles after mount/open transitions (e.g. expand modal
  // animation) so the map never renders half-loaded.
  useEffect(() => {
    if (status !== "ready") return;
    const timer = setTimeout(() => {
      const maps = getGoogleMaps();
      const map = mapRef.current;
      if (!maps || !map) return;
      maps.event.trigger(map, "resize");
      if (latitude != null && longitude != null) {
        map.setCenter({ lat: latitude, lng: longitude });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [status, latitude, longitude]);

  return (
    <div className="flex flex-col gap-1.5">
      {showHeader && (
        <>
          <p className="text-sm font-medium">
            Pin Location <span className="text-danger">*</span>
          </p>
          <p className="text-xs text-grey-400 mb-1">
            Click anywhere on the map to drop a pin on your property&apos;s exact location.
          </p>
        </>
      )}

      <div
        className={`relative w-full ${mapHeightClass} overflow-hidden rounded-lg border transition ${
          error ? "border-danger" : "border-grey-300"
        }`}
      >
        {status === "missing-key" ? (
          <div className="w-full h-full flex items-center justify-center bg-grey-100 p-4 text-center">
            <p className="text-xs text-grey-500">
              Google Maps API key is missing. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable
              map pinning — or enter coordinates manually.
            </p>
          </div>
        ) : status === "error" ? (
          <div className="w-full h-full flex items-center justify-center bg-grey-100 p-4 text-center">
            <p className="text-xs text-danger">
              Google Maps failed to load. Check your connection and API key, or enter
              coordinates manually.
            </p>
          </div>
        ) : (
          <>
            {status === "loading" && (
              <div className="w-full h-full bg-grey-100 animate-pulse" aria-label="Loading map" />
            )}
            <div ref={containerRef} className="w-full h-full" />
          </>
        )}
      </div>

      {latitude != null && longitude != null && (
        <p className="text-xs text-grey-400">
          📍 {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </p>
      )}

      {error && <p className="text-danger text-xs">{error}</p>}
    </div>
  );
}
