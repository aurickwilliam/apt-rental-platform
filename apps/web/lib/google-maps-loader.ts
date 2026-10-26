// One Google Maps JS loader and the slice of its types the app uses, shared by
// the landlord pin picker and the tenant map search. The API is loaded once per
// page from a script tag (no wrapper dependency) with NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.

const SCRIPT_ID = "google-maps-js";

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
}

export interface GoogleMapPanes {
  overlayMouseTarget: HTMLElement;
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
  setZoom(zoom: number): void;
  getCenter(): GoogleLatLng | undefined;
  getZoom(): number | undefined;
  getBounds(): GoogleLatLngBounds | undefined;
}

export interface GoogleMarkerInstance {
  addListener(eventName: string, handler: () => void): void;
  setPosition(position: GoogleLatLngLiteral): void;
  setMap(map: GoogleMapInstance | null): void;
  getPosition(): GoogleLatLng | null;
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
}

export interface GoogleMapsNamespace {
  Map: new (element: HTMLElement, options: GoogleMapOptions) => GoogleMapInstance;
  Marker: new (options: {
    position: GoogleLatLngLiteral;
    map: GoogleMapInstance;
    draggable?: boolean;
  }) => GoogleMarkerInstance;
  OverlayView: new () => GoogleOverlayView;
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
