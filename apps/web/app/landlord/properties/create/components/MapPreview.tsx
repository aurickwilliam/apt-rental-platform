"use client";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix broken default marker icons in Next.js / Webpack
const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface LeafletMapProps {
  latitude?: number | null;
  longitude?: number | null;
  address?: string;
}

export default function MapPreview({ latitude, longitude, address }: LeafletMapProps) {
  const hasCoords = latitude != null && longitude != null;

  const [coords, setCoords] = useState<[number, number] | null>(
    hasCoords ? [latitude!, longitude!] : null
  );
  // Only show loader if we need to geocode (no coords AND has address)
  const [loading, setLoading] = useState(!hasCoords && !!address);

  useEffect(() => {
    if (hasCoords || !address) return;

    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
      {
        headers: {
          "Accept-Language": "en",
          "User-Agent": "AptRentalPlatform/1.0",
        },
      }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data[0]) {
          setCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        }
      })
      .finally(() => setLoading(false));
  }, [hasCoords, address]);

  if (loading) {
    return (
      <div className="w-full h-72 rounded-2xl bg-grey-100 animate-pulse border border-grey-200" />
    );
  }

  if (!coords) {
    return (
      <div className="w-full h-72 rounded-2xl bg-grey-100 flex flex-col items-center justify-center gap-2 border border-grey-200">
        <span className="text-grey-300 text-sm">Location unavailable</span>
      </div>
    );
  }

  return (
    <MapContainer
      center={coords}
      zoom={17}
      scrollWheelZoom={false}
      className="w-full h-72 rounded-2xl z-0"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={coords} icon={markerIcon}>
        {address && <Popup>{address}</Popup>}
      </Marker>
    </MapContainer>
  );
}
