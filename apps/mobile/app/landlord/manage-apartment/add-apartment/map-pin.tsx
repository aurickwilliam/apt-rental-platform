import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";

import ScreenWrapper from "components/layout/ScreenWrapper";

import { Button } from "heroui-native";
import { IconChevronLeft } from "@tabler/icons-react-native";
import { useColors } from "hooks/useTheme";

import { useApartmentFormStore } from "@/stores/useApartmentFormStore";
import MapViewSwitcher from "@/components/maps/MapViewSwitcher";
import PlaceAutocompleteInput from "@/components/maps/PlaceAutocompleteInput";
import { MAP_DEFAULT_COORDS, isPlacesEnabled } from "@/utils/mapConfig";
import {
  getBarangaysByCity,
  isMetroManilaProvince,
  matchBarangay,
  toCamanavaCity,
} from "@repo/constants";

// Lifts the floating controls off the map.
const FLOATING_SHADOW = {
  shadowColor: "#000",
  shadowOpacity: 0.15,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 4,
};

export default function MapPin() {
  const router = useRouter();
  const { colors } = useColors();
  const insets = useSafeAreaInsets();
  const { latitude, longitude, setField, barangay } = useApartmentFormStore();

  const initialCoords = {
    latitude: latitude ?? MAP_DEFAULT_COORDS.latitude,
    longitude: longitude ?? MAP_DEFAULT_COORDS.longitude,
  };

  const [markerCoords, setMarkerCoords] = useState(initialCoords);

  const handleMapPress = (coords: { latitude: number; longitude: number }) => {
    setMarkerCoords(coords);
  };

  const handlePlaceSelect = (
    details: import("@/service/places/placesService").PlaceDetails,
  ) => {
    // Auto-fill address fields from Google Places; keep existing if Google returns empty (e.g., barangay)
    setMarkerCoords({
      latitude: details.latitude,
      longitude: details.longitude,
    });
    if (details.streetName) setField("streetName", details.streetName);
    // Only CAMANAVA values reach the form; Google names ("Caloocan City",
    // "Kalookan") are mapped to the listing city.
    const camanavaCity = toCamanavaCity(details.city);
    if (camanavaCity && isMetroManilaProvince(details.province)) {
      setField("city", camanavaCity);
      setField("province", "Metro Manila");
      // Only a barangay from the city's list is filled in; otherwise it is picked by hand.
      const cityBarangays = getBarangaysByCity(camanavaCity);
      setField(
        "barangay",
        matchBarangay(cityBarangays, details.barangay) ??
          (cityBarangays.includes(barangay) ? barangay : ""),
      );
    }
    if (/^\d{4}$/.test(details.postalCode))
      setField("postalCode", details.postalCode);
  };

  const handleConfirm = () => {
    setField("latitude", markerCoords.latitude);
    setField("longitude", markerCoords.longitude);
    setField("mapConfirmed", true);
    router.back();
  };

  return (
    <ScreenWrapper noTopPadding>
      <View className="flex-1">
        {/* The map fills the screen (under the status bar); the back button
            and search float on top of it. */}
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

          <View
            className="absolute left-0 right-0 top-0 px-4 flex-row items-start gap-2"
            style={{ paddingTop: insets.top + 8 }}
            pointerEvents="box-none"
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              className="h-12 w-12 items-center justify-center rounded-full bg-surface border border-field-border"
              style={FLOATING_SHADOW}
            >
              <IconChevronLeft size={24} color={colors.textPrimary} />
            </TouchableOpacity>

            {isPlacesEnabled() ? (
              <View className="flex-1 rounded-2xl" style={FLOATING_SHADOW}>
                <PlaceAutocompleteInput
                  biasLat={markerCoords.latitude}
                  biasLng={markerCoords.longitude}
                  onSelectPlace={handlePlaceSelect}
                />
              </View>
            ) : (
              <View
                className="flex-1 h-12 justify-center px-4 rounded-2xl bg-surface border border-field-border"
                style={FLOATING_SHADOW}
              >
                <Text className="text-foreground text-base font-nunitoSemiBold">
                  Pin your location
                </Text>
              </View>
            )}
          </View>
        </View>

        <View className="p-5 gap-4 bg-background">
          <View className="flex-row justify-between">
            <Text className="text-foreground font-nunitoSemiBold">
              Lat: <Text className="text-muted font-inter">{markerCoords.latitude.toFixed(6)}</Text>
            </Text>
            <Text className="text-foreground font-nunitoSemiBold">
              Lng: <Text className="text-muted font-inter">{markerCoords.longitude.toFixed(6)}</Text>
            </Text>
          </View>

          <Button onPress={handleConfirm}>
            <Button.Label>Confirm Location</Button.Label>
          </Button>
        </View>
      </View>
    </ScreenWrapper>
  );
}
