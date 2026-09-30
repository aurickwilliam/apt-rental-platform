"use client";

import { useState } from "react";
import { Modal, Button } from "@heroui/react";
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

interface MapLocationProps {
  latitude:  number | null;
  longitude: number | null;
}

export default function MapLocation({ latitude, longitude }: MapLocationProps) {
  const [isExpandOpen,     setIsExpandOpen]     = useState<boolean>(false);
  const [isDirectionsOpen, setIsDirectionsOpen] = useState<boolean>(false);

  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  const hasCoordinates =
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);
  const mapCoordinates = hasCoordinates
    ? `${latitude},${longitude}`
    : null;
  const embedSrc = mapCoordinates
    ? `https://maps.google.com/maps?q=${encodeURIComponent(mapCoordinates)}&z=15&output=embed`
    : null;

  const handleOpenDirections = () => {
    setIsDirectionsOpen(true);
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn("User denied location or location unavailable", error);
        }
      );
    } else {
      console.warn("Geolocation is not supported by this browser.");
    }
  };


  // Open Google Maps with directions
  const openInGoogleMaps = (mode: typeof MODES[number]) => {
    if (!mapCoordinates) return;
    const params = new URLSearchParams({
      api: "1",
      destination: mapCoordinates,
      travelmode: mode.googleMode,
    });

    // If we successfully got their location, append it as the origin
    if (userLocation) {
      params.append("origin", `${userLocation.lat},${userLocation.lng}`);
    }

    window.open(`https://www.google.com/maps/dir/?${params.toString()}`, "_blank");
    setIsDirectionsOpen(false);
  };

  // Empty State of no coordinates of the apartment
  if (!hasCoordinates || !embedSrc || !mapCoordinates) {
    return (
      <div className="w-full h-80 bg-grey-200 flex items-center justify-center rounded-lg border border-grey-300">
        <p className="text-default-400 text-sm">No location available</p>
      </div>
    );
  }

  return (
    <>
      {/* Preview map */}
      <div className="relative w-full h-80 overflow-hidden rounded-lg border border-grey-300">
        <iframe
          title={`Map of ${mapCoordinates}`}
          src={embedSrc}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          className="w-full h-full rounded-lg border-0"
        />
        <div className="absolute bottom-3 right-3 z-10 flex gap-2">
          <Button
            className="shadow-sm"
            size="sm"
            onPress={handleOpenDirections}
            variant="tertiary"
          >
            <Navigation size={16} />
            <p>Get Directions</p>
          </Button>
          
          <Button
            isIconOnly
            className="shadow-md"
            size="sm"
            onPress={() => setIsExpandOpen(true)}
            variant="tertiary"
          >
            <Expand size={16} />
          </Button>
        </div>
      </div>

      {/* Expand modal */}
      <Modal>
        <Modal.Backdrop
          isOpen={isExpandOpen}
          onOpenChange={setIsExpandOpen}
          className="z-1999"
        >
          <Modal.Container 
            size="cover" 
            scroll="inside" 
            className="z-2000 bg-transparent p-0 shadow-none"
          >
            <Modal.Dialog className="bg-transparent h-full flex flex-col justify-center">
              {/* Close Button */}
              <Modal.CloseTrigger className="absolute top-4 right-4 z-10 text-black" />

              <Modal.Body className="p-0 h-full flex items-center justify-center">
                <div className="w-2/3 bg-white p-4 rounded-3xl overflow-hidden shadow-xl">
                  <iframe
                    title={`Expanded map of ${mapCoordinates}`}
                    src={embedSrc}
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    className="w-full h-[80vh] rounded-xl border-0"
                  />
                </div>
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* Directions modal */}
      <Modal>
        <Modal.Backdrop
          isOpen={isDirectionsOpen}
          onOpenChange={setIsDirectionsOpen}
          className="z-1999"
        >
          <Modal.Container size="sm" className="z-2000">
            <Modal.Dialog>
              <Modal.CloseTrigger className="text-black" />
              <Modal.Header>
                <Modal.Heading className="text-lg font-semibold">
                  Get Directions
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body className="pb-2 flex flex-col gap-3">
                <p className="text-sm text-grey-500">
                  Choose how you want to get there. Opens in Google Maps.
                </p>
                <div className="flex flex-col gap-2">
                  {MODES.map((mode) => (
                    <Button
                      key={mode.id}
                      variant="tertiary"
                      className="justify-start gap-3 text-black"
                      fullWidth
                      onPress={() => openInGoogleMaps(mode)}
                    >
                      <span>
                        {mode.label}
                      </span>
                    </Button>
                  ))}
                </div>
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}