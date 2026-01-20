import { Text, Pressable, View } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Slider } from '@miblanchard/react-native-slider';

import { COLORS } from "../../../constants/colors";

import ScreenWrapper from "../../../components/layout/ScreenWrapper";
import PillButton from "../../../components/buttons/PillButton";

export default function StepTwo() {
  const router = useRouter();

  const [rentAmount, setRentAmount] = useState<number>(10_000);

  const handleSkip = () => {
    router.replace("/personalization/step-three");
  };

  const handleNext = () => {
    router.replace("/personalization/step-three");
  };

  return (
    <ScreenWrapper className="p-5">
      {/* Skip Button*/}
      <Pressable onPress={handleSkip}>
        <Text className="text-grey-300 text-base font-inter">
          Skip
        </Text>
      </Pressable>

      {/* Question and Descriptio */}
      <View className="flex gap-3 my-5">
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
        <Text className="text-primary text-6xl font-dmserif">
          ₱ {rentAmount.toLocaleString()}
        </Text>

        {/* Slider */}
        <Slider
          value={rentAmount}
          onValueChange={(value) => setRentAmount(value[0])}
          minimumValue={2_000}
          maximumValue={50_000}
          step={1_000}
          minimumTrackTintColor={ COLORS.primary }
          thumbTintColor={COLORS.primary}
          thumbStyle={{
            width: 20,
            height: 20,
            borderRadius: 100
          }}
          trackStyle={{
            height: 10,
            borderRadius: 50,
            backgroundColor: COLORS.lightLightLightGrey
          }}
          containerStyle={{ width: '90%' }}
        />
      </View>

      {/* Next Button*/}
      <PillButton
        label={"Next"}
        onPress={handleNext}
        isFullWidth
      />

    </ScreenWrapper>
  );
}
