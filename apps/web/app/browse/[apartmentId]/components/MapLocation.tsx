"use client";

import { useEffect, useState } from "react";
import { Modal, ModalContent, ModalBody, ModalHeader, Button } from "@heroui/react";
import { Expand, Navigation } from "lucide-react";


// Types and constants of the mode of transporatation for directions in Google Maps
type TransportMode = "driving" | "motorcycle" | "walkBike" | "transit";

const MODES: { 
  id: TransportMode; 
  label: string; 
  googleMode: string 
}[] = [
  { id: "driving",    label: "Drive", googleMode: "driving"   },
  { id: "motorcycle", label: "Motorcycle", googleMode: "driving"   },
  { id: "walkBike",    label: "Walk & Bike", googleMode: "walking" },
  { id: "transit",    label: "Transit",    googleMode: "transit"   },
];

interface LeafletContainer extends HTMLElement {
  _leaflet_id?: number;
}

async function makeLeafletIcon() {
  const L = (await import("leaflet")).default;
  return L.icon({
    iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize:  [25, 41],
    iconAnchor:[12, 41],
  });
}

interface MapLocationProps {
  latitude:  number | null;
  longitude: number | null;
}

export default function MapLocation({ latitude, longitude }: MapLocationProps) {
  const [isExpandOpen,     setIsExpandOpen]     = useState(false);
  const [isDirectionsOpen, setIsDirectionsOpen] = useState(false);

  // Default Preview Map
  useEffect(() => {
    if (!latitude || !longitude) return;

    let map: import("leaflet").Map | undefined;

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      const container = L.DomUtil.get("map-preview") as LeafletContainer | null;
      if (container?._leaflet_id) return;

      const icon = await makeLeafletIcon();
      map = L.map("map-preview").setView([latitude, longitude], 15);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      L.marker([latitude, longitude], { icon }).addTo(map);
    })();

    return () => { map?.remove(); };
  }, [latitude, longitude]);

  // Expand Modal Map
  useEffect(() => {
    if (!isExpandOpen || !latitude || !longitude) return;

    let map: import("leaflet").Map | undefined;

    const t = setTimeout(async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      const container = L.DomUtil.get("map-modal") as LeafletContainer | null;
      if (container?._leaflet_id) return;

      const icon = await makeLeafletIcon();
      map = L.map("map-modal").setView([latitude, longitude], 15);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      L.marker([latitude, longitude], { icon }).addTo(map);
    }, 100);

    return () => {
      clearTimeout(t);
      map?.remove();
    };
  }, [isExpandOpen, latitude, longitude]);

  // Open Google Maps with directions
  const openInGoogleMaps = (mode: typeof MODES[number]) => {
    const params = new URLSearchParams({
      api: "1",
      destination: `${latitude},${longitude}`,
      travelmode: mode.googleMode,
    });
    window.open(`https://www.google.com/maps/dir/?${params.toString()}`, "_blank");
  };

  // Empty State of no coordinates of the apartment
  if (!latitude || !longitude) {
    return (
      <div className="w-full h-80 bg-grey-200 flex items-center justify-center rounded-lg">
        <p className="text-default-400 text-sm">No location available</p>
      </div>
    );
  }

  return (
    <>
      {/* Preview map */}
      <div className="relative w-full h-80">
        <div id="map-preview" className="w-full h-full rounded-lg z-0" />
        <div className="absolute bottom-3 right-3 z-1000 flex gap-2">
          <Button
            className="bg-white shadow-md"
            radius="full"
            size="sm"
            title="Get Directions"
            onPress={() => setIsDirectionsOpen(true)}
            startContent={<Navigation size={16} />}
          >
            <p>Get Directions</p>
          </Button>
          <Button
            isIconOnly
            className="bg-white shadow-md"
            radius="full"
            size="sm"
            title="Expand Map"
            onPress={() => setIsExpandOpen(true)}
          >
            <Expand size={16} />
          </Button>
        </div>
      </div>

      {/* Expand modal */}
      <Modal
        isOpen={isExpandOpen}
        onOpenChange={setIsExpandOpen}
        size="5xl"
        scrollBehavior="inside"
        classNames={{ wrapper: "z-[2000]", backdrop: "z-[1999]" }}
      >
        <ModalContent>
          <ModalBody className="p-0">
            <div id="map-modal" className="w-full h-[80vh] rounded-lg z-0" />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Directions modal */}
      <Modal
        isOpen={isDirectionsOpen}
        onOpenChange={setIsDirectionsOpen}
        size="sm"
        classNames={{ wrapper: "z-[2000]", backdrop: "z-[1999]" }}
      >
        <ModalContent>
          <ModalHeader className="text-lg font-semibold">
            Get Directions
          </ModalHeader>
          <ModalBody className="pb-6 flex flex-col gap-3">
            <p className="text-sm text-default-500">
              Choose how you want to get there. Opens in Google Maps.
            </p>
            <div className="flex flex-col gap-2">
              {MODES.map((mode) => (
                <Button
                  key={mode.id}
                  variant="bordered"
                  className="justify-start gap-3"
                  fullWidth
                  onPress={() => openInGoogleMaps(mode)}
                >
                  <span>{mode.label}</span>
                </Button>
              ))}
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}