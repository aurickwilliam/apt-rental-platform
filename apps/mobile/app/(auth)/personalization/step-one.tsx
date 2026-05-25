import { Text, View } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";

import ScreenWrapper from "components/layout/ScreenWrapper";
import CityCheckBox from "components/inputs/CityCheckBox";

import { Button } from "heroui-native";

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

  return (
    <ScreenWrapper className="p-5">
      <View className="flex-1 justify-between">
        <View>
          {/* Question and Description */}
          <View className="flex gap-3 mb-5">
            {/* Question */}
            <Text className="text-secondary text-2xl font-nunitoMedium">
              Which city or area would you like to explore?
            </Text>

            {/* Description */}
            <Text className="text-text text-base font-inter">
              Enter your target city or neighborhood to narrow down property searches.
            </Text>
          </View>

          {/* Cities Checkbox */}
          <View className="flex-row flex-wrap justify-between gap-y-3">
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
