import { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";

import ScreenWrapper from "components/layout/ScreenWrapper";
import DropdownField from "components/inputs/DropdownField";
import TextField from "components/inputs/TextField";
import PersonalizationProgress from "./components/PersonalizationProgress";

import { PETS, VEHICLE_OPTIONS } from "@repo/constants";

import { supabase } from "@repo/supabase";
import { useProfile } from "hooks/auth";

import {
  RadioGroup,
  Radio,
  Label,
  Checkbox,
  Button,
  ControlField,
  useToast,
  Separator
} from "heroui-native";

import { usePersonalizationStore } from "@/stores/usePersonalizationStore";

export default function StepFive() {
  const router = useRouter();

  const personalization = usePersonalizationStore();
  const {
    hasPets, setHasPets,
    kindOfPets, setKindOfPets,
    nameOfPets, setNameOfPets,
    hasParking, setHasParking,
    noOfParkingSpots, setNoOfParkingSpots,
    listOfVehicles, toggleVehicle,
    hasSmoker, setHasSmoker,
    hasDisability, setHasDisability,
    reset,
  } = personalization;

  const { profile } = useProfile();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const NO_PARKING_OPTIONS = Array.from({ length: 5 }, (_, i) => `${i + 1}`);

  const handleNext = async () => {
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
            <Text className="text-secondary text-2xl font-nunitoMedium">
              What is your rental preferences?
            </Text>
            <Text className="text-foreground text-base font-inter">
              Fill-up the form and select the appropriate response to curate the
              properties that will fit for you.
            </Text>
          </View>

          {/* Pets */}
          <View className="flex gap-5">
            <View className="flex gap-3">
              <Text className="text-foreground text-base font-interMedium">
                Do you have any pets?
              </Text>

              <RadioGroup
                value={hasPets ? "yes" : "no"}
                onValueChange={(val) => setHasPets(val === "yes")}
              >
                <RadioGroup.Item
                  value="yes"
                  className="flex-row items-center justify-start gap-2"
                >
                  <Radio>
                    <Radio.Indicator className="border border-border shadow-none rounded-full" />
                  </Radio>
                  <Label>Yes</Label>
                </RadioGroup.Item>
                <RadioGroup.Item
                  value="no"
                  className="flex-row items-center justify-start gap-2"
                >
                  <Radio>
                    <Radio.Indicator className="border border-border shadow-none rounded-full" />
                  </Radio>
                  <Label>No</Label>
                </RadioGroup.Item>
              </RadioGroup>
            </View>

            {hasPets && (
              <DropdownField
                label="If yes, what kind of pet do you have?"
                bottomSheetLabel="Select your Pet"
                placeholder="Select the kind of pets you have"
                options={PETS}
                onSelect={(value) => setKindOfPets(value ?? "")}
                value={kindOfPets}
                required
              />
            )}

            {hasPets && kindOfPets === "Other" && (
              <TextField
                label="Please specify the kind of pet you have"
                placeholder="Type the kind of pet you have"
                value={nameOfPets || ""}
                onChangeText={(value) => setNameOfPets(value)}
                required
              />
            )}
          </View>

          <Separator className="my-5" />

          {/* Parking */}
          <View className="flex gap-5">
            <View className="flex gap-3">
              <Text className="text-foreground text-lg font-interMedium">
                Do you need a parking space?
              </Text>

              <RadioGroup
                value={hasParking ? "yes" : "no"}
                onValueChange={(val) => setHasParking(val === "yes")}
              >
                <RadioGroup.Item
                  value="yes"
                  className="flex-row items-center justify-start gap-2"
                >
                  <Radio>
                    <Radio.Indicator className="border border-border shadow-none rounded-full" />
                  </Radio>
                  <Label>Yes</Label>
                </RadioGroup.Item>
                <RadioGroup.Item
                  value="no"
                  className="flex-row items-center justify-start gap-2"
                >
                  <Radio>
                    <Radio.Indicator className="border border-border shadow-none rounded-full" />
                  </Radio>
                  <Label>No</Label>
                </RadioGroup.Item>
              </RadioGroup>
            </View>

            {hasParking && (
              <DropdownField
                label="If yes, how many cars or motorcycles do you have?"
                bottomSheetLabel="Select your Parking"
                placeholder="Select the number of parking you need"
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
                <Text className="text-foreground text-base font-interMedium">
                  Select the kinds of vehicles you have:
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

                    <Label>{vehicle}</Label>
                  </ControlField>
                ))}
              </View>
            )}
          </View>

          <Separator className="my-5" />

          {/* Smoker */}
          <View className="flex gap-3">
            <Text className="text-foreground text-lg font-interMedium">
              Is anyone in your household a smoker?
            </Text>

            <RadioGroup
              value={hasSmoker ? "yes" : "no"}
              onValueChange={(val) => setHasSmoker(val === "yes")}
            >
              <RadioGroup.Item
                value="yes"
                className="flex-row items-center justify-start gap-2"
              >
                <Radio>
                  <Radio.Indicator className="border border-border shadow-none rounded-full" />
                </Radio>
                <Label>Yes</Label>
              </RadioGroup.Item>
              <RadioGroup.Item
                value="no"
                className="flex-row items-center justify-start gap-2"
              >
                <Radio>
                  <Radio.Indicator className="border border-border shadow-none rounded-full" />
                </Radio>
                <Label>No</Label>
              </RadioGroup.Item>
            </RadioGroup>
          </View>

          <Separator className="my-5" />

          {/* Disability */}
          <View className="flex gap-3">
            <Text className="text-foreground text-lg font-interMedium">
              Do you have any household members with a disability?
            </Text>

            <RadioGroup
              value={hasDisability ? "yes" : "no"}
              onValueChange={(val) => setHasDisability(val === "yes")}
            >
              <RadioGroup.Item
                value="yes"
                className="flex-row items-center justify-start gap-2"
              >
                <Radio>
                  <Radio.Indicator className="border border-border shadow-none rounded-full" />
                </Radio>
                <Label>Yes</Label>
              </RadioGroup.Item>
              <RadioGroup.Item
                value="no"
                className="flex-row items-center justify-start gap-2"
              >
                <Radio>
                  <Radio.Indicator className="border border-border shadow-none rounded-full" />
                </Radio>
                <Label>No</Label>
              </RadioGroup.Item>
            </RadioGroup>
          </View>
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
