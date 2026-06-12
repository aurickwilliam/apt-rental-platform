import { Text, View } from "react-native";
import { useRouter } from 'expo-router';
import { useState } from "react";

import ScreenWrapper from "components/layout/ScreenWrapper";
import PersonalizationRadioButton from "components/buttons/PersonalizationRadioButton";

import { Button } from "heroui-native";

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

  const handleNext = () => {
    router.replace("/personalization/step-four");
  };

  return (
    <ScreenWrapper className="p-5">
      <View className="flex-1 justify-between">
        <View>
          {/* Question and Description */}
          <View className="flex gap-3 mb-5">
            {/* Question */}
            <Text className="text-secondary text-2xl font-nunitoMedium">
              How many bedrooms are you looking for?
            </Text>

            {/* Description */}
            <Text className="text-foreground text-base font-inter">
              Select the number of bedrooms you prefer so we can filter properties
              that fit your needs.
            </Text>
          </View>

          {/* Bedroom Radio Buttons */}
          <View className="flex-row flex-wrap justify-between gap-y-1">
            {
              selectedBedroomCount.map((bedroom, index) => (
                <PersonalizationRadioButton
                  key={index}
                  label={bedroom.bedRoomLabel}
                  selected={bedroom.isSelected}
                  onPress={() => toggleBedroomByIndex(index)}
                />
              ))
            }
          </View>
        </View>

        {/* Next Button*/}
        <Button onPress={handleNext}>
          <Button.Label>
            Next
          </Button.Label>
        </Button>
      </View>
    </ScreenWrapper>
  );
}
