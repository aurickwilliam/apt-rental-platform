import { Text, View } from "react-native";
import { useRouter } from "expo-router";

import { CAMANAVA_CITIES } from "@repo/constants";

import ScreenWrapper from "components/layout/ScreenWrapper";
import CityCheckBox from "./components/CityCheckBox";
import PersonalizationProgress from "./components/PersonalizationProgress";

import { Button } from "heroui-native";

import { usePersonalizationStore } from "@/stores/usePersonalizationStore";
import { useTranslation } from "@/hooks/i18n";

export default function StepOne() {
  const router = useRouter();
  const { t } = useTranslation();

  const { selectedCities, toggleCity } = usePersonalizationStore();

  const cities = [...CAMANAVA_CITIES];

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
            <Text className="text-accent text-2xl font-nunitoMedium">
              {t("authMobile.personalization.cityQuestion")}
            </Text>

            <Text className="text-foreground text-base font-inter">
              {t("authMobile.personalization.cityBody")}
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
            {selectedCities.length > 0 ? t("common.next") : t("common.skip")}
          </Button.Label>
        </Button>
      </View>
    </ScreenWrapper>
  );
}