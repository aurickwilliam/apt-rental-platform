import { Text, View } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";

import ScreenWrapper from "components/layout/ScreenWrapper";

import { Button, Slider } from "heroui-native";

export default function StepTwo() {
  const router = useRouter();

  const [budgetRange, setBudgetRange] = useState<number[]>([5_000, 100_000]);

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
            <Text className="text-secondary text-2xl font-nunitoMedium">
              Got a budget in mind for your place?
            </Text>

            {/* Description */}
            <Text className="text-text text-base font-inter">
              Select your preferred price range to see listings that fit your budget.
            </Text>
          </View>

          <View className="flex-1 items-center justify-center gap-10">
            {/* Rent Amount */}
            <Text className="text-primary text-3xl font-interSemiBold">
              ₱ {budgetRange[0].toLocaleString()} - ₱ {budgetRange[1].toLocaleString()}
            </Text>

            {/* Budget Range Slider */}
            <Slider
              value={budgetRange}
              onChange={(val) => setBudgetRange(val as number[])}
              minValue={5_000}
              maxValue={100_000}
              step={1_000}
            >
              <Slider.Track>
                {({ state }) => (
                  <>
                    <Slider.Fill />
                    {state.values.map((_, i) => (
                      <Slider.Thumb key={i} index={i} />
                    ))}
                  </>
                )}
              </Slider.Track>
            </Slider>
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