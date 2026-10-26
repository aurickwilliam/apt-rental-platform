import { Text, View } from "react-native";
import { useRouter } from "expo-router";

import ScreenWrapper from "components/layout/ScreenWrapper";
import PersonalizationProgress from "./components/PersonalizationProgress";

import { Button, Slider } from "heroui-native";

import { usePersonalizationStore } from "@/stores/usePersonalizationStore";
import { useTranslation } from "@/hooks/i18n";

export default function StepTwo() {
  const router = useRouter();
  const { t } = useTranslation();

  const { budgetMin, budgetMax, setBudgetRange } = usePersonalizationStore();

  const handleNext = () => {
    router.replace("/personalization/step-three");
  };

  return (
    <ScreenWrapper className="p-5">
      <View className="flex-1 justify-between">
        <View className="flex-1">
          <PersonalizationProgress currentStep={2} />

          {/* Question and Description */}
          <View className="flex gap-3">
            <Text className="text-accent text-2xl font-nunitoMedium">
              {t("authMobile.personalization.budgetQuestion")}
            </Text>

            <Text className="text-foreground text-base font-inter">
              {t("authMobile.personalization.budgetBody")}
            </Text>
          </View>

          <View className="flex-1 items-center justify-center gap-10">
            {/* Rent Amount */}
            <Text className="text-primary text-3xl font-nunitoBold">
              ₱ {budgetMin.toLocaleString()} - ₱ {budgetMax.toLocaleString()}
            </Text>

            {/* Budget Range Slider */}
            <Slider
              value={[budgetMin, budgetMax]}
              onChange={(val) => {
                const [min, max] = val as number[];
                setBudgetRange(min, max);
              }}
              minValue={5_000}
              maxValue={100_000}
              step={1_000}
            >
              <Slider.Track>
                {({ state }) => (
                  <>
                    <Slider.Fill />
                    {state.values.map((_, i) => (
                      <Slider.Thumb key={i} index={i} />
                    ))}
                  </>
                )}
              </Slider.Track>
            </Slider>
          </View>
        </View>

        {/* Next Button */}
        <Button onPress={handleNext}>
          <Button.Label>
            {t("common.next")}
          </Button.Label>
        </Button>
      </View>
    </ScreenWrapper>
  );
}