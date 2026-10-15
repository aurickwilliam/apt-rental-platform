import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import ScreenWrapper from "components/layout/ScreenWrapper";
import ApplicationHeader from "@/components/layout/ApplicationHeader";
import {
  ADD_APARTMENT_STEP_HREFS,
  ADD_APARTMENT_STEP_LABELS,
  ADD_APARTMENT_TOTAL_STEPS,
} from "constants/addApartmentSteps";
import DropdownField from "components/inputs/DropdownField";
import MapViewSwitcher from "@/components/maps/MapViewSwitcher";

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
  FLOOR_LEVELS,
  FURNISHED_TYPES,
  LEASE_DURATIONS,
  APARTMENT_FLOOR_AREA,
  APARTMENT_ROOM_LIMITS,
  CAMANAVA_CITIES,
  isCamanavaCity,
  isCamanavaZipForCity,
} from "@repo/constants";

import { IconCirclePlus, IconCircleMinus } from '@tabler/icons-react-native';

import { useApartmentFormStore } from "@/stores/useApartmentFormStore";
import { isPinInsideCamanavaCity } from "@/service/apartments/apartmentLocationService";

import { useColors } from "hooks/useTheme";

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
  const [checkingPin, setCheckingPin] = useState(false);

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

  // An error belongs to the value it was raised for. Once that value changes
  // (here, or on the map-pin screen through the shared store) it disappears.
  const fieldValues: Record<keyof FormErrors, string> = {
    apartmentType,
    streetName,
    barangay,
    city,
    province,
    postalCode,
    floorArea,
    bathrooms: String(bathrooms),
    bedrooms: String(bedrooms),
    maxOccupants: String(maxOccupants),
    furnishingType,
    mapConfirmed: `${mapConfirmed}|${latitude}|${longitude}|${city}`,
    floorLevel: floorLevel ?? "",
    leaseDuration,
  };
  const [errorValues, setErrorValues] = useState(fieldValues);
  const visibleErrors: FormErrors = Object.fromEntries(
    Object.entries(errors).filter(
      ([field, message]) =>
        message &&
        errorValues[field as keyof FormErrors] ===
          fieldValues[field as keyof FormErrors],
    ),
  );

  const showErrors = (next: FormErrors) => {
    setErrors(next);
    setErrorValues(fieldValues);
  };

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
    queueMicrotask(() => {
      setErrors((prev) =>
        prev.floorLevel ? { ...prev, floorLevel: undefined } : prev,
      );
    });
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
    if (province !== "Metro Manila") {
      errs.province = "Properties can only be listed in Metro Manila";
    }
    if (!isCamanavaCity(city)) errs.city = "Select a city within CAMANAVA";
    if (!postalCode.trim()) {
      errs.postalCode = "Zip code is required";
    } else if (isCamanavaCity(city) && !isCamanavaZipForCity(city, postalCode)) {
      errs.postalCode = `Enter a valid ${city} zip code`;
    }
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

  const handleNext = async () => {
    const validationErrors = validateStep();

    if (Object.keys(validationErrors).length > 0) {
      showErrors(validationErrors);
      return;
    }

    // Same boundary check the database runs on publish, so a wrong pin is
    // caught here rather than at the last step.
    if (latitude == null || longitude == null) {
      showErrors({ mapConfirmed: "Please pin your property location on the map" });
      return;
    }
    setCheckingPin(true);
    try {
      const inside = await isPinInsideCamanavaCity(city, latitude, longitude);
      if (!inside) {
        showErrors({ mapConfirmed: `The map pin must be inside ${city}` });
        return;
      }
    } catch (err) {
      console.error("CAMANAVA pin check failed", err);
      showErrors({ mapConfirmed: "We couldn't verify this pin. Please try again" });
      return;
    } finally {
      setCheckingPin(false);
    }

    setErrors({});
    router.push("/landlord/manage-apartment/add-apartment/third-step");
  };

  return (
    <ScreenWrapper scrollable>
      <ApplicationHeader
        currentTitle={"Basic Info"}
        nextTitle={"Pricing & Terms"}
        step={2}
        totalSteps={ADD_APARTMENT_TOTAL_STEPS}
        stepLabels={ADD_APARTMENT_STEP_LABELS}
        stepHrefs={ADD_APARTMENT_STEP_HREFS}
      />

      <View className="p-5">
        {/* Name and Type */}

        {/* Apartment Details */}
        <View className="flex">
          <Text className="text-foreground text-lg font-nunitoSemiBold">
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
              error={visibleErrors.apartmentType}
              onSelect={(value) => {
                setField("apartmentType", value || "");
                clearError("apartmentType");
              }}
            />
          </View>

          <View className="flex gap-3 mt-3">
            <TextField isRequired isInvalid={!!visibleErrors.floorArea}>
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
              {visibleErrors.floorArea && <FieldError>{visibleErrors.floorArea}</FieldError>}
            </TextField>

            <DropdownField
              label="Furnished Type:"
              required
              placeholder="Select furnishing type"
              options={FURNISHED_TYPES}
              bottomSheetLabel={"Select Furnishing Type"}
              value={furnishingType}
              error={visibleErrors.furnishingType}
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
              error={visibleErrors.floorLevel}
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
              error={visibleErrors.leaseDuration}
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
                <Text className="text-foreground text-lg font-nunitoSemiBold">
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
                    <IconCircleMinus size={30} color={colors.textPrimary} />
                  </TouchableOpacity>

                  <Text className="text-foreground text-xl font-nunitoSemiBold">
                    {bathrooms}
                  </Text>

                  <TouchableOpacity
                    onPress={() => handleAdd("bathrooms")}
                    disabled={bathrooms >= roomLimits.bathrooms.max}
                    style={{
                      opacity: bathrooms >= roomLimits.bathrooms.max ? 0.3 : 1,
                    }}
                  >
                    <IconCirclePlus size={30} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>
              {visibleErrors.bathrooms && (
                <Text className="text-danger text-sm font-inter mt-1">
                  {visibleErrors.bathrooms}
                </Text>
              )}
            </View>
          )}

          {/* Bedrooms */}
          {!bedroomsHidden && (
            <View>
              <View className="flex-row items-center justify-between mt-5">
                <Text className="text-foreground text-lg font-nunitoSemiBold">
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
                    <IconCircleMinus size={30} color={colors.textPrimary} />
                  </TouchableOpacity>

                  <Text className="text-foreground text-xl font-nunitoSemiBold">
                    {bedrooms}
                  </Text>

                  <TouchableOpacity
                    onPress={() => handleAdd("bedrooms")}
                    disabled={bedrooms >= roomLimits.bedrooms.max}
                    style={{
                      opacity: bedrooms >= roomLimits.bedrooms.max ? 0.3 : 1,
                    }}
                  >
                    <IconCirclePlus size={30} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>
              {visibleErrors.bedrooms && (
                <Text className="text-danger text-sm font-inter mt-1">
                  {visibleErrors.bedrooms}
                </Text>
              )}
            </View>
          )}

          {/* Max Occupants */}
          {!maxOccupantsHidden && (
            <View>
              <View className="flex-row items-center justify-between mt-5">
                <Text className="text-foreground text-lg font-nunitoSemiBold">
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
                    <IconCircleMinus size={30} color={colors.textPrimary} />
                  </TouchableOpacity>

                  <Text className="text-foreground text-xl font-nunitoSemiBold">
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
                    <IconCirclePlus size={30} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>
              {visibleErrors.maxOccupants && (
                <Text className="text-danger text-sm font-inter mt-1">
                  {visibleErrors.maxOccupants}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Apartment Location */}
        <View className="flex gap-2 mt-10">
          <Text className="text-foreground text-lg font-nunitoSemiBold">
            Apartment Location
          </Text>

          <Text className="text-muted text-base font-inter">
            Start by pinning your property on the map. Searching an address
            there fills in the fields below; drag the pin to fine-tune.
          </Text>

          {/* Map Button */}
          <TouchableOpacity
            className="rounded-3xl h-52 w-full overflow-hidden"
            onPress={() =>
              router.push("/landlord/manage-apartment/add-apartment/map-pin")
            }
            activeOpacity={0.85}
          >
            <View style={{ flex: 1 }} pointerEvents="none">
              <MapViewSwitcher
                latitude={latitude}
                longitude={longitude}
                interactive={false}
                style={{ flex: 1 }}
              />

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
                      fontFamily: "Nunito-SemiBold",
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
            isInvalid={!!visibleErrors.mapConfirmed}
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
              {visibleErrors.mapConfirmed && (
                <FieldError>{visibleErrors.mapConfirmed}</FieldError>
              )}
            </View>
          </ControlField>
        </View>

        {/* Apartment Address */}
        <View className="flex gap-3 mt-10">
          <Text className="text-foreground text-lg font-nunitoSemiBold">
            Apartment Address
          </Text>

          <DropdownField
            label="City:"
            bottomSheetLabel="Select your city"
            placeholder="Select CAMANAVA city"
            options={[...CAMANAVA_CITIES]}
            value={city}
            onSelect={(value) => {
              setField("city", value || "");
              setField("province", "Metro Manila");
              clearError("city");
              clearError("postalCode");
              clearError("mapConfirmed");
            }}
            required
            error={visibleErrors.city}
          />

          <TextField isDisabled isInvalid={!!visibleErrors.province}>
            <Label>Province:</Label>
            <Input value="Metro Manila" editable={false} />
            <Description>Listings are limited to the CAMANAVA area of Metro Manila.</Description>
            {visibleErrors.province && <FieldError>{visibleErrors.province}</FieldError>}
          </TextField>

          <TextField isRequired isInvalid={!!visibleErrors.barangay}>
            <Label>Barangay:</Label>
            <Input
              placeholder="Enter barangay name"
              value={barangay}
              onChangeText={(value) => {
                setField("barangay", value);
                clearError("barangay");
              }}
            />
            {visibleErrors.barangay && <FieldError>{visibleErrors.barangay}</FieldError>}
          </TextField>

          <TextField isRequired isInvalid={!!visibleErrors.streetName}>
            <Label>Unit No./Street Name:</Label>
            <Input
              placeholder="Enter street name"
              value={streetName}
              onChangeText={(value) => {
                setField("streetName", value);
                clearError("streetName");
              }}
            />
            {visibleErrors.streetName && <FieldError>{visibleErrors.streetName}</FieldError>}
          </TextField>

          <TextField isRequired isInvalid={!!visibleErrors.postalCode}>
            <Label>Zip Code:</Label>
            <Input
              placeholder="Enter zip code"
              value={postalCode}
              keyboardType="numeric"
              maxLength={4}
              onChangeText={(value) => {
                setField("postalCode", value.replace(/[^0-9]/g, ""));
                clearError("postalCode");
              }}
            />
            {visibleErrors.postalCode && <FieldError>{visibleErrors.postalCode}</FieldError>}
          </TextField>
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

          <Button onPress={handleNext} className="flex-1" isDisabled={checkingPin}>
            <Button.Label>{checkingPin ? "Checking pin..." : "Next"}</Button.Label>
          </Button>
        </View>
      </View>
    </ScreenWrapper>
  );
}
