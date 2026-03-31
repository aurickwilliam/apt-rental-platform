"use client";
import { useEffect } from "react";
import React from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon broken in Next.js
const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Re-centers map when coordinates change (e.g. after geocoding)
function MapController({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface Props {
  latitude: number | null;
  longitude: number | null;
  onPick: (lat: number, lng: number) => void;
  error?: string;
}

// Default center: Philippines
const DEFAULT_CENTER: [number, number] = [14.6650, 120.9670];

function MapPicker({ latitude, longitude, onPick, error }: Props) {
  const center: [number, number] =
    latitude && longitude ? [latitude, longitude] : DEFAULT_CENTER;

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-medium">
        Pin Location <span className="text-danger">*</span>
      </p>
      <p className="text-xs text-grey-400 mb-1">
        Click anywhere on the map to drop a pin on your property&apos;s exact location.
      </p>

      <div
        className={`w-full h-72 rounded-2xl overflow-hidden border-2 transition ${
          error ? "border-danger" : "border-grey-200"
        }`}
      >
        <MapContainer
          center={center}
          zoom={latitude && longitude ? 15 : 13}
          className="w-full h-full"
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={onPick} />
          {latitude && longitude && (
            <>
              <Marker
                position={[latitude, longitude]}
                icon={markerIcon}
                draggable
                eventHandlers={{
                  dragend(e) {
                    const { lat, lng } = e.target.getLatLng();
                    onPick(lat, lng);
                  },
                }}
              />
              <MapController lat={latitude} lng={longitude} />
            </>
          )}
        </MapContainer>
      </div>

      {latitude && longitude && (
        <p className="text-xs text-grey-400">
          📍 {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </p>
      )}

      {error && <p className="text-danger text-xs">{error}</p>}
    </div>
  );
}

export default React.memo(MapPicker);
