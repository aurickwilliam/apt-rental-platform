"use client";

import { useEffect, useRef, type RefObject } from "react";

import { formatPricePill } from "@repo/utils";

import {
  getGoogleMaps,
  type GoogleLatLngLiteral,
  type GoogleMapInstance,
  type GoogleMapsNamespace,
  type GoogleOverlayView,
} from "@/lib/google-maps-loader";

export interface MapPin {
  id: string;
  latitude: number;
  longitude: number;
  price: number;
}

interface PinHandlers {
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

interface PinOverlay extends GoogleOverlayView {
  update(pin: MapPin): void;
  setActive(active: boolean): void;
}

// Price pills are plain HTML overlays instead of Google markers: no Cloud Map
// ID is needed, and the pills pick up the app's surface tokens in light and
// dark mode. Resting is a surface pill; hovered or selected turns APT blue.
const PILL_BASE =
  "absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer select-none whitespace-nowrap rounded-full border px-2.5 py-1 font-nunito text-sm font-semibold shadow-md transition-transform duration-150";
const PILL_REST = "border-border bg-surface text-foreground hover:scale-105";
const PILL_ACTIVE = "scale-110 border-primary bg-primary text-primary-foreground";

let pinClass: (new (pin: MapPin, handlers: RefObject<PinHandlers>) => PinOverlay) | null = null;

// Built lazily because the OverlayView base class only exists once Google
// Maps has loaded.
function getPinClass(maps: GoogleMapsNamespace) {
  if (pinClass) return pinClass;

  class PriceOverlay extends maps.OverlayView implements PinOverlay {
    private readonly element = document.createElement("button");
    private position: GoogleLatLngLiteral;

    constructor(pin: MapPin, handlers: RefObject<PinHandlers>) {
      super();
      this.position = { lat: pin.latitude, lng: pin.longitude };
      this.element.type = "button";
      this.element.className = `${PILL_BASE} ${PILL_REST}`;
      this.element.textContent = formatPricePill(pin.price);
      this.element.setAttribute("aria-label", `${formatPricePill(pin.price)} per month, show apartment`);
      // Keep presses and double-clicks on a pill from panning or zooming the map.
      for (const type of ["pointerdown", "dblclick", "click"]) {
        this.element.addEventListener(type, (event) => event.stopPropagation());
      }
      this.element.addEventListener("click", () => handlers.current?.onSelect(pin.id));
      this.element.addEventListener("mouseenter", () => handlers.current?.onHover(pin.id));
      this.element.addEventListener("mouseleave", () => handlers.current?.onHover(null));
    }

    onAdd() {
      this.getPanes()?.overlayMouseTarget.appendChild(this.element);
    }

    draw() {
      const point = this.getProjection()?.fromLatLngToDivPixel(this.position);
      if (!point) return;
      this.element.style.left = `${point.x}px`;
      this.element.style.top = `${point.y}px`;
    }

    onRemove() {
      this.element.remove();
    }

    update(pin: MapPin) {
      this.position = { lat: pin.latitude, lng: pin.longitude };
      this.element.textContent = formatPricePill(pin.price);
      this.draw();
    }

    setActive(active: boolean) {
      this.element.className = `${PILL_BASE} ${active ? PILL_ACTIVE : PILL_REST}`;
      this.element.style.zIndex = active ? "10" : "";
    }
  }

  pinClass = PriceOverlay;
  return pinClass;
}

interface UseMapPinsOptions {
  map: GoogleMapInstance | null;
  pins: MapPin[];
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

/** Keeps one price pill per listing on the map, highlighting the selected or hovered one. */
export function useMapPins({ map, pins, selectedId, hoveredId, onSelect, onHover }: UseMapPinsOptions) {
  const overlaysRef = useRef(new Map<string, PinOverlay>());
  const handlersRef = useRef<PinHandlers>({ onSelect, onHover });

  useEffect(() => {
    handlersRef.current = { onSelect, onHover };
  });

  // A rebuilt map (theme change) or unmount drops every overlay.
  useEffect(() => {
    const overlays = overlaysRef.current;
    return () => {
      overlays.forEach((overlay) => overlay.setMap(null));
      overlays.clear();
    };
  }, [map]);

  useEffect(() => {
    const maps = getGoogleMaps();
    if (!maps || !map) return;
    const Overlay = getPinClass(maps);
    const overlays = overlaysRef.current;
    const ids = new Set(pins.map((pin) => pin.id));

    overlays.forEach((overlay, id) => {
      if (ids.has(id)) return;
      overlay.setMap(null);
      overlays.delete(id);
    });

    for (const pin of pins) {
      const existing = overlays.get(pin.id);
      if (existing) {
        existing.update(pin);
        continue;
      }
      const overlay = new Overlay(pin, handlersRef);
      overlay.setMap(map);
      overlays.set(pin.id, overlay);
    }
  }, [map, pins]);

  useEffect(() => {
    overlaysRef.current.forEach((overlay, id) => overlay.setActive(id === selectedId || id === hoveredId));
  }, [map, pins, selectedId, hoveredId]);
}
