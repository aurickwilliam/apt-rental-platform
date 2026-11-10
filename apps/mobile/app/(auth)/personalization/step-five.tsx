import { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";

import ScreenWrapper from "components/layout/ScreenWrapper";
import ParkingDetailsFields from "components/preferences/ParkingDetailsFields";
import PetDetailsFields from "components/preferences/PetDetailsFields";
import YesNoRadioField from "components/preferences/YesNoRadioField";

import PersonalizationProgress from "./components/PersonalizationProgress";

import { getPetsError } from "@repo/constants";

import { useTranslation } from "@/hooks/i18n";

import { supabase } from "@repo/supabase";
import { useProfile } from "hooks/auth";

import { Button, useToast, Separator } from "heroui-native";

import { usePersonalizationStore } from "@/stores/usePersonalizationStore";
import { useWelcomeStore } from "@/stores/useWelcomeStore";

export default function StepFive() {
  const router = useRouter();

  const personalization = usePersonalizationStore();
  const {
    hasPets, setHasPets,
    kindOfPets, setKindOfPets,
    noOfPets, setNoOfPets,
    nameOfPets, setNameOfPets,
    hasParking, setHasParking,
    noOfParkingSpots, setNoOfParkingSpots,
    listOfVehicles, setListOfVehicles,
    hasSmoker, setHasSmoker,
    hasDisability, setHasDisability,
    answered,
    reset,
  } = personalization;

  const { profile, loading: profileLoading, refetch: refetchProfile } = useProfile();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const petsError = getPetsError(hasPets, kindOfPets, noOfPets);

  const handleNext = async () => {
    if (isSaving || profileLoading) return;

    if (petsError) {
      toast.show({
        variant: "danger",
        label: t("authMobile.personalization.checkPets"),
        description: petsError,
      });
      return;
    }

    setIsSaving(true);

    try {
      const currentProfile = profile ?? (await refetchProfile()).data;
      if (!currentProfile?.user_id) {
        toast.show({
          variant: "danger",
          label: t("authMobile.personalization.accountLoadFailed"),
          description: t("authMobile.personalization.tryFinish"),
        });
        return;
      }

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
        .eq("user_id", currentProfile.user_id);

      if (error) {
        console.error("Failed to save preferences:", error);
        toast.show({
          variant: "danger",
          label: t("authMobile.personalization.saveFailed"),
          description: t("authMobile.personalization.tryAgain"),
        });
        return;
      }

      useWelcomeStore.getState().request(currentProfile.user_id);
      reset();
      router.replace("/(tabs)/(tenant)/rentals");
    } catch (err) {
      // Network-level failure (e.g. request never reached Supabase)
      console.error("Unexpected error saving preferences:", err);
      toast.show({
        variant: "danger",
        label: t("authMobile.personalization.networkFailed"),
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
            <YesNoRadioField
              label={t("authMobile.personalization.hasPetsQuestion")}
              value={answered.hasPets ? hasPets : undefined}
              onChange={setHasPets}
            />

            {hasPets && (
              <PetDetailsFields
                kindOfPets={kindOfPets}
                noOfPets={noOfPets}
                nameOfPets={nameOfPets}
                onCountChange={(count, kinds) => {
                  setNoOfPets(count);
                  setKindOfPets(kinds);
                }}
                onKindsChange={setKindOfPets}
                onNameChange={setNameOfPets}
                error={petsError}
              />
            )}
          </View>

          <Separator className="my-5" />

          {/* Parking */}
          <View className="flex gap-5">
            <YesNoRadioField
              label={t("authMobile.personalization.hasParkingQuestion")}
              value={answered.hasParking ? hasParking : undefined}
              onChange={setHasParking}
            />

            {hasParking && (
              <ParkingDetailsFields
                noOfParkingSpots={noOfParkingSpots}
                listOfVehicles={listOfVehicles}
                onChange={(spots, vehicles) => {
                  setNoOfParkingSpots(spots);
                  setListOfVehicles(vehicles);
                }}
              />
            )}
          </View>

          <Separator className="my-5" />

          <YesNoRadioField
            label={t("authMobile.personalization.smokerQuestion")}
            value={answered.hasSmoker ? hasSmoker : undefined}
            onChange={setHasSmoker}
          />

          <Separator className="my-5" />

          <YesNoRadioField
            label={t("authMobile.personalization.disabilityQuestion")}
            value={answered.hasDisability ? hasDisability : undefined}
            onChange={setHasDisability}
          />
        </View>

        <View className="flex-row gap-3">
          <Button variant="secondary" className="flex-1" onPress={() => router.replace("/personalization/step-four")} isDisabled={isSaving}>
            <Button.Label>{t("common.back")}</Button.Label>
          </Button>
          <Button className="flex-1" onPress={handleNext} isDisabled={isSaving || profileLoading}>
            <Button.Label>
              {isSaving ? t("authMobile.personalization.saving") : profileLoading ? t("authMobile.personalization.loadingAccount") : t("authMobile.personalization.finish")}
            </Button.Label>
          </Button>
        </View>
      </View>
    </ScreenWrapper>
  );
}
