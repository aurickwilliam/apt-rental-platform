import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  MapView,
  Camera,
  ShapeSource,
  CircleLayer,
  setAccessToken,
} from "@maplibre/maplibre-react-native";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import ApplicationHeader from "@/app/manage-apartment/add-apartment/components/ApplicationHeader";
import DropdownField from "@/components/inputs/DropdownField";

import {
  TextField,
  Label,
  Input,
  FieldError,
  Button,
  Description,
  Checkbox,
  ControlField,
} from "heroui-native";

import {
  APARTMENT_TYPES,
  PROVINCES,
  FLOOR_LEVELS,
  FURNISHED_TYPES,
  LEASE_DURATIONS,
  APARTMENT_FLOOR_AREA,
  APARTMENT_ROOM_LIMITS,
  CITIES,
} from "@repo/constants";

import { 
  CirclePlus,
  CircleMinus,
} from 'lucide-react-native';

import { useApartmentFormStore } from "@/stores/useApartmentFormStore";

import { useColors } from "@/hooks/useTheme";

// Suppress the missing API key warning since we're using free OSM tiles
setAccessToken(null);

// Field-level error shape
interface FormErrors {
  apartmentType?: string;
  streetName?: string;
  barangay?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  floorArea?: string;
  bathrooms?: string;
  bedrooms?: string;
  maxOccupants?: string;
  furnishingType?: string;
  mapConfirmed?: string;
  floorLevel?: string;
  leaseDuration?: string;
}

const MAP_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: "osm-tiles",
      type: "raster",
      source: "osm",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

const DEFAULT_COORDS = {
  latitude: 14.67,
  longitude: 120.96,
};

const DEFAULT_ROOM_LIMITS = {
  bathrooms: { min: 1, max: 10 },
  bedrooms: { min: 1, max: 10 },
  maxOccupants: { min: 1, max: 10 },
};

const isZeroRange = (min: number, max: number) => min === 0 && max === 0;

const formatRange = (min: number, max: number) =>
  min === max ? ` (${min})` : ` (${min}-${max})`;

const formatLimitMessage = (label: string, min: number, max: number) =>
  min === max
    ? `${label} must be ${min}`
    : `${label} must be between ${min} and ${max}`;

