import { Text, View } from "react-native";
import { useRouter } from "expo-router";

import ScreenWrapper from "components/layout/ScreenWrapper";
import PersonalizationRadioButton from "./components/PersonalizationRadioButton";
import PersonalizationProgress from "./components/PersonalizationProgress";

import { Button } from "heroui-native";

import { usePersonalizationStore } from "@/stores/usePersonalizationStore";

export default function StepThree() {
  const router = useRouter();

  const { bedroomCount, setBedroomCount } = usePersonalizationStore();

  const bedroomOptions = ["1-2 Bedrooms", "2-4 Bedrooms", "4+ Bedrooms"];

  const handleNext = () => {
    router.replace("/personalization/step-four");
  };

  return (
    <ScreenWrapper className="p-5">
      <View className="flex-1 justify-between">
        <View>
          <PersonalizationProgress currentStep={3} />
          
          {/* Question and Description */}
          <View className="flex gap-3 mb-5">
            <Text className="text-secondary text-2xl font-nunitoMedium">
              How many bedrooms are you looking for?
            </Text>

            <Text className="text-foreground text-base font-inter">
              Select the number of bedrooms you prefer so we can filter properties
              that fit your needs.
            </Text>
          </View>

          {/* Bedroom Radio Buttons */}
          <View className="flex-row flex-wrap justify-between gap-y-1">
            {bedroomOptions.map((option) => (
              <PersonalizationRadioButton
                key={option}
                label={option}
                selected={bedroomCount === option}
                onPress={() => setBedroomCount(option)}
              />
            ))}
          </View>
        </View>

        {/* Next Button */}
        <Button onPress={handleNext}>
          <Button.Label>Next</Button.Label>
        </Button>
      </View>
    </ScreenWrapper>
  );
}