import { Text, View } from "react-native";
import { useRouter } from 'expo-router';
import { useState } from "react";

import ScreenWrapper from "components/layout/ScreenWrapper";
import PillButton from "components/buttons/PillButton";
import PersonalizationRadioButton from "components/buttons/PersonalizationRadioButton";

export default function StepFour() {
  const router = useRouter();

  type familyType = {
    label: string;
    isSelected: boolean;
  }

  const [selectedNoFamily, setSelectedNoFamily] = useState<familyType[]>([
    { label: "Single", isSelected: false },
    { label: "Family of 2", isSelected: false },
    { label: "3 - 4 Persons", isSelected: false },
    { label: "5 - 6 Persons", isSelected: false },
    { label: "7+ Persons", isSelected: false },
  ]);

  const toggleNoFamily = (index: number) => {
    setSelectedNoFamily(prev =>
      prev.map((family, i) => ({
        ...family,
        isSelected: i === index
      }))
    );
  };

  const handleNext = () => {
    router.replace("/personalization/step-five");
  };

  return (
    <ScreenWrapper className="p-5">
      <View className="flex-1 justify-between">
        <View>
          {/* Question and Description */}
          <View className="flex gap-3 mb-5">
            {/* Question */}
            <Text className="text-secondary text-3xl font-dmserif">
              Can you share with us your family information?
            </Text>

            {/* Description */}
            <Text className="text-text text-lg font-inter">
              Help us personalize listings that fit your household.
            </Text>
          </View>

          {/* Radio Buttons */}
          <View className="flex-row flex-wrap justify-between">
            {
              selectedNoFamily.map((family, index) => (
                <PersonalizationRadioButton
                  key={index}
                  label={family.label}
                  selected={family.isSelected}
                  onPress={() => toggleNoFamily(index)}
                />
              ))
            }
          </View>
        </View>

        {/* Next Button*/}
        <PillButton
          label={"Continue"}
          onPress={handleNext}
          isFullWidth
        />
      </View>
    </ScreenWrapper>
  );
}
