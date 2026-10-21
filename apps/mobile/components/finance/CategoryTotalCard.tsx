import { Text, View } from "react-native";
import { formatPesoDisplay, type FinanceCategory } from "@repo/utils";
import { FINANCE_CATEGORY_SOLID_COLORS } from "./financeCategoryStyles";

interface CategoryTotalCardProps {
  category: FinanceCategory;
  /** Recorded spending in this category for the applied month and scope. */
  amount: number;
  /** Recorded spending across every category, for the share. */
  total: number;
  previousAmount: number;
}

const SOFT_WHITE = "rgba(255,255,255,0.8)";

/** Solid category-colored summary above the transactions, matching the web. */
export default function CategoryTotalCard({
  category,
  amount,
  total,
  previousAmount,
}: CategoryTotalCardProps) {
  const share = total > 0 ? (amount / total) * 100 : 0;
  return (
    <View
      testID="category-total-card"
      accessibilityRole="summary"
      className="rounded-3xl p-4 gap-1"
      style={{ backgroundColor: FINANCE_CATEGORY_SOLID_COLORS[category] }}
    >
      <Text className="font-inter text-sm" style={{ color: SOFT_WHITE }}>
        Total this month
      </Text>
      <Text className="font-nunitoBold text-3xl text-white">
        {formatPesoDisplay(amount)}
      </Text>
      <Text className="font-inter text-sm" style={{ color: SOFT_WHITE }}>
        {share.toFixed(0)}% of recorded spending
      </Text>
      <View
        accessible={false}
        className="mt-2 h-2 overflow-hidden rounded-full"
        style={{ backgroundColor: "rgba(255,255,255,0.3)" }}
      >
        <View
          className="h-full rounded-full bg-white"
          style={{ width: `${Math.min(100, share)}%` }}
        />
      </View>
      <View className="mt-2 flex-row justify-between gap-3">
        <Text className="font-inter text-sm" style={{ color: SOFT_WHITE }}>
          Previous comparable period
        </Text>
        <Text className="font-nunitoBold text-sm text-white">
          {formatPesoDisplay(previousAmount)}
        </Text>
      </View>
    </View>
  );
}
