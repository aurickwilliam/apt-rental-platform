// The landlord pin picker's marker is an HTML overlay, like the map search's
// price pills, instead of the deprecated google.maps.Marker — so no Cloud Map ID
// is needed. The editable pin is dragged with Pointer Events and reports its new
// position once, on release.

import type {
  GoogleLatLngLiteral,
  GoogleMapPoint,
  GoogleMapsNamespace,
  GoogleOverlayView,
} from "./google-maps-loader";

/** A press that moves less than this is a tap, not a drag: the pin stays put. */
const DRAG_THRESHOLD_PX = 3;

const PIN_WRAPPER_CLASS = "absolute -translate-x-1/2 -translate-y-full select-none";

// Tabler's `map-pin-filled` (24×24) drawn inline because the overlay builds DOM
// outside React. The white centre dot keeps the pin readable over busy tiles.
const PIN_SVG = [
  '<svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true" class="size-10 text-primary drop-shadow-md">',
  '<path fill="currentColor" d="M18.364 4.636a9 9 0 0 1 .203 12.519l-.203 .21l-4.243 4.242a3 3 0 0 1 -4.097 .135l-.144 -.135l-4.244 -4.243a9 9 0 0 1 12.728 -12.728zm-6.364 3.364a3 3 0 1 0 0 6a3 3 0 0 0 0 -6" />',
  '<circle cx="12" cy="11" r="3" fill="white" />',
  "</svg>",
].join("");

export interface MapPickerPin extends GoogleOverlayView {
  setPosition(position: GoogleLatLngLiteral): void;
}

export interface MapPickerPinOptions {
  position: GoogleLatLngLiteral;
  draggable: boolean;
  onDragEnd: (position: GoogleLatLngLiteral) => void;
}

type PinConstructor = new (options: MapPickerPinOptions) => MapPickerPin;

let pinClass: { maps: GoogleMapsNamespace; Pin: PinConstructor } | null = null;

// Built lazily because the OverlayView base class only exists once Google Maps
// has loaded.
function getPinClass(maps: GoogleMapsNamespace): PinConstructor {
  if (pinClass?.maps === maps) return pinClass.Pin;

  class MapPickerPinOverlay extends maps.OverlayView implements MapPickerPin {
    private readonly element: HTMLDivElement;
    private readonly options: MapPickerPinOptions;
    private position: GoogleLatLngLiteral;
    private startPosition: GoogleLatLngLiteral;
    private startPixel: GoogleMapPoint | null = null;
    private startClient: GoogleMapPoint = { x: 0, y: 0 };
    private dragging = false;
    private moved = false;

    constructor(options: MapPickerPinOptions) {
      super();
      this.options = options;
      this.position = { ...options.position };
      this.startPosition = { ...options.position };

      this.element = document.createElement("div");
      this.element.className = options.draggable
        ? `${PIN_WRAPPER_CLASS} touch-none cursor-grab active:cursor-grabbing`
        : PIN_WRAPPER_CLASS;
      this.element.innerHTML = PIN_SVG;

      if (options.draggable) {
        this.element.addEventListener("pointerdown", this.handlePointerDown);
        this.element.addEventListener("pointermove", this.handlePointerMove);
        this.element.addEventListener("pointerup", this.handlePointerUp);
        this.element.addEventListener("pointercancel", this.handlePointerCancel);
        this.element.addEventListener("lostpointercapture", this.handlePointerCancel);
        // The pointer handlers stop their own presses; the follow-up click must
        // never reach the map either, or it would re-drop the pin underneath it.
        this.element.addEventListener("click", stopPropagation);
        this.element.addEventListener("dblclick", stopPropagation);
      }
    }

    onAdd() {
      this.getPanes()?.overlayMouseTarget.appendChild(this.element);
    }

    draw() {
      const pixel = this.currentPixel();
      if (pixel) this.place(pixel);
    }

    onRemove() {
      this.dragging = false;
      this.element.remove();
    }

    setPosition(position: GoogleLatLngLiteral) {
      this.position = { ...position };
      this.draw();
    }

    private readonly handlePointerDown = (event: PointerEvent) => {
      if (!this.options.draggable || !event.isPrimary || event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      this.dragging = true;
      this.moved = false;
      this.startPosition = { ...this.position };
      this.startClient = { x: event.clientX, y: event.clientY };
      this.startPixel = this.currentPixel();
      this.element.setPointerCapture(event.pointerId);
    };

    private readonly handlePointerMove = (event: PointerEvent) => {
      if (!this.dragging || !this.startPixel) return;
      event.preventDefault();
      event.stopPropagation();
      const dx = event.clientX - this.startClient.x;
      const dy = event.clientY - this.startClient.y;
      if (!this.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
      this.moved = true;
      const pixel = { x: this.startPixel.x + dx, y: this.startPixel.y + dy };
      const next = this.fromDivPixel(pixel);
      if (!next) return;
      this.position = next;
      this.place(pixel);
    };

    private readonly handlePointerUp = (event: PointerEvent) => {
      if (!this.dragging) return;
      event.stopPropagation();
      this.endDrag(event.pointerId, true);
    };

    private readonly handlePointerCancel = (event: PointerEvent) => {
      if (!this.dragging) return;
      this.endDrag(event.pointerId, false);
    };

    private endDrag(pointerId: number, commit: boolean) {
      this.dragging = false;
      if (this.element.hasPointerCapture(pointerId)) {
        this.element.releasePointerCapture(pointerId);
      }
      if (!commit) {
        this.position = { ...this.startPosition };
        this.draw();
        this.moved = false;
        return;
      }
      const moved = this.moved;
      this.moved = false;
      if (moved) this.options.onDragEnd({ ...this.position });
    }

    private currentPixel(): GoogleMapPoint | null {
      const projection = this.getProjection();
      if (!projection) return null;
      return projection.fromLatLngToDivPixel(this.position);
    }

    private fromDivPixel(pixel: GoogleMapPoint): GoogleLatLngLiteral | null {
      const projection = this.getProjection();
      if (!projection) return null;
      const latLng = projection.fromDivPixelToLatLng(new maps.Point(pixel.x, pixel.y));
      return { lat: latLng.lat(), lng: latLng.lng() };
    }

    private place(pixel: GoogleMapPoint) {
      this.element.style.left = `${pixel.x}px`;
      this.element.style.top = `${pixel.y}px`;
    }
  }

  pinClass = { maps, Pin: MapPickerPinOverlay };
  return pinClass.Pin;
}

function stopPropagation(event: Event) {
  event.stopPropagation();
}

export function createMapPickerPin(
  maps: GoogleMapsNamespace,
  options: MapPickerPinOptions,
): MapPickerPin {
  return new (getPinClass(maps))(options);
}
