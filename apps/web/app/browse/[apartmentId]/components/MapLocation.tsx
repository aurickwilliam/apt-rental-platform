"use client";

import { useEffect, useState } from "react";
import { Modal, ModalContent, ModalBody, Button } from "@heroui/react";
import { Expand } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function initMap(id: string, latitude: number, longitude: number) {
  const container = L.DomUtil.get(id);
  if (container && (container as HTMLElement & { _leaflet_id?: number })._leaflet_id) return;

  const map = L.map(id).setView([latitude, longitude], 15);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  L.marker([latitude, longitude], { icon }).addTo(map);

  return map;
}

interface MapLocationProps {
  latitude: number | null;
  longitude: number | null;
}

export default function MapLocation({ latitude, longitude }: MapLocationProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Small preview map
  useEffect(() => {
    if (!latitude || !longitude) return;
    const map = initMap("map-preview", latitude, longitude);
    return () => { map?.remove(); };
  }, [latitude, longitude]);

  // Large modal map — init after modal opens
  useEffect(() => {
    if (!isOpen || !latitude || !longitude) return;

    // Wait for modal DOM to render
    const timeout = setTimeout(() => {
      const map = initMap("map-modal", latitude, longitude);
      return () => { map?.remove(); };
    }, 100);

    return () => clearTimeout(timeout);
  }, [isOpen, latitude, longitude]);

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
        <Button
          isIconOnly
          className="absolute bottom-3 right-3 z-1000 bg-white shadow-md"
          radius="full"
          size="sm"
          onPress={() => setIsOpen(true)}
        >
          <Expand size={16} />
        </Button>
      </div>

      {/* Full modal map */}
      <Modal
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        size="5xl"
        scrollBehavior="inside"
        classNames={{
          wrapper: "z-[2000]",
          backdrop: "z-[1999]"
        }}
      >
        <ModalContent>
          <ModalBody className="p-0">
            <div id="map-modal" className="w-full h-[80vh] rounded-lg z-0" />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