export default function SecondStep() {
  const router = useRouter();
  const { colors } = useColors();

  const [errors, setErrors] = useState<FormErrors>({});

  const {
    name,
    apartmentType,
    streetName,
    barangay,
    city,
    province,
    postalCode,
    mapConfirmed,
    furnishingType,
    bathrooms,
    bedrooms,
    maxOccupants,
    floorArea,
    setField,
    longitude,
    latitude,
    floorLevel,
    leaseDuration,
  } = useApartmentFormStore();

  const cityOptions: string[] = province
    ? (CITIES[province as keyof typeof CITIES] ?? [])
    : [];

  const typeRoomLimits = APARTMENT_ROOM_LIMITS[apartmentType];
  const roomLimits = typeRoomLimits ?? DEFAULT_ROOM_LIMITS;
  const areaLimits = APARTMENT_FLOOR_AREA[apartmentType];
  const isFloorLevelDisabled =
    apartmentType === "House" || apartmentType === "Townhouse";

  const bedroomsHidden =
    !!typeRoomLimits &&
    isZeroRange(roomLimits.bedrooms.min, roomLimits.bedrooms.max);
  const bathroomsHidden =
    !!typeRoomLimits &&
    isZeroRange(roomLimits.bathrooms.min, roomLimits.bathrooms.max);
  const maxOccupantsHidden =
    !!typeRoomLimits &&
    isZeroRange(roomLimits.maxOccupants.min, roomLimits.maxOccupants.max);

  useEffect(() => {
    if (!typeRoomLimits) return;

    if (bedroomsHidden && bedrooms !== 0) setField("bedrooms", 0);
    if (bathroomsHidden && bathrooms !== 0) setField("bathrooms", 0);
    if (maxOccupantsHidden && maxOccupants !== 0) setField("maxOccupants", 0);
  }, [
    bathrooms,
    bathroomsHidden,
    bedrooms,
    bedroomsHidden,
    maxOccupants,
    maxOccupantsHidden,
    setField,
    typeRoomLimits,
  ]);

  useEffect(() => {
    if (!isFloorLevelDisabled) return;
    if (floorLevel !== "Ground Floor") setField("floorLevel", "Ground Floor");
    setErrors((prev) =>
      prev.floorLevel ? { ...prev, floorLevel: undefined } : prev,
    );
  }, [floorLevel, isFloorLevelDisabled, setField]);

  const handleAdd = (type: "bathrooms" | "bedrooms" | "maxOccupants") => {
    if (type === "bathrooms") {
      if (bathrooms < roomLimits.bathrooms.max) {
        setField("bathrooms", bathrooms + 1);
      }
      clearError("bathrooms");
    }
    if (type === "bedrooms") {
      if (bedrooms < roomLimits.bedrooms.max) {
        setField("bedrooms", bedrooms + 1);
      }
      clearError("bedrooms");
    }
    if (type === "maxOccupants") {
      if (maxOccupants < roomLimits.maxOccupants.max) {
        setField("maxOccupants", maxOccupants + 1);
      }
      clearError("maxOccupants");
    }
  };

  const handleSubtract = (type: "bathrooms" | "bedrooms" | "maxOccupants") => {
    if (type === "bathrooms") {
      if (bathrooms > roomLimits.bathrooms.min) {
        setField("bathrooms", bathrooms - 1);
      }
      clearError("bathrooms");
    }
    if (type === "bedrooms") {
      if (bedrooms > roomLimits.bedrooms.min) {
        setField("bedrooms", bedrooms - 1);
      }
      clearError("bedrooms");
    }
    if (type === "maxOccupants") {
      if (maxOccupants > roomLimits.maxOccupants.min) {
        setField("maxOccupants", maxOccupants - 1);
      }
      clearError("maxOccupants");
    }
  };

  // Clears a specific field error as soon as the user interacts with it
  const clearError = (field: keyof FormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateStep = (): FormErrors => {
    const errs: FormErrors = {};

    if (!apartmentType) errs.apartmentType = "Apartment type is required";
    if (!streetName.trim()) errs.streetName = "Street name is required";
    if (!barangay.trim()) errs.barangay = "Barangay is required";
    if (!province.trim()) {
      errs.province = "Province is required";
    } else if (!city.trim()) {
      errs.city = "City is required";
    }
    if (!postalCode.trim()) errs.postalCode = "Zip code is required";
    if (!floorArea.trim()) {
      errs.floorArea = "Floor area is required";
    } else {
      const parsedArea = Number.parseFloat(floorArea);
      if (Number.isNaN(parsedArea)) {
        errs.floorArea = "Floor area must be a number";
      } else if (
        areaLimits &&
        (parsedArea < areaLimits.min || parsedArea > areaLimits.max)
      ) {
        errs.floorArea = `Floor area must be between ${areaLimits.min} and ${areaLimits.max} sqm`;
      }
    }
    if (typeRoomLimits && !bathroomsHidden) {
      if (
        bathrooms < roomLimits.bathrooms.min ||
        bathrooms > roomLimits.bathrooms.max
      ) {
        errs.bathrooms = formatLimitMessage(
          "Bathrooms",
          roomLimits.bathrooms.min,
          roomLimits.bathrooms.max,
        );
      }
    }
    if (typeRoomLimits && !bedroomsHidden) {
      if (
        bedrooms < roomLimits.bedrooms.min ||
        bedrooms > roomLimits.bedrooms.max
      ) {
        errs.bedrooms = formatLimitMessage(
          "Bedrooms",
          roomLimits.bedrooms.min,
          roomLimits.bedrooms.max,
        );
      }
    }
    if (typeRoomLimits && !maxOccupantsHidden) {
      if (
        maxOccupants < roomLimits.maxOccupants.min ||
        maxOccupants > roomLimits.maxOccupants.max
      ) {
        errs.maxOccupants = formatLimitMessage(
          "Max occupants",
          roomLimits.maxOccupants.min,
          roomLimits.maxOccupants.max,
        );
      }
    }
    if (!furnishingType) errs.furnishingType = "Furnishing type is required";
    if (!mapConfirmed) errs.mapConfirmed = "Please confirm the pin location";
    if (!isFloorLevelDisabled && !floorLevel)
      errs.floorLevel = "Floor level is required";
    if (!leaseDuration) errs.leaseDuration = "Lease duration is required";

    return errs;
  };

  const handleNext = () => {
    const validationErrors = validateStep();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    router.push("/manage-apartment/add-apartment/third-step");
  };

  return (
    <ScreenWrapper scrollable>
      <ApplicationHeader
        currentTitle={"Basic Info"}
        nextTitle={"Pricing & Terms"}
        step={2}
        totalSteps={5}
      />

      <View className="p-5">
        {/* Name and Type */}

        {/* Apartment Details */}
        <View className="flex">
          <Text className="text-foreground text-lg font-interSemiBold">
            Apartment Details
          </Text>

          <View className="flex gap-3 mt-3">
            <TextField isRequired>
              <Label>Apartment Name:</Label>
              <Input
                placeholder="Enter apartment name"
                value={name}
                isDisabled
              />
            </TextField>

            <DropdownField
              label="Property Type:"
              required
              placeholder="Select property type"
              options={APARTMENT_TYPES}
              bottomSheetLabel={"Select Apartment Type"}
              value={apartmentType}
              error={errors.apartmentType}
              onSelect={(value) => {
                setField("apartmentType", value || "");
                clearError("apartmentType");
              }}
            />
          </View>

          <View className="flex gap-3 mt-3">
            <TextField isRequired isInvalid={!!errors.floorArea}>
              <Label>Floor Area (sqm):</Label>
              <Input
                placeholder="Enter floor area"
                value={floorArea}
                keyboardType="numeric"
                onChangeText={(value) => {
                  // Only allow numeric input
                  if (/^\d*\.?\d*$/.test(value)) {
                    setField("floorArea", value);
                    clearError("floorArea");
                  }
                }}
              />
              <Description>
                {areaLimits ? formatRange(areaLimits.min, areaLimits.max) : ""}
              </Description>
              {errors.floorArea && <FieldError>{errors.floorArea}</FieldError>}
            </TextField>

            <DropdownField
              label="Furnished Type:"
              required
              placeholder="Select furnishing type"
              options={FURNISHED_TYPES}
              bottomSheetLabel={"Select Furnishing Type"}
              value={furnishingType}
              error={errors.furnishingType}
              onSelect={(value) => {
                setField("furnishingType", value || "");
                clearError("furnishingType");
              }}
            />

            <DropdownField
              label="Floor Level:"
              required={!isFloorLevelDisabled}
              placeholder={
                isFloorLevelDisabled ? "Ground Floor" : "Select floor level"
              }
              options={FLOOR_LEVELS}
              bottomSheetLabel={"Select Floor Level"}
              value={floorLevel ?? ""}
              disabled={isFloorLevelDisabled}
              error={errors.floorLevel}
              onSelect={(value) => {
                setField("floorLevel", value || "");
                clearError("floorLevel");
              }}
            />
            {isFloorLevelDisabled && (
              <Text className="text-sm text-gray-500 font-inter">
                Defaulted to Ground Floor for House or Townhouse.
              </Text>
            )}

            <DropdownField
              label="Lease Duration:"
              required
              placeholder="Select lease duration"
              options={LEASE_DURATIONS}
              bottomSheetLabel={"Select Lease Duration"}
              value={leaseDuration}
              error={errors.leaseDuration}
              onSelect={(value) => {
                setField("leaseDuration", value || "");
                clearError("leaseDuration");
              }}
            />
          </View>

          {/* Bathrooms */}
          {!bathroomsHidden && (
            <View>
              <View className="flex-row items-center justify-between mt-5">
                <Text className="text-foreground text-lg font-interMedium">
                  Bathrooms
                  {typeRoomLimits
                    ? formatRange(
                        roomLimits.bathrooms.min,
                        roomLimits.bathrooms.max,
                      )
                    : ""}
                  :
                </Text>
                <View className="flex-row items-center gap-7">
                  <TouchableOpacity
                    onPress={() => handleSubtract("bathrooms")}
                    disabled={bathrooms <= roomLimits.bathrooms.min}
                    style={{
                      opacity: bathrooms <= roomLimits.bathrooms.min ? 0.3 : 1,
                    }}
                  >
                    <CircleMinus size={30} color={colors.textPrimary} />
                  </TouchableOpacity>

                  <Text className="text-foreground text-xl font-interMedium">
                    {bathrooms}
                  </Text>

                  <TouchableOpacity
                    onPress={() => handleAdd("bathrooms")}
                    disabled={bathrooms >= roomLimits.bathrooms.max}
                    style={{
                      opacity: bathrooms >= roomLimits.bathrooms.max ? 0.3 : 1,
                    }}
                  >
                    <CirclePlus size={30} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>
              {errors.bathrooms && (
                <Text className="text-danger text-sm font-inter mt-1">
                  {errors.bathrooms}
                </Text>
              )}
            </View>
          )}

          {/* Bedrooms */}
          {!bedroomsHidden && (
            <View>
              <View className="flex-row items-center justify-between mt-5">
                <Text className="text-foreground text-lg font-interMedium">
                  Bedrooms
                  {typeRoomLimits
                    ? formatRange(
                        roomLimits.bedrooms.min,
                        roomLimits.bedrooms.max,
                      )
                    : ""}
                  :
                </Text>
                <View className="flex-row items-center gap-7">
                  <TouchableOpacity
                    onPress={() => handleSubtract("bedrooms")}
                    disabled={bedrooms <= roomLimits.bedrooms.min}
                    style={{
                      opacity: bedrooms <= roomLimits.bedrooms.min ? 0.3 : 1,
                    }}
                  >
                    <CircleMinus size={30} color={colors.textPrimary} />
                  </TouchableOpacity>

                  <Text className="text-foreground text-xl font-interMedium">
                    {bedrooms}
                  </Text>

                  <TouchableOpacity
                    onPress={() => handleAdd("bedrooms")}
                    disabled={bedrooms >= roomLimits.bedrooms.max}
                    style={{
                      opacity: bedrooms >= roomLimits.bedrooms.max ? 0.3 : 1,
                    }}
                  >
                    <CirclePlus size={30} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>
              {errors.bedrooms && (
                <Text className="text-danger text-sm font-inter mt-1">
                  {errors.bedrooms}
                </Text>
              )}
            </View>
          )}

          {/* Max Occupants */}
          {!maxOccupantsHidden && (
            <View>
              <View className="flex-row items-center justify-between mt-5">
                <Text className="text-foreground text-lg font-interMedium">
                  Max Occupants
                  {typeRoomLimits
                    ? formatRange(
                        roomLimits.maxOccupants.min,
                        roomLimits.maxOccupants.max,
                      )
                    : ""}
                  :
                </Text>
                <View className="flex-row items-center gap-7">
                  <TouchableOpacity
                    onPress={() => handleSubtract("maxOccupants")}
                    disabled={maxOccupants <= roomLimits.maxOccupants.min}
                    style={{
                      opacity:
                        maxOccupants <= roomLimits.maxOccupants.min ? 0.3 : 1,
                    }}
                  >
                    <CircleMinus size={30} color={colors.textPrimary} />
                  </TouchableOpacity>

                  <Text className="text-foreground text-xl font-interMedium">
                    {maxOccupants}
                  </Text>

                  <TouchableOpacity
                    onPress={() => handleAdd("maxOccupants")}
                    disabled={maxOccupants >= roomLimits.maxOccupants.max}
                    style={{
                      opacity:
                        maxOccupants >= roomLimits.maxOccupants.max ? 0.3 : 1,
                    }}
                  >
                    <CirclePlus size={30} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>
              {errors.maxOccupants && (
                <Text className="text-danger text-sm font-inter mt-1">
                  {errors.maxOccupants}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Apartment Address */}
        <View className="flex gap-3 mt-10">
          <Text className="text-foreground text-lg font-interSemiBold">
            Apartment Address
          </Text>

          <TextField isRequired isInvalid={!!errors.streetName}>
            <Label>Unit No./Street Name:</Label>
            <Input
              placeholder="Enter street name"
              value={streetName}
              onChangeText={(value) => {
                setField("streetName", value);
                clearError("streetName");
              }}
            />
            {errors.streetName && <FieldError>{errors.streetName}</FieldError>}
          </TextField>

          <TextField isRequired isInvalid={!!errors.barangay}>
            <Label>Barangay:</Label>
            <Input
              placeholder="Enter barangay name"
              value={barangay}
              onChangeText={(value) => {
                setField("barangay", value);
                clearError("barangay");
              }}
            />
            {errors.barangay && <FieldError>{errors.barangay}</FieldError>}
          </TextField>

          {/* Province — now above City */}
          <DropdownField
            label="Province:"
            bottomSheetLabel="Select your province"
            placeholder="Select your province"
            options={PROVINCES}
            value={province}
            onSelect={(value) => {
              // Clear city if it no longer belongs to the new province
              const newCities: string[] =
                CITIES[value as keyof typeof CITIES] ?? [];
              if (city && !newCities.includes(city)) {
                setField("city", "");
                clearError("city");
              }
              setField("province", value || "");
              clearError("province");
            }}
            enableSearch
            searchPlaceholder="Search provinces..."
            required
            error={errors.province}
          />

          {/* City — dependent on province */}
          <DropdownField
            label="City:"
            bottomSheetLabel="Select your city"
            placeholder={
              province ? "Select your city" : "Select a province first"
            }
            options={cityOptions}
            value={city}
            onSelect={(value) => {
              setField("city", value || "");
              clearError("city");
            }}
            enableSearch
            searchPlaceholder="Search cities..."
            required
            disabled={!province}
            error={errors.city}
          />

          <TextField isRequired isInvalid={!!errors.postalCode}>
            <Label>Zip Code:</Label>
            <Input
              placeholder="Enter zip code"
              value={postalCode}
              keyboardType="numeric"
              onChangeText={(value) => {
                setField("postalCode", value);
                clearError("postalCode");
              }}
            />
            {errors.postalCode && <FieldError>{errors.postalCode}</FieldError>}
          </TextField>
        </View>

        {/* Apartment Location */}
        <View className="flex gap-2 mt-10">
          <Text className="text-foreground text-lg font-interSemiBold">
            Apartment Map Location
          </Text>

          <Text className="text-muted text-base font-inter">
            Check if the pin location is correct. Drag the pin to the correct
            location if needed.
          </Text>

          {/* Map Button */}
          <TouchableOpacity
            className="rounded-3xl h-52 w-full overflow-hidden"
            onPress={() =>
              router.push("/manage-apartment/add-apartment/map-pin")
            }
            activeOpacity={0.85}
          >
            <View style={{ flex: 1 }} pointerEvents="none">
              <MapView
                style={{ flex: 1 }}
                mapStyle={MAP_STYLE}
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
              >
                <Camera
                  centerCoordinate={[
                    longitude ?? DEFAULT_COORDS.longitude,
                    latitude ?? DEFAULT_COORDS.latitude,
                  ]}
                  zoomLevel={15}
                  animationDuration={0}
                  maxZoomLevel={19}
                />

                {/* Only show pin if location has been confirmed */}
                {latitude && longitude && (
                  <ShapeSource
                    id="pin-source"
                    shape={{
                      type: "Feature",
                      geometry: {
                        type: "Point",
                        coordinates: [longitude, latitude],
                      },
                      properties: {},
                    }}
                  >
                    <CircleLayer
                      id="pin-ring"
                      style={{
                        circleRadius: 10,
                        circleColor: colors.white,
                      }}
                    />
                    <CircleLayer
                      id="pin-dot"
                      style={{
                        circleRadius: 7,
                        circleColor: colors.primary,
                      }}
                    />
                  </ShapeSource>
                )}
              </MapView>

              {/* Overlay hint when no location is set yet */}
              {!latitude && !longitude && (
                <View
                  style={{
                    position: "absolute",
                    bottom: 12,
                    alignSelf: "center",
                    backgroundColor: "rgba(0,0,0,0.5)",
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: 20,
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontFamily: "InterMedium",
                      fontSize: 13,
                    }}
                  >
                    Tap to pin location
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {latitude && longitude && (
            <View className="flex-row justify-between px-1">
              <Text className="text-foreground text-sm font-inter">
                Lat: {latitude.toFixed(6)}
              </Text>
              <Text className="text-foreground text-sm font-inter">
                Lng: {longitude.toFixed(6)}
              </Text>
            </View>
          )}

          <ControlField
            isSelected={mapConfirmed}
            isInvalid={!!errors.mapConfirmed}
            onSelectedChange={(selected) => {
              setField("mapConfirmed", selected);
              clearError("mapConfirmed");
            }}
            className="items-start"
          >
            <ControlField.Indicator>
              <Checkbox className="mt-0.5" />
            </ControlField.Indicator>
            <View className="flex-1">
              <Label>I confirm that the pin location is correct</Label>
              {errors.mapConfirmed && (
                <FieldError>{errors.mapConfirmed}</FieldError>
              )}
            </View>
          </ControlField>
        </View>

        {/* Back or Next Button */}
        <View className="flex-row mt-16 gap-4">
          <Button
            variant="outline"
            onPress={() => router.back()}
            className="flex-1"
          >
            <Button.Label>Back</Button.Label>
          </Button>

          <Button onPress={handleNext} className="flex-1">
            <Button.Label>Next</Button.Label>
          </Button>
        </View>
      </View>
    </ScreenWrapper>
  );
}
