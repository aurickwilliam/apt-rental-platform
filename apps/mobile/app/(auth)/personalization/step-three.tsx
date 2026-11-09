import { Text, View } from "react-native";
import { useRouter } from "expo-router";

import ScreenWrapper from "components/layout/ScreenWrapper";
import PersonalizationRadioButton from "./components/PersonalizationRadioButton";
import PersonalizationProgress from "./components/PersonalizationProgress";

import { Button } from "heroui-native";

import { usePersonalizationStore } from "@/stores/usePersonalizationStore";
import { useTranslation } from "@/hooks/i18n";

export default function StepThree() {
  const router = useRouter();
  const { t } = useTranslation();

  const { bedroomCount, setBedroomCount } = usePersonalizationStore();

  const bedroomOptions = ["1-2 Bedrooms", "2-4 Bedrooms", "4+ Bedrooms"];

  const handleNext = () => {
    router.replace("/personalization/step-four");
  };

  return (
    <ScreenWrapper className="p-5">
      <View className="flex-1 justify-between">
        <View>
          <PersonalizationProgress currentStep={3} />

          {/* Question and Description */}
          <View className="flex gap-3 mb-5">
            <Text className="text-accent text-2xl font-nunitoMedium">
              {t("authMobile.personalization.bedroomsQuestion")}
            </Text>

            <Text className="text-foreground text-base font-inter">
              {t("authMobile.personalization.bedroomsBody")}
            </Text>
          </View>

          {/* Bedroom Radio Buttons */}
          <View className="flex-row flex-wrap justify-between gap-y-1">
            {bedroomOptions.map((option) => (
              <PersonalizationRadioButton
                key={option}
                label={option}
                selected={bedroomCount === option}
                onPress={() => setBedroomCount(bedroomCount === option ? null : option)}
              />
            ))}
          </View>
        </View>

        <View className="flex-row gap-3">
          <Button variant="secondary" className="flex-1" onPress={() => router.replace("/personalization/step-two")}>
            <Button.Label>{t("common.back")}</Button.Label>
          </Button>
          <Button className="flex-1" onPress={handleNext}>
            <Button.Label>{t("common.next")}</Button.Label>
          </Button>
        </View>
      </View>
    </ScreenWrapper>
  );
}
