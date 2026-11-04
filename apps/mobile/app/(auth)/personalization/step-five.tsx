import { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";

import ScreenWrapper from "components/layout/ScreenWrapper";
import ParkingDetailsFields from "components/preferences/ParkingDetailsFields";
import PetDetailsFields from "components/preferences/PetDetailsFields";
import YesNoRadioField from "components/preferences/YesNoRadioField";

import PersonalizationProgress from "./components/PersonalizationProgress";

import { getPetsError } from "@repo/constants";

import { supabase } from "@repo/supabase";
import { useProfile } from "hooks/auth";

import { Button, useToast, Separator } from "heroui-native";

import { usePersonalizationStore } from "@/stores/usePersonalizationStore";

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

  const { profile } = useProfile();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

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
          label: "Couldn't save your preferences",
          description: "Please try again.",
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
        label: "Something went wrong",
        description: "Check your connection and try again.",
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
              What is your rental preferences?
            </Text>
            <Text className="text-foreground text-base font-inter">
              Fill-up the form and select the appropriate response to curate the
              properties that will fit for you.
            </Text>
          </View>

          {/* Pets */}
          <View className="flex gap-5">
            <YesNoRadioField
              label="Do you have any pets?"
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
              label="Do you need a parking space?"
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
            label="Is anyone in your household a smoker?"
            value={answered.hasSmoker ? hasSmoker : undefined}
            onChange={setHasSmoker}
          />

          <Separator className="my-5" />

          <YesNoRadioField
            label="Do you have any household members with a disability?"
            value={answered.hasDisability ? hasDisability : undefined}
            onChange={setHasDisability}
          />
        </View>

        {/* Next Button */}
        <Button onPress={handleNext} isDisabled={isSaving}>
          <Button.Label>
            {isSaving ? "Saving..." : "Let's find your place!"}
          </Button.Label>
        </Button>
      </View>
    </ScreenWrapper>
  );
}
