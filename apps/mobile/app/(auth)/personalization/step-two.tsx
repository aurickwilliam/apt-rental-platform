import { Text, View } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";

import ScreenWrapper from "components/layout/ScreenWrapper";
import PillButton from "components/buttons/PillButton";
import RangeSlider from "components/inputs/RangeSlider";

export default function StepTwo() {
  const router = useRouter();

  const [budgetRange, setBudgetRange] = useState<[number, number]>([5_000, 100_000]);

  const handleNext = () => {
    router.replace("/personalization/step-three");
  };

  return (
    <ScreenWrapper className="p-5">
      <View className="flex-1 justify-between">
        <View className="flex-1">
          {/* Question and Description */}
          <View className="flex gap-3">
            {/* Question */}
            <Text className="text-secondary text-3xl font-dmserif">
              Got a budget in mind for your place?
            </Text>

            {/* Description */}
            <Text className="text-text text-lg font-inter">
              Select your preferred price range to see listings that fit your budget.
            </Text>
          </View>

          <View className="flex-1 items-center justify-center gap-10">
            {/* Rent Amount */}
            <Text className="text-primary text-5xl font-dmserif">
              ₱ {budgetRange[0].toLocaleString()} - ₱ {budgetRange[1].toLocaleString()}
            </Text>

            {/* Budget Range Slider */}
            <RangeSlider
              label="Budget Range"
              min={5_000}
              max={100_000}
              values={budgetRange}
              step={1_000}
              onChange={setBudgetRange}
              format={(value) => `₱${value.toLocaleString()}`}
              showLabelRange={false}
              showTrackLabels={false}
            />
          </View>
        </View>
        
        {/* Next Button*/}
        <PillButton
          label={"Next"}
          onPress={handleNext}
          isFullWidth
        />
      </View>
    </ScreenWrapper>
  );
}
