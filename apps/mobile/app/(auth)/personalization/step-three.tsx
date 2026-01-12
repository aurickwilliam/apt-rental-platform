import { Text, Pressable, View } from "react-native";
import { useRouter } from 'expo-router';

import ScreenWrapper from "../../../components/ScreenWrapper";
import PillButton from "../../../components/PillButton";
import { useState } from "react";
import BedroomRadioButton from "../../../components/BedroomRadioButton";

export default function StepThree() {
  const router = useRouter();

  type bedroomType = {
    bedRoomLabel: string;
    isSelected: boolean;
  }

  const [selectedBedroomCount, setSelectedBedroomCount] = useState<bedroomType[]>([
    { bedRoomLabel: "1-2 Bedrooms", isSelected: false },
    { bedRoomLabel: "2-4 Bedrooms", isSelected: false },
    { bedRoomLabel: "4+ Bedrooms", isSelected: false },
  ]);

  const toggleBedroomByIndex = (index: number) => {
    setSelectedBedroomCount(prev =>
      prev.map((bedroom, i) => ({
        ...bedroom,
        isSelected: i === index
      }))
    );
  };

  const handleSkip = () => {
    router.replace("/home");
  };

  const handleNext = () => {
    router.replace("/home");
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
          How many bedrooms are you looking for?
        </Text>

        {/* Description */}
        <Text className="text-text text-lg font-inter">
          Select the number of bedrooms you prefer so we can filter properties
          that fit your needs.
        </Text>
      </View>

      {/* Bedroom Radio Buttons */}
      <View className="flex-row flex-wrap justify-between">
        {
          selectedBedroomCount.map((bedroom, index) => (
            <BedroomRadioButton
              key={index}
              bedRoomLabel={bedroom.bedRoomLabel}
              selected={bedroom.isSelected}
              onPress={() => toggleBedroomByIndex(index)}
            />
          ))
        }
      </View>

      {/* Spacer */}
      <View className="flex-1" />

      {/* Next Button*/}
      <PillButton
        label={"Let's find your place!"}
        onPress={handleNext}
        isFullWidth
      />
    </ScreenWrapper>
  );
}
