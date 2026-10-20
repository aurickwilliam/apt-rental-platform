import { Text, View } from "react-native";
import { formatPesoDisplay } from "@repo/utils";

interface MoneyRowProps {
  label: string;
  amount: number | null;
  emphasized?: boolean;
}

export default function MoneyRow({
  label,
  amount,
  emphasized = false,
}: MoneyRowProps) {
  return (
    <View className="flex-row justify-between items-start gap-3">
      <Text className="font-inter text-sm text-muted flex-1">{label}</Text>
      <Text
        selectable
        className={`${emphasized ? "font-nunitoBold text-accent" : "font-nunitoSemiBold text-foreground"} text-sm`}
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {amount === null ? "Not calculated" : formatPesoDisplay(amount)}
      </Text>
    </View>
  );
}
