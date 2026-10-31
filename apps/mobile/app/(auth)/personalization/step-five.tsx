import { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";

import ScreenWrapper from "components/layout/ScreenWrapper";
import DropdownField from "components/inputs/DropdownField";

import PersonalizationProgress from "./components/PersonalizationProgress";

import {
  PET_COUNT_OPTIONS,
  optionToPetCount,
  petCountToOption,
  OTHER_PET,
  PETS,
  VEHICLE_OPTIONS,
  getPetsError,
} from "@repo/constants";
import { PET_KEYS, VEHICLE_KEYS, enumLabel } from "@repo/i18n";

import { supabase } from "@repo/supabase";
import { useProfile } from "hooks/auth";

import {
  RadioGroup,
  Radio,
  Label,
  Checkbox,
  Description,
  Input,
  Button,
  ControlField,
  useToast,
  Separator,
  TextField
} from "heroui-native";

import { usePersonalizationStore } from "@/stores/usePersonalizationStore";
import { useTranslation } from "@/hooks/i18n";

export default function StepFive() {
  const router = useRouter();
  const { language, t } = useTranslation();

  const personalization = usePersonalizationStore();
  const {
    hasPets, setHasPets,
    kindOfPets, setKindOfPets,
    noOfPets, setNoOfPets,
    nameOfPets, setNameOfPets,
    hasParking, setHasParking,
    noOfParkingSpots, setNoOfParkingSpots,
    listOfVehicles, toggleVehicle,
    hasSmoker, setHasSmoker,
    hasDisability, setHasDisability,
    answered,
    reset,
  } = personalization;

  const { profile } = useProfile();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const NO_PARKING_OPTIONS = Array.from({ length: 5 }, (_, i) => `${i + 1}`);

  const petsError = getPetsError(hasPets, kindOfPets, noOfPets);

  const handleNext = async () => {
    if (petsError) {
      toast.show({
        variant: "danger",
        label: "Check your pets",
        description: petsError,
      });
      return;
    }

    if (!profile?.user_id) {
      router.replace("/(tabs)/(tenant)/rentals");
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("users")
        .update({
          preferences: {
            selectedCities: personalization.selectedCities,
            budgetMin: personalization.budgetMin,
            budgetMax: personalization.budgetMax,
            bedroomCount: personalization.bedroomCount,
            householdSize: personalization.householdSize,
            hasPets: personalization.hasPets,
            kindOfPets: personalization.kindOfPets,
            noOfPets: personalization.noOfPets,
            nameOfPets: personalization.nameOfPets,
            hasParking: personalization.hasParking,
            noOfParkingSpots: personalization.noOfParkingSpots,
            listOfVehicles: personalization.listOfVehicles,
            hasSmoker: personalization.hasSmoker,
            hasDisability: personalization.hasDisability,
          },
        })
        .eq("user_id", profile.user_id);

      if (error) {
        console.error("Failed to save preferences:", error);
        toast.show({
          variant: "danger",
          label: t("authMobile.personalization.saveFailed"),
          description: t("authMobile.personalization.tryAgain"),
        });
        return;
      }

      reset();
      router.replace("/(tabs)/(tenant)/rentals");
    } catch (err) {
      // Network-level failure (e.g. request never reached Supabase)
      console.error("Unexpected error saving preferences:", err);
      toast.show({
        variant: "danger",
        label: t("authMobile.somethingWentWrong"),
        description: t("authMobile.personalization.networkBody"),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenWrapper scrollable className="p-5">
      <View className="flex-1 justify-between">
        <View className="mb-20">
          <PersonalizationProgress currentStep={5} />

          {/* Question and Description */}
          <View className="flex gap-3 mb-5">
            <Text className="text-accent text-2xl font-nunitoMedium">
              {t("authMobile.personalization.preferencesQuestion")}
            </Text>
            <Text className="text-foreground text-base font-inter">
              {t("authMobile.personalization.preferencesBody")}
            </Text>
          </View>

          {/* Pets */}
          <View className="flex gap-5">
            <View className="flex gap-3">
              <Text className="text-foreground text-base font-nunitoSemiBold">
                {t("authMobile.personalization.hasPetsQuestion")}
              </Text>

              <RadioGroup
                value={answered.hasPets ? (hasPets ? "yes" : "no") : ""}
                onValueChange={(val) => setHasPets(val === "yes")}
              >
                <RadioGroup.Item
                  value="yes"
                  className="flex-row items-center justify-start gap-2"
                >
                  <Radio>
                    <Radio.Indicator className="border border-border shadow-none rounded-full" />
                  </Radio>
                  <Label>{t("common.yes")}</Label>
                </RadioGroup.Item>
                <RadioGroup.Item
                  value="no"
                  className="flex-row items-center justify-start gap-2"
                >
                  <Radio>
                    <Radio.Indicator className="border border-border shadow-none rounded-full" />
                  </Radio>
                  <Label>{t("common.no")}</Label>
                </RadioGroup.Item>
              </RadioGroup>
            </View>

            {hasPets && (
              <DropdownField
                label={t("authMobile.personalization.petCountQuestion")}
                bottomSheetLabel={t("authMobile.personalization.petCountSheet")}
                placeholder={t("authMobile.personalization.petCountPlaceholder")}
                options={PET_COUNT_OPTIONS}
                onSelect={(value) => setNoOfPets(value ? optionToPetCount(value) : 1)}
                value={petCountToOption(noOfPets)}
                error={kindOfPets.length > 0 ? petsError ?? undefined : undefined}
                required
              />
            )}

            {hasPets && (
              <DropdownField
                label={t("authMobile.personalization.petsQuestion")}
                bottomSheetLabel={t("authMobile.personalization.petSheet")}
                placeholder={t("authMobile.personalization.petPlaceholder")}
                options={PETS}
                optionLabel={(value) => enumLabel(language, PET_KEYS, value)}
                multiple
                values={kindOfPets}
                onSelectMultiple={setKindOfPets}
                required
              />
            )}

            {hasPets && kindOfPets.includes(OTHER_PET) && (
              <TextField isRequired>
                <Label>{t("authMobile.personalization.petSpecify")}</Label>
                <Input
                  placeholder={t("authMobile.personalization.petType")}
                  value={nameOfPets || ""}
                  onChangeText={(value) => setNameOfPets(value)}
                />
                <Description>
                  {t("settings.rental.petOther.placeholder")}
                </Description>
              </TextField>
            )}
          </View>

          <Separator className="my-5" />

          {/* Parking */}
          <View className="flex gap-5">
            <View className="flex gap-3">
              <Text className="text-foreground text-lg font-nunitoSemiBold">
                {t("authMobile.personalization.hasParkingQuestion")}
              </Text>

              <RadioGroup
                value={answered.hasParking ? (hasParking ? "yes" : "no") : ""}
                onValueChange={(val) => setHasParking(val === "yes")}
              >
                <RadioGroup.Item
                  value="yes"
                  className="flex-row items-center justify-start gap-2"
                >
                  <Radio>
                    <Radio.Indicator className="border border-border shadow-none rounded-full" />
                  </Radio>
                  <Label>{t("common.yes")}</Label>
                </RadioGroup.Item>
                <RadioGroup.Item
                  value="no"
                  className="flex-row items-center justify-start gap-2"
                >
                  <Radio>
                    <Radio.Indicator className="border border-border shadow-none rounded-full" />
                  </Radio>
                  <Label>{t("common.no")}</Label>
                </RadioGroup.Item>
              </RadioGroup>
            </View>

            {hasParking && (
              <DropdownField
                label={t("authMobile.personalization.parkingQuestion")}
                bottomSheetLabel={t("authMobile.personalization.parkingSheet")}
                placeholder={t("authMobile.personalization.parkingPlaceholder")}
                options={NO_PARKING_OPTIONS}
                onSelect={(value) =>
                  setNoOfParkingSpots(value ? Number(value) : 1)
                }
                value={String(noOfParkingSpots)}
                required
              />
            )}

            {hasParking && noOfParkingSpots > 0 && (
              <View className="flex gap-3">
                <Text className="text-foreground text-base font-nunitoSemiBold">
                  {t("authMobile.personalization.vehiclesQuestion")}
                </Text>

                {VEHICLE_OPTIONS.map((vehicle) => (
                  <ControlField
                    key={vehicle}
                    isSelected={listOfVehicles.includes(vehicle)}
                    onSelectedChange={() => toggleVehicle(vehicle)}
                  >
                    <ControlField.Indicator>
                      <Checkbox className="border border-border shadow-none" />
                    </ControlField.Indicator>

                    <Label>
                      {enumLabel(language, VEHICLE_KEYS, vehicle)}
                    </Label>
                  </ControlField>
                ))}
              </View>
            )}
          </View>

          <Separator className="my-5" />

          {/* Smoker */}
          <View className="flex gap-3">
            <Text className="text-foreground text-lg font-nunitoSemiBold">
              {t("authMobile.personalization.smokerQuestion")}
            </Text>

            <RadioGroup
              value={answered.hasSmoker ? (hasSmoker ? "yes" : "no") : ""}
              onValueChange={(val) => setHasSmoker(val === "yes")}
            >
              <RadioGroup.Item
                value="yes"
                className="flex-row items-center justify-start gap-2"
              >
                <Radio>
                  <Radio.Indicator className="border border-border shadow-none rounded-full" />
                </Radio>
                <Label>{t("common.yes")}</Label>
              </RadioGroup.Item>
              <RadioGroup.Item
                value="no"
                className="flex-row items-center justify-start gap-2"
              >
                <Radio>
                  <Radio.Indicator className="border border-border shadow-none rounded-full" />
                </Radio>
                <Label>{t("common.no")}</Label>
              </RadioGroup.Item>
            </RadioGroup>
          </View>

          <Separator className="my-5" />

          {/* Disability */}
          <View className="flex gap-3">
            <Text className="text-foreground text-lg font-nunitoSemiBold">
              {t("authMobile.personalization.disabilityQuestion")}
            </Text>

            <RadioGroup
              value={answered.hasDisability ? (hasDisability ? "yes" : "no") : ""}
              onValueChange={(val) => setHasDisability(val === "yes")}
            >
              <RadioGroup.Item
                value="yes"
                className="flex-row items-center justify-start gap-2"
              >
                <Radio>
                  <Radio.Indicator className="border border-border shadow-none rounded-full" />
                </Radio>
                <Label>{t("common.yes")}</Label>
              </RadioGroup.Item>
              <RadioGroup.Item
                value="no"
                className="flex-row items-center justify-start gap-2"
              >
                <Radio>
                  <Radio.Indicator className="border border-border shadow-none rounded-full" />
                </Radio>
                <Label>{t("common.no")}</Label>
              </RadioGroup.Item>
            </RadioGroup>
          </View>
        </View>

        {/* Next Button */}
        <Button onPress={handleNext} isDisabled={isSaving}>
          <Button.Label>
            {isSaving
              ? t("common.saving")
              : t("authMobile.personalization.finish")}
          </Button.Label>
        </Button>
      </View>
    </ScreenWrapper>
  );
}
