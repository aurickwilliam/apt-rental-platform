import type { ReactNode } from "react";
import { View } from "react-native";

interface FinanceLoadingStateProps {
  label: string;
  children: ReactNode;
}

/** One busy state per page; decorative placeholders stay out of the accessibility tree. */
export default function FinanceLoadingState({
  label,
  children,
}: FinanceLoadingStateProps) {
  return (
    <View
      accessible
      accessibilityLabel={label}
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {children}
      </View>
    </View>
  );
}
