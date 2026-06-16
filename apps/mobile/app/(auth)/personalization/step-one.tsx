import { Text, View } from "react-native";
import { useRouter } from "expo-router";

import ScreenWrapper from "components/layout/ScreenWrapper";
import CityCheckBox from "./components/CityCheckBox";
import PersonalizationProgress from "./components/PersonalizationProgress";

import { Button } from "heroui-native";

import { usePersonalizationStore } from "@/stores/usePersonalizationStore";

export default function StepOne() {
  const router = useRouter();

  const { selectedCities, toggleCity } = usePersonalizationStore();

  const cities = [
    "Caloocan",
    "Malabon",
    "Navotas",
    "Valenzuela",
  ];

  const handleNext = () => {
    router.replace("/personalization/step-two");
  };

  return (
    <ScreenWrapper className="p-5">
      <View className="flex-1 justify-between">
        <View>
          <PersonalizationProgress currentStep={1} />

          {/* Question and Description */}
          <View className="flex gap-3 mb-5">
            <Text className="text-secondary text-2xl font-nunitoMedium">
              Which city or area would you like to explore?
            </Text>

            <Text className="text-foreground text-base font-inter">
              Enter your target city or neighborhood to narrow down property searches.
            </Text>
          </View>

          {/* Cities Checkbox */}
          <View className="flex-row flex-wrap justify-between gap-y-3">
            {cities.map((city) => (
              <CityCheckBox
                key={city}
                cityName={city}
                selected={selectedCities.includes(city)}
                onPress={() => toggleCity(city)}
              />
            ))}
          </View>
        </View>

        {/* Next Button */}
        <Button onPress={handleNext}>
          <Button.Label>
            {selectedCities.length > 0 ? "Next" : "Skip"}
          </Button.Label>
        </Button>
      </View>
    </ScreenWrapper>
  );
}