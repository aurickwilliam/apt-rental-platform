import { Text, View, Pressable } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";

import ScreenWrapper from "../../../components/layout/ScreenWrapper";
import PillButton from "../../../components/buttons/PillButton";
import CityCheckBox from "../../../components/inputs/CityCheckBox";

export default function StepOne() {
  const router = useRouter();

  type cityType = {
    cityName: string;
    isSelected: boolean;
  }

  const [selectedCities, setselectedCities] = useState<cityType[]>([
    { cityName: "Caloocan", isSelected: false },
    { cityName: "Malabon", isSelected: false },
    { cityName: "Navotas", isSelected: false },
    { cityName: "Valenzuela", isSelected: false }
  ]);

  const toggleCityByIndex = (index: number) => {
    setselectedCities(prev =>
      prev.map((city, i) =>
        i === index
          ? { ...city, isSelected: !city.isSelected }
          : city
      )
    );
  };

  const handleNext = () => {
    router.replace("/personalization/step-two");
  };

  const handleSkip = () => {
    console.log("Skipping step one");
    router.replace("/personalization/step-two");
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
          Which city or area would you like to explore?
        </Text>

        {/* Description */}
        <Text className="text-text text-lg font-inter">
          Enter your target city or neighborhood to narrow down property searches.
        </Text>
      </View>

      {/* Cities Checkbox */}
      <View className="flex-row flex-wrap justify-between">
        {
          selectedCities.map((city, index) => (
            <CityCheckBox
              key={index}
              cityName={city.cityName}
              selected={city.isSelected}
              onPress={() => toggleCityByIndex(index)}
            />
          ))
        }
      </View>


      {/* Spacer */}
      <View className="flex-1" />

      {/* Next Button*/}
      <PillButton
        label={"Next"}
        onPress={handleNext}
        isFullWidth
      />
    </ScreenWrapper>
  );
}
