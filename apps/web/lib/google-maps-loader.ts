// One Google Maps JS loader and the slice of its types the app uses, shared by
// the landlord pin picker and the tenant map search. The API is loaded once per
// page from a script tag (no wrapper dependency) with NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.

const SCRIPT_ID = "google-maps-js";

// Google calls this global once the API is usable. Asking for it (and
// `loading=async`) avoids the "loaded directly without loading=async" warning;
// resolving from `onload` alone could run before `google.maps` exists.
const READY_CALLBACK = "__aptGoogleMapsReady";

export interface GoogleLatLngLiteral {
  lat: number;
  lng: number;
}

export interface GoogleLatLng {
  lat(): number;
  lng(): number;
}

export interface GoogleMapMouseEvent {
  latLng: GoogleLatLng | null;
}

export interface GoogleLatLngBounds {
  getNorthEast(): GoogleLatLng;
  getSouthWest(): GoogleLatLng;
}

export interface GoogleMapPoint {
  x: number;
  y: number;
}

export interface GoogleMapProjection {
  fromLatLngToDivPixel(latLng: GoogleLatLng | GoogleLatLngLiteral): GoogleMapPoint | null;
  /** Div-pixel coordinates (the overlay pane's frame) back to a point on the map. */
  fromDivPixelToLatLng(pixel: GoogleMapPoint): GoogleLatLng;
}

export interface GoogleMapPanes {
  overlayMouseTarget: HTMLElement;
  /** Topmost pane, above the pins: for popups anchored to a point. */
  floatPane: HTMLElement;
}

export interface GoogleOverlayView {
  setMap(map: GoogleMapInstance | null): void;
  getPanes(): GoogleMapPanes | null;
  getProjection(): GoogleMapProjection | null;
  draw(): void;
}

export interface GoogleMapInstance {
  addListener(eventName: string, handler: (e: GoogleMapMouseEvent) => void): void;
  setCenter(position: GoogleLatLngLiteral): void;
  panTo(position: GoogleLatLngLiteral): void;
  /** Moves the center by a pixel distance (positive x/y move the center right/down). */
  panBy(x: number, y: number): void;
  setZoom(zoom: number): void;
  getCenter(): GoogleLatLng | undefined;
  getZoom(): number | undefined;
  getBounds(): GoogleLatLngBounds | undefined;
}

export interface GoogleMapOptions {
  center: GoogleLatLngLiteral;
  zoom: number;
  mapTypeId?: string;
  colorScheme: "DARK" | "LIGHT";
  mapTypeControl?: boolean;
  streetViewControl?: boolean;
  fullscreenControl?: boolean;
  gestureHandling?: "cooperative" | "greedy" | "none" | "auto";
  clickableIcons?: boolean;
  /** Drops every default control (zoom, camera, map type, street view, fullscreen). */
  disableDefaultUI?: boolean;
}

export interface GoogleMapsNamespace {
  Map: new (element: HTMLElement, options: GoogleMapOptions) => GoogleMapInstance;
  OverlayView: new () => GoogleOverlayView;
  Point: new (x: number, y: number) => GoogleMapPoint;
  event: {
    clearInstanceListeners(instance: unknown): void;
    trigger(instance: unknown, eventName: string): void;
  };
}

export function getGoogleMaps(): GoogleMapsNamespace | null {
  const w = window as unknown as { google?: { maps?: GoogleMapsNamespace } };
  return w.google?.maps ?? null;
}

let loadPromise: Promise<void> | null = null;

export function loadGoogleMaps(apiKey: string): Promise<void> {
  const existing = getGoogleMaps();
  if (existing) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const browserWindow = window as unknown as Record<string, unknown>;
    const script = document.createElement("script");

    const clearCallback = () => {
      delete browserWindow[READY_CALLBACK];
    };

    const fail = (error: Error) => {
      clearCallback();
      script.remove();
      loadPromise = null;
      reject(error);
    };

    browserWindow[READY_CALLBACK] = () => {
      if (getGoogleMaps()) {
        clearCallback();
        resolve();
      } else {
        fail(new Error("Google Maps failed to initialize."));
      }
    };

    script.id = SCRIPT_ID;
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
      `&v=weekly&loading=async&callback=${READY_CALLBACK}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => fail(new Error("Google Maps script failed to load."));
    document.head.appendChild(script);
  });

  return loadPromise;
}
