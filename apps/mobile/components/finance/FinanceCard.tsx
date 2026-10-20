import type { ReactNode } from "react";
import { View } from "react-native";

interface FinanceCardProps {
  children: ReactNode;
  className?: string;
  testID?: string;
}

export default function FinanceCard({
  children,
  className,
  testID,
}: FinanceCardProps) {
  return (
    <View
      testID={testID}
      className={`bg-surface border border-border rounded-3xl p-4 gap-4${className ? ` ${className}` : ""}`}
    >
      {children}
    </View>
  );
}
