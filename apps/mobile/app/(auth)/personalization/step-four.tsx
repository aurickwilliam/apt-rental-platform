import { Text, View } from "react-native";
import { useRouter } from "expo-router";

import ScreenWrapper from "components/layout/ScreenWrapper";
import PersonalizationRadioButton from "./components/PersonalizationRadioButton";
import PersonalizationProgress from "./components/PersonalizationProgress";

import { Button } from "heroui-native";

import { usePersonalizationStore } from "@/stores/usePersonalizationStore";

export default function StepFour() {
  const router = useRouter();

  const { householdSize, setHouseholdSize } = usePersonalizationStore();

  const familyOptions = [
    "Single",
    "Family of 2",
    "3 - 4 Persons",
    "5 - 6 Persons",
    "7+ Persons",
  ];

  const handleNext = () => {
    router.replace("/personalization/step-five");
  };

  return (
    <ScreenWrapper className="p-5">
      <View className="flex-1 justify-between">
        <View>
          <PersonalizationProgress currentStep={4} />

          {/* Question and Description */}
          <View className="flex gap-3 mb-5">
            <Text className="text-secondary text-2xl font-nunitoMedium">
              Can you share with us your family information?
            </Text>

            <Text className="text-foreground text-base font-inter">
              Help us personalize listings that fit your household.
            </Text>
          </View>

          {/* Family Size Radio Buttons */}
          <View className="flex-row flex-wrap justify-between">
            {familyOptions.map((option) => (
              <PersonalizationRadioButton
                key={option}
                label={option}
                selected={householdSize === option}
                onPress={() => setHouseholdSize(option)}
              />
            ))}
          </View>
        </View>

        {/* Next Button */}
        <Button onPress={handleNext}>
          <Button.Label>
            {householdSize !== null ? "Next" : "Skip"}
          </Button.Label>
        </Button>
      </View>
    </ScreenWrapper>
  );
}