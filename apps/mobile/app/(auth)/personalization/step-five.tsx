import { Text, View, TouchableOpacity } from "react-native";
import { useRouter } from 'expo-router';
import { useState } from "react";

import ScreenWrapper from "components/layout/ScreenWrapper";
import PillButton from "components/buttons/PillButton";
import RadioButton from "components/buttons/RadioButton";
import DropdownField from "components/inputs/DropdownField";
import Divider from "components/display/Divider";
import TextField from "components/inputs/TextField";

import { PETS } from "@repo/constants";

type rentalPreferenceType = {
  hasPets: boolean;
  kindOfPets: string;
  nameOfPets: string | null;
  hasParking: boolean;
  noOfParkingSpots: string | null;
  hasSmoker: boolean;
  hasDisability: boolean;
}

export default function StepFive() {
  const router = useRouter();

  const [rentalPreference, setRentalPreference] = useState<rentalPreferenceType>({
    hasPets: false,
    kindOfPets: "",
    nameOfPets: null,
    hasParking: false,
    noOfParkingSpots: null,
    hasSmoker: false,
    hasDisability: false,
  });

  // Number of Vehicles options for parking can be generated from 1 to 10
  const parkingOptions = Array.from({ length: 10 }, (_, i) => `${i + 1}`);
  parkingOptions.push("More than 10");

  // Function to update rental preferences
  const updateRentalPreference = (key: keyof rentalPreferenceType, value: any) => {
    setRentalPreference(prev => ({
      ...prev,
      [key]: value,
    }));
  }

  const handleSkip = () => {
    router.replace("/home");
  };

  const handleNext = () => {
    router.replace("/home");
  };

  return (
    <ScreenWrapper scrollable className="p-5">
      <View className="flex-1 justify-between">
        <View className="mb-20">
          {/* Skip Button*/}
          <TouchableOpacity 
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text className="text-grey-300 text-base font-inter">
              Skip
            </Text>
          </TouchableOpacity>

          {/* Question and Description */}
          <View className="flex gap-3 my-5">
            {/* Question */}
            <Text className="text-secondary text-3xl font-dmserif">
              What is your rental preferences?
            </Text>

            {/* Description */}
            <Text className="text-text text-lg font-inter">
              Fill-up the form and select the appropriate response to curate the properties that will fit for you. 
            </Text>
          </View>

          {/* Pets */}
          <View className="flex gap-5">
            <View className="flex gap-3">
              <Text className="text-text text-lg font-interMedium">
                Do you have any pets?
              </Text>

              <View className="flex-row gap-5 items-center">
                <RadioButton 
                  label={"Yes"} 
                  onPress={() => updateRentalPreference("hasPets", !rentalPreference.hasPets)} 
                  selected={rentalPreference.hasPets}                
                />
              </View>
            </View>

            {
              rentalPreference.hasPets && (
                <DropdownField 
                  label="If yes, what kind of pet do you have?"
                  bottomSheetLabel="Select your Pet"
                  placeholder="Select the kind of pets you have"
                  options={PETS}
                  onSelect={(value) => updateRentalPreference("kindOfPets", value)}
                  value={rentalPreference.kindOfPets}
                  required
                />
              )
            }

            {
              rentalPreference.hasPets && rentalPreference.kindOfPets === "Other" && (
                <TextField 
                  label="Please specify the kind of pet you have"
                  placeholder="Type the kind of pet you have"
                  value={rentalPreference.nameOfPets || ""}
                  onChangeText={(value) => updateRentalPreference("nameOfPets", value)}
                  required
                />
              )
            }
          </View>

          <Divider />

          {/* Parking */}
          <View className="flex gap-5">
            <View className="flex gap-3">
              <Text className="text-text text-lg font-interMedium">
                Do you need a parking space?
              </Text>

              <View className="flex-row gap-5 items-center">
                <RadioButton 
                  label={"Yes"} 
                  onPress={() => updateRentalPreference("hasParking", !rentalPreference.hasParking)} 
                  selected={rentalPreference.hasParking}                
                />
              </View>
            </View>

            {
              rentalPreference.hasParking && (
                <DropdownField 
                  label="If yes, how many cars or motorcycles do you have?"
                  bottomSheetLabel="Select your Parking"
                  placeholder="Select the number of parking you need"
                  options={parkingOptions}
                  onSelect={(value) => updateRentalPreference("noOfParkingSpots", value)}
                  value={rentalPreference.noOfParkingSpots}
                  required
                />
              )
            }
          </View>

          <Divider />

          {/* Smoker */}
          <View className="flex gap-3">
            <View className="flex gap-3">
              <Text className="text-text text-lg font-interMedium">
                Is anyone in your household a smoker?
              </Text>

              <View className="flex-row gap-5 items-center">
                <RadioButton 
                  label={"Yes"} 
                  onPress={() => updateRentalPreference("hasSmoker", !rentalPreference.hasSmoker)} 
                  selected={rentalPreference.hasSmoker}                
                />
              </View>
            </View>
          </View>

          <Divider />

          {/* Disability */}
          <View className="flex gap-3">
            <View className="flex gap-3">
              <Text className="text-text text-lg font-interMedium">
                Do you have any household members with a disability?
              </Text>

              <View className="flex-row gap-5 items-center">
                <RadioButton 
                  label={"Yes"} 
                  onPress={() => updateRentalPreference("hasDisability", !rentalPreference.hasDisability)} 
                  selected={rentalPreference.hasDisability}                
                />
              </View>
            </View>
          </View>
        </View>

        {/* Next Button*/}
        <PillButton
          label={"Let's find your place!"}
          onPress={handleNext}
          isFullWidth
        />
      </View>
    </ScreenWrapper>
  );
}
