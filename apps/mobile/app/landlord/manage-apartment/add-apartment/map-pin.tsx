import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";

import ScreenWrapper from "components/layout/ScreenWrapper";

import { Button } from "heroui-native";

import { useApartmentFormStore } from "@/stores/useApartmentFormStore";
import MapViewSwitcher from "@/components/maps/MapViewSwitcher";
import PlaceAutocompleteInput from "@/components/maps/PlaceAutocompleteInput";
import { MAP_DEFAULT_COORDS, isPlacesEnabled } from "@/utils/mapConfig";

export default function MapPin() {
  const router = useRouter();
  const { latitude, longitude, setField, streetName, barangay, city } = useApartmentFormStore();

  const initialCoords = {
    latitude: latitude ?? MAP_DEFAULT_COORDS.latitude,
    longitude: longitude ?? MAP_DEFAULT_COORDS.longitude,
  };

  const [markerCoords, setMarkerCoords] = useState(initialCoords);

  const handleMapPress = (coords: { latitude: number; longitude: number }) => {
    setMarkerCoords(coords);
  };

  const handlePlaceSelect = (details: import('@/service/places/placesService').PlaceDetails) => {
    // Auto-fill address fields from Google Places; keep existing if Google returns empty (e.g., barangay)
    setMarkerCoords({ latitude: details.latitude, longitude: details.longitude });
    if (details.streetName) setField('streetName', details.streetName);
    if (details.barangay) setField('barangay', details.barangay);
    if (details.city) setField('city', details.city);
    if (details.province) setField('province', details.province);
    if (details.postalCode) setField('postalCode', details.postalCode);
  };

  const handleConfirm = () => {
    setField('latitude', markerCoords.latitude);
    setField('longitude', markerCoords.longitude);
    setField('mapConfirmed', true);
    router.back();
  };

  return (
    <ScreenWrapper>
      <View className="flex-1">
        {isPlacesEnabled() && (
          <View className="px-4 pt-3 pb-2 bg-background z-10">
            <PlaceAutocompleteInput
              biasLat={markerCoords.latitude}
              biasLng={markerCoords.longitude}
              onSelectPlace={handlePlaceSelect}
            />
            {/* Small hint when address fields will be overwritten */}
            {(streetName || barangay || city) && (
              <Text className="text-xs text-muted font-inter mt-1">
                Selecting a suggestion updates Street/Barangay/City/Province automatically. Drag pin to fine-tune.
              </Text>
            )}
          </View>
        )}

        <View className="flex-1">
          <MapViewSwitcher
            latitude={markerCoords.latitude}
            longitude={markerCoords.longitude}
            markerCoords={markerCoords}
            draggableMarker
            interactive
            onPress={handleMapPress}
            onMarkerDragEnd={setMarkerCoords}
            style={{ flex: 1 }}
            showFallbackBanner
          />
        </View>

        <View className="p-5 gap-4 bg-background">
          <View className="flex-row justify-between">
            <Text className="text-foreground font-nunitoSemiBold">Latitude:</Text>
            <Text className="text-muted font-inter">{markerCoords.latitude.toFixed(6)}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-foreground font-nunitoSemiBold">Longitude:</Text>
            <Text className="text-muted font-inter">{markerCoords.longitude.toFixed(6)}</Text>
          </View>

          <Button onPress={handleConfirm}>
            <Button.Label>Confirm Location</Button.Label>
          </Button>
        </View>
      </View>
    </ScreenWrapper>
  );
}
