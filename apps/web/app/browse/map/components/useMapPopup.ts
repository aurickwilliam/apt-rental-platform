"use client";

import { useEffect, useState } from "react";

import {
  getGoogleMaps,
  type GoogleLatLngLiteral,
  type GoogleMapInstance,
  type GoogleMapsNamespace,
  type GoogleOverlayView,
} from "@/lib/google-maps-loader";

// Gap between the pin's center and the card's edge, so the card clears the pill.
const ANCHOR_GAP_PX = 22;

type PopupConstructor = new (
  position: GoogleLatLngLiteral,
  onElement: (element: HTMLDivElement | null) => void,
) => GoogleOverlayView;

let popupClass: PopupConstructor | null = null;

// Built lazily because the OverlayView base class only exists once Google
// Maps has loaded. The overlay is just an anchored, empty element in the
// float pane (above the pins); React renders the card into it with a portal.
function getPopupClass(maps: GoogleMapsNamespace): PopupConstructor {
  if (popupClass) return popupClass;

  class PopupOverlay extends maps.OverlayView {
    private readonly element = document.createElement("div");

    constructor(
      private readonly position: GoogleLatLngLiteral,
      private readonly onElement: (element: HTMLDivElement | null) => void,
    ) {
      super();
      // Centered above the point, nudged up by the gap.
      this.element.className = "absolute -translate-x-1/2 -translate-y-full cursor-default";
      this.element.style.paddingBottom = `${ANCHOR_GAP_PX}px`;
      // Presses, wheel and clicks on the card must not pan, zoom or deselect the map.
      for (const type of ["pointerdown", "mousedown", "touchstart", "wheel", "dblclick", "click", "contextmenu"]) {
        this.element.addEventListener(type, (event) => event.stopPropagation());
      }
    }

    onAdd() {
      this.getPanes()?.floatPane.appendChild(this.element);
      this.onElement(this.element);
    }

    draw() {
      const point = this.getProjection()?.fromLatLngToDivPixel(this.position);
      if (!point) return;
      this.element.style.left = `${point.x}px`;
      this.element.style.top = `${point.y}px`;
    }

    onRemove() {
      this.element.remove();
      this.onElement(null);
    }
  }

  popupClass = PopupOverlay;
  return popupClass;
}

/**
 * Anchors an element to a point on the map (above it, moving with the map) and
 * returns that element once Google has added it, as a portal target. `key`
 * restarts the popup when a different listing is selected.
 */
export function useMapPopup(
  map: GoogleMapInstance | null,
  position: GoogleLatLngLiteral | null,
  key: string | null,
): HTMLDivElement | null {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const lat = position?.lat;
  const lng = position?.lng;

  useEffect(() => {
    const maps = getGoogleMaps();
    if (!maps || !map || lat == null || lng == null) return;
    const Popup = getPopupClass(maps);
    const overlay = new Popup({ lat, lng }, setElement);
    overlay.setMap(map);
    return () => overlay.setMap(null);
  }, [map, lat, lng, key]);

  return element;
}
