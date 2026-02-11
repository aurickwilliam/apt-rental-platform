import { Text, View, TouchableOpacity } from "react-native";
import { useRouter } from 'expo-router';
import { useState } from "react";

import ScreenWrapper from "../../../components/layout/ScreenWrapper";
import PillButton from "../../../components/buttons/PillButton";
import PersonalizationRadioButton from "../../../components/buttons/PersonalizationRadioButton";

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
    router.replace("/personalization/step-four");
  };

  const handleNext = () => {
    router.replace("/personalization/step-four");
  };

  return (
    <ScreenWrapper className="p-5">
      <View className="flex-1 justify-between">
        <View>
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
        <PillButton
          label={"Next"}
          onPress={handleNext}
          isFullWidth
        />
      </View>
    </ScreenWrapper>
  );
}
