import { Text, View } from "react-native";
import { useRouter } from "expo-router";

import ScreenWrapper from "components/layout/ScreenWrapper";
import PersonalizationRadioButton from "./components/PersonalizationRadioButton";
import PersonalizationProgress from "./components/PersonalizationProgress";

import { Button } from "heroui-native";

import { usePersonalizationStore } from "@/stores/usePersonalizationStore";
import { useTranslation } from "@/hooks/i18n";

export default function StepFour() {
  const router = useRouter();
  const { t } = useTranslation();

  const { householdSize, setHouseholdSize } = usePersonalizationStore();

  const familyOptions = [
    "Single",
    "Family of 2",
    "3 - 4 Persons",
    "5 - 6 Persons",
    "7+ Persons",
  ];

  const handleNext = () => {
    router.replace("/personalization/step-five");
  };

  return (
    <ScreenWrapper className="p-5">
      <View className="flex-1 justify-between">
        <View>
          <PersonalizationProgress currentStep={4} />

          {/* Question and Description */}
          <View className="flex gap-3 mb-5">
            <Text className="text-accent text-2xl font-nunitoMedium">
              {t("authMobile.personalization.familyQuestion")}
            </Text>

            <Text className="text-foreground text-base font-inter">
              {t("authMobile.personalization.familyBody")}
            </Text>
          </View>

          {/* Family Size Radio Buttons */}
          <View className="flex-row flex-wrap justify-between">
            {familyOptions.map((option) => (
              <PersonalizationRadioButton
                key={option}
                label={option}
                selected={householdSize === option}
                onPress={() => setHouseholdSize(householdSize === option ? null : option)}
              />
            ))}
          </View>
        </View>

        <View className="flex-row gap-3">
          <Button variant="secondary" className="flex-1" onPress={() => router.replace("/personalization/step-three")}>
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
