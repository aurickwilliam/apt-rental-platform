import { toast } from "@heroui/react";

import type { GoogleMapInstance } from "@/lib/google-maps-loader";

const LOCATE_ZOOM = 15;

// Centers a map on the visitor's position for the map controls' locate button
// (map search and the apartment page share it).
export function centerMapOnUser(map: GoogleMapInstance): void {
  if (!navigator.geolocation) {
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
}
