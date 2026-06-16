import { Text, View } from "react-native";

type Props = {
  currentStep: number;
  totalSteps?: number;
};

export default function PersonalizationProgress({
  currentStep,
  totalSteps = 5,
}: Props) {
  return (
    <View className="flex gap-2 mb-6">
      {/* Step counter */}
      <Text className="text-foreground text-sm font-interMedium">
        Step {currentStep} of {totalSteps}
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