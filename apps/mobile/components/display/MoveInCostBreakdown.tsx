import { View, Text } from "react-native";
import { Separator } from "heroui-native";
import { calcMoveInCost, formatPesoDisplay } from "@repo/utils";

type MoveInCostBreakdownProps = {
  monthlyRent: string | number | null | undefined;
  securityDeposit: string | number | null | undefined;
  advanceRent: string | number | null | undefined;
};

function formatOrNone(value: string | number | null | undefined): string {
  if (value == null || value === "") return "None";
  const formatted = formatPesoDisplay(value);
  return formatted || "None";
}

export default function MoveInCostBreakdown({
  monthlyRent,
  securityDeposit,
  advanceRent,
}: MoveInCostBreakdownProps) {
  const total = calcMoveInCost(monthlyRent, securityDeposit, advanceRent);

  return (
    <View className="gap-3">
      <View className="flex-row justify-between items-center">
        <Text className="text-muted font-inter text-base">Monthly Rent</Text>
        <Text className="text-foreground font-nunitoSemiBold text-base">
          {formatOrNone(monthlyRent)}
        </Text>
      </View>

      <View className="flex-row justify-between items-center">
        <Text className="text-muted font-inter text-base">Security Deposit</Text>
        <Text className="text-foreground font-nunitoSemiBold text-base">
          {formatOrNone(securityDeposit)}
        </Text>
      </View>

      <View className="flex-row justify-between items-center">
        <Text className="text-muted font-inter text-base">Advance Rent</Text>
        <Text className="text-foreground font-nunitoSemiBold text-base">
          {formatOrNone(advanceRent)}
        </Text>
      </View>

      <Separator className="my-1" />

      <View className="flex-row justify-between items-center">
        <Text className="text-foreground font-nunitoSemiBold text-lg">
          Total Move-in Cost
        </Text>
        <Text className="text-accent font-nunitoSemiBold text-lg">
          {formatPesoDisplay(total)}
        </Text>
      </View>
    </View>
  );
}
