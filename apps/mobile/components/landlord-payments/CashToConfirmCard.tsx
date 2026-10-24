import { Text, TouchableOpacity, View } from "react-native";
import { IconCash, IconChevronRight } from "@tabler/icons-react-native";

import { formatPesoDisplay } from "@repo/utils";

interface CashToConfirmCardProps {
  count: number;
  amount: number;
  /** Shows the payments waiting for the landlord. */
  onPress: () => void;
}

// A solid brand-blue card, like the web's Needs attention button: it appears only
// when cash is waiting, and a tap lists exactly those payments.
export default function CashToConfirmCard({ count, amount, onPress }: CashToConfirmCardProps) {
  const noun = count === 1 ? "cash payment" : "cash payments";

  return (
    <TouchableOpacity
      className="bg-primary rounded-3xl p-4 flex-row items-center gap-3"
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Needs attention: ${count} ${noun} to confirm, ${formatPesoDisplay(amount)}`}
    >
      <View className="size-11 rounded-full bg-white/20 items-center justify-center">
        <IconCash size={22} color="#FFFFFF" />
      </View>
      <View className="flex-1">
        <Text className="text-white text-base font-nunitoBold">Needs attention</Text>
        <Text className="text-white/85 text-sm font-inter" numberOfLines={1}>
          {count} {noun} to confirm · {formatPesoDisplay(amount)}
        </Text>
      </View>
      <View className="min-w-7 h-7 px-2 rounded-full bg-white items-center justify-center">
        <Text className="text-primary text-sm font-nunitoBold">{count}</Text>
      </View>
      <IconChevronRight size={18} color="#FFFFFF" />
    </TouchableOpacity>
  );
}
