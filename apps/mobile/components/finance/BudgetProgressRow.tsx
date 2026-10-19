import { Text, View } from "react-native";
import { Button } from "heroui-native";
import { budgetProgress, formatPesoDisplay } from "@repo/utils";

/**
 * One budget-versus-actual row. The Budget tab shows a category's totals and the
 * drill-down shows a single property, so both read the same arithmetic.
 */
export default function BudgetProgressRow({
  title,
  caption,
  amount,
  spent,
  action,
  onPress,
}: {
  title: string;
  caption: string;
  amount: number;
  spent: number;
  /** What tapping the row does, e.g. "View properties" or "Edit budget". */
  action: string;
  onPress: () => void;
}) {
  const { over, percent, difference, barWidth } = budgetProgress(amount, spent);
  return (
    <Button
      variant="ghost"
      className="h-auto min-h-14 py-2"
      onPress={onPress}
      accessibilityLabel={`${title}, ${caption}. Spent ${formatPesoDisplay(spent)} of ${formatPesoDisplay(amount)}. ${over ? "Over budget" : "Within budget"}. ${action}`}
    >
      <View className="w-full gap-2">
        <Text className="font-nunitoSemiBold text-sm text-foreground">
          {title}
        </Text>
        <Text className="font-inter text-xs text-muted">{caption}</Text>
        <Text className="font-nunitoBold text-sm text-foreground">
          {formatPesoDisplay(spent)} / {formatPesoDisplay(amount)}
        </Text>
        <View className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
          <View
            className={`h-full rounded-full ${over ? "bg-danger" : "bg-accent"}`}
            style={{ width: `${barWidth}%` }}
          />
        </View>
        <Text
          className={`font-inter text-xs ${over ? "text-danger" : "text-muted"}`}
        >
          {formatPesoDisplay(difference)}{" "}
          {over
            ? `over budget${percent !== null ? ` · ${percent}% used` : ""}`
            : "remaining"}
        </Text>
      </View>
    </Button>
  );
}
