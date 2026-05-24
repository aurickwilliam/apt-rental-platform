import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";

import ScreenWrapper from "components/layout/ScreenWrapper";
import DropdownField from "components/inputs/DropdownField";
import Divider from "components/display/Divider";
import TextField from "components/inputs/TextField";

import { PETS } from "@repo/constants";

import { RadioGroup, Radio, Label, Checkbox, Button } from "heroui-native";

type rentalPreferenceType = {
  hasPets: boolean;
  kindOfPets: string;
  nameOfPets: string | null;
  hasParking: boolean;
  noOfParkingSpots: number | 0;
  hasSmoker: boolean;
  hasDisability: boolean;
  listOfVehicles: string[];
};

const vehicleOptions = ["Car", "Motorcycle", "Bicycle", "Other"];

export default function StepFive() {
  const router = useRouter();

  const [rentalPreference, setRentalPreference] =
    useState<rentalPreferenceType>({
      hasPets: false,
      kindOfPets: "",
      nameOfPets: null,
      hasParking: false,
      noOfParkingSpots: 0,
      hasSmoker: false,
      hasDisability: false,
      listOfVehicles: [],
    });

  const parkingOptions = Array.from({ length: 6 }, (_, i) => `${i}`);

  const updateRentalPreference = (
    key: keyof rentalPreferenceType,
    value: any,
  ) => {
    setRentalPreference((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleNext = () => {
    router.replace("/(tabs)/(tenant)/rentals");
  };

  const toggleVehicle = (vehicle: string) => {
    setRentalPreference((prev) => {
      const isSelected = prev.listOfVehicles.includes(vehicle);
      return {
        ...prev,
        listOfVehicles: isSelected
          ? prev.listOfVehicles.filter((v) => v !== vehicle)
          : [...prev.listOfVehicles, vehicle],
      };
    });
  };

  return (
    <ScreenWrapper scrollable className="p-5">
      <View className="flex-1 justify-between">
        <View className="mb-20">
          {/* Question and Description */}
          <View className="flex gap-3 mb-5">
            <Text className="text-secondary text-2xl font-nunitoMedium">
              What is your rental preferences?
            </Text>
            <Text className="text-text text-base font-inter">
              Fill-up the form and select the appropriate response to curate the
              properties that will fit for you.
            </Text>
          </View>

          {/* Pets */}
          <View className="flex gap-5">
            <View className="flex gap-3">
              <Text className="text-text text-base font-interMedium">
                Do you have any pets?
              </Text>

              <RadioGroup
                value={rentalPreference.hasPets ? "yes" : "no"}
                onValueChange={(val) =>
                  updateRentalPreference("hasPets", val === "yes")
                }
              >
                <RadioGroup.Item
                  value="yes"
                  className="flex-row items-center justify-start gap-2"
                >
                  <Radio>
                    <Radio.Indicator className="border border-grey-400 shadow-none rounded-full" />
                  </Radio>
                  <Label>Yes</Label>
                </RadioGroup.Item>
                <RadioGroup.Item
                  value="no"
                  className="flex-row items-center justify-start gap-2"
                >
                  <Radio>
                    <Radio.Indicator className="border border-grey-400 shadow-none rounded-full" />
                  </Radio>
                  <Label>No</Label>
                </RadioGroup.Item>
              </RadioGroup>
            </View>

            {rentalPreference.hasPets && (
              <DropdownField
                label="If yes, what kind of pet do you have?"
                bottomSheetLabel="Select your Pet"
                placeholder="Select the kind of pets you have"
                options={PETS}
                onSelect={(value) =>
                  updateRentalPreference("kindOfPets", value)
                }
                value={rentalPreference.kindOfPets}
                required
              />
            )}

            {rentalPreference.hasPets &&
              rentalPreference.kindOfPets === "Other" && (
                <TextField
                  label="Please specify the kind of pet you have"
                  placeholder="Type the kind of pet you have"
                  value={rentalPreference.nameOfPets || ""}
                  onChangeText={(value) =>
                    updateRentalPreference("nameOfPets", value)
                  }
                  required
                />
              )}
          </View>

          <Divider />

          {/* Parking */}
          <View className="flex gap-5">
            <View className="flex gap-3">
              <Text className="text-text text-lg font-interMedium">
                Do you need a parking space?
              </Text>

              <RadioGroup
                value={rentalPreference.hasParking ? "yes" : "no"}
                onValueChange={(val) =>
                  updateRentalPreference("hasParking", val === "yes")
                }
              >
                <RadioGroup.Item
                  value="yes"
                  className="flex-row items-center justify-start gap-2"
                >
                  <Radio>
                    <Radio.Indicator className="border border-grey-400 shadow-none rounded-full" />
                  </Radio>
                  <Label>Yes</Label>
                </RadioGroup.Item>
                <RadioGroup.Item
                  value="no"
                  className="flex-row items-center justify-start gap-2"
                >
                  <Radio>
                    <Radio.Indicator className="border border-grey-400 shadow-none rounded-full" />
                  </Radio>
                  <Label>No</Label>
                </RadioGroup.Item>
              </RadioGroup>
            </View>

            {rentalPreference.hasParking && (
              <DropdownField
                label="If yes, how many cars or motorcycles do you have?"
                bottomSheetLabel="Select your Parking"
                placeholder="Select the number of parking you need"
                options={parkingOptions}
                onSelect={(value) =>
                  updateRentalPreference("noOfParkingSpots", value)
                }
                value={String(rentalPreference.noOfParkingSpots)}
                required
              />
            )}

            {rentalPreference.hasParking &&
              rentalPreference.noOfParkingSpots > 0 && (
                <View className="flex gap-3">
                  <Text className="text-text text-base font-interMedium">
                    Select the kinds of vehicles you have:
                  </Text>

                  {vehicleOptions.map((vehicle) => (
                    <View key={vehicle} className="flex-row items-center gap-2">
                      <Checkbox
                        isSelected={rentalPreference.listOfVehicles.includes(
                          vehicle,
                        )}
                        onSelectedChange={() => toggleVehicle(vehicle)}
                        className="border border-grey-400 shadow-none"
                      />
                      <Label>{vehicle}</Label>
                    </View>
                  ))}
                </View>
              )}
          </View>

          <Divider />

          {/* Smoker */}
          <View className="flex gap-3">
            <Text className="text-text text-lg font-interMedium">
              Is anyone in your household a smoker?
            </Text>

            <RadioGroup
              value={rentalPreference.hasSmoker ? "yes" : "no"}
              onValueChange={(val) =>
                updateRentalPreference("hasSmoker", val === "yes")
              }
            >
              <RadioGroup.Item
                value="yes"
                className="flex-row items-center justify-start gap-2"
              >
                <Radio>
                  <Radio.Indicator className="border border-grey-400 shadow-none rounded-full" />
                </Radio>
                <Label>Yes</Label>
              </RadioGroup.Item>
              <RadioGroup.Item
                value="no"
                className="flex-row items-center justify-start gap-2"
              >
                <Radio>
                  <Radio.Indicator className="border border-grey-400 shadow-none rounded-full" />
                </Radio>
                <Label>No</Label>
              </RadioGroup.Item>
            </RadioGroup>
          </View>

          <Divider />

          {/* Disability */}
          <View className="flex gap-3">
            <Text className="text-text text-lg font-interMedium">
              Do you have any household members with a disability?
            </Text>

            <RadioGroup
              value={rentalPreference.hasDisability ? "yes" : "no"}
              onValueChange={(val) =>
                updateRentalPreference("hasDisability", val === "yes")
              }
            >
              <RadioGroup.Item
                value="yes"
                className="flex-row items-center justify-start gap-2"
              >
                <Radio>
                  <Radio.Indicator className="border border-grey-400 shadow-none rounded-full" />
                </Radio>
                <Label>Yes</Label>
              </RadioGroup.Item>
              <RadioGroup.Item
                value="no"
                className="flex-row items-center justify-start gap-2"
              >
                <Radio>
                  <Radio.Indicator className="border border-grey-400 shadow-none rounded-full" />
                </Radio>
                <Label>No</Label>
              </RadioGroup.Item>
            </RadioGroup>
          </View>
        </View>

        {/* Next Button*/}
        <Button onPress={handleNext}>
          <Button.Label>
            Let&apos;s find your place!
          </Button.Label>
        </Button>
      </View>
    </ScreenWrapper>
  );
}
