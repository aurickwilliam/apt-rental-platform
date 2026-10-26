import { Text, View } from "react-native";

import { useTranslation } from "@/hooks/i18n";

type StepProgressProps = {
  currentStep: number;
  totalSteps?: number;
  stepName?: string;
};

export default function StepProgress({
  currentStep,
  totalSteps = 5,
  stepName,
}: StepProgressProps) {
  const { t } = useTranslation();

  return (
    <View className="flex gap-2 mb-6">
      {/* Step counter */}
      <Text className="text-foreground text-sm font-nunitoSemiBold">
        {t("authMobile.verify.stepProgress", {
          current: String(currentStep),
          total: String(totalSteps),
        })}
        {stepName ? ` — ${stepName}` : ""}
      </Text>

      {/* Segmented bar */}
      <View className="flex-row gap-1.5">
        {Array.from({ length: totalSteps }, (_, i) => {
          const isCompleted = i + 1 < currentStep;
          const isActive = i + 1 === currentStep;

          return (
            <View
              key={i}
              className={`flex-1 h-1.5 rounded-full ${
                isCompleted || isActive ? "bg-primary" : "bg-gray-200"
              }`}
            />
          );
        })}
      </View>
    </View>
  );
}
