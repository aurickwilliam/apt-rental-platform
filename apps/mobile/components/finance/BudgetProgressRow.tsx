import { Text, View } from "react-native";
import { Button } from "heroui-native";
import { budgetProgress, formatPesoDisplay } from "@repo/utils";
import { useColors } from "@/hooks/useTheme";

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
  caption?: string;
  amount: number;
  spent: number;
  /** What tapping the row does, e.g. "View properties" or "Edit budget". */
  action: string;
  onPress: () => void;
}) {
  const { colors } = useColors();
  const { over, percent, difference, barWidth } = budgetProgress(amount, spent);
  return (
    <Button
      variant="ghost"
      className="h-auto min-h-14 py-2"
      onPress={onPress}
      accessibilityLabel={`${title}${caption ? `, ${caption}` : ""}. Spent ${formatPesoDisplay(spent)} of ${formatPesoDisplay(amount)}. ${percent === null ? "" : `${percent}% used. `}${over ? "Over budget" : "Within budget"}. ${action}`}
    >
      <View className="w-full gap-2">
        <View className="flex-row items-center justify-between gap-2">
          <Text
            className="font-nunitoSemiBold text-base text-foreground flex-1"
            numberOfLines={1}
          >
            {title}
          </Text>
          {caption ? (
            <Text className="font-inter text-xs text-muted">{caption}</Text>
          ) : null}
        </View>
        <View className="flex-row items-center justify-between gap-2">
          <Text className="font-nunitoBold text-sm text-foreground">
            {formatPesoDisplay(spent)} / {formatPesoDisplay(amount)}
          </Text>
          {percent !== null ? (
            <Text
              className={`font-inter text-xs${over ? "" : " text-muted"}`}
              style={over ? { color: colors.danger } : undefined}
            >
              {percent}% used
            </Text>
          ) : null}
        </View>
        <View className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
          <View
            className={`h-full rounded-full${over ? "" : " bg-accent"}`}
            style={{
              width: `${barWidth}%`,
              ...(over ? { backgroundColor: colors.danger } : {}),
            }}
          />
        </View>
        <Text
          className={`font-inter text-xs${over ? "" : " text-muted"}`}
          style={over ? { color: colors.danger } : undefined}
        >
          {formatPesoDisplay(difference)}{" "}
          {over ? "over budget" : "remaining"}
        </Text>
      </View>
    </Button>
  );
}
