import { useState } from "react";
import { Text, View } from "react-native";
import { Button } from "heroui-native";
import { BarChart } from "react-native-gifted-charts";
import { IconChartBar } from "@tabler/icons-react-native";
import {
  financeIncome,
  financeMonthLabel,
  type FinanceMonth,
} from "@repo/utils";
import { useColors } from "@/hooks/useTheme";
import EmptyState from "@/components/display/EmptyState";
import {
  FinanceCard,
  FinanceHeading,
  FinanceTabs,
  MoneyRow,
} from "./FinanceControls";

interface IncomeTrendChartProps {
  months: FinanceMonth[];
  onViewExpenses: (month: string) => void;
}

export default function IncomeTrendChart({
  months,
  onViewExpenses,
}: IncomeTrendChartProps) {
  const { colors } = useColors();
  const [range, setRange] = useState("6");
  const [series, setSeries] = useState({
    collected: true,
    expenses: true,
    net: false,
  });
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [width, setWidth] = useState(0);
  const points = months.slice(-Number(range));
  const selected =
    points.find((point) => point.month === selectedMonth) ?? points.at(-1);
  const allReviewed =
    points.length > 0 && points.every((point) => point.reviewed);
  const bars = points.flatMap((point) => {
    const label = new Date(`${point.month}-01T12:00:00Z`).toLocaleDateString(
      "en-PH",
      { month: "short", timeZone: "Asia/Manila" },
    );
    const data = [];
    if (series.collected)
      data.push({
        value: point.collected,
        label,
        frontColor: colors.primary,
        onPress: () => setSelectedMonth(point.month),
      });
    if (series.expenses)
      data.push({
        value: point.operating + point.capital,
        label: series.collected ? "" : label,
        frontColor: colors.dangerMid,
        onPress: () => setSelectedMonth(point.month),
      });
    return data;
  });
  const toggle = (key: "collected" | "expenses" | "net") => {
    if (key === "net") {
      setSeries({ ...series, net: !series.net });
      return;
    }
    if (series[key] && !series[key === "collected" ? "expenses" : "collected"])
      return;
    setSeries({ ...series, [key]: !series[key] });
  };
  const hasActivity = points.some(
    (point) => point.collected > 0 || point.operating + point.capital > 0,
  );
  // Gifted Charts doesn't include the overlaid line in its automatic scale.
  // Include losses as well, or hiding expenses could create thousands of ticks.
  const scale = Math.max(
    1,
    ...bars.map((bar) => bar.value),
    ...(series.net && allReviewed
      ? points.map((point) => Math.abs(financeIncome(point) ?? 0))
      : []),
  );
  return (
    <FinanceCard>
      <FinanceHeading
        title="Income trends"
        description={
          hasActivity
            ? "Collected rent and recorded spending. Tap a bar to inspect a month."
            : "Collected rent and recorded spending."
        }
      />
      <FinanceTabs
        value={range}
        onChange={setRange}
        options={["3", "6", "12"].map((value) => ({
          value,
          label: `${value}M`,
        }))}
      />
      {!hasActivity ? (
        <EmptyState
          icon={<IconChartBar size={32} color={colors.textSecondary} />}
          title="No income activity yet"
          description="Collected rent and recorded expenses will appear here."
        />
      ) : (
        <>
          <View className="flex-row flex-wrap gap-2">
            {(
              [
                ["collected", "● Collected", colors.primary],
                ["expenses", "◆ Expenses", colors.dangerMid],
                ["net", "— Net income", colors.textPrimary],
              ] as const
            ).map(([key, label, color]) => (
              <Button
                key={key}
                size="sm"
                variant={series[key] ? "secondary" : "ghost"}
                accessibilityLabel={`Toggle ${key}`}
                accessibilityState={{ selected: series[key] }}
                isDisabled={key === "net" && !allReviewed}
                onPress={() => toggle(key)}
              >
                <Button.Label style={{ color }}>{label}</Button.Label>
              </Button>
            ))}
          </View>
          <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
            {width > 0 && (
              <BarChart
                key={`${range}-${width}-${series.collected}-${series.expenses}-${series.net && allReviewed}`}
                data={bars}
                width={Math.max(160, width - 48)}
                height={160}
                barWidth={16}
                initialSpacing={12}
                spacing={8}
                maxValue={Math.max(100, Math.ceil(scale / 100) * 100)}
                barBorderTopLeftRadius={4}
                barBorderTopRightRadius={4}
                noOfSections={4}
                yAxisThickness={0}
                xAxisThickness={1}
                xAxisColor={colors.border}
                rulesColor={colors.border}
                yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
                xAxisLabelTextStyle={{
                  color: colors.textSecondary,
                  fontSize: 11,
                  fontFamily: "Nunito-SemiBold",
                }}
                formatYLabel={(value) =>
                  `${Number(value) < 0 ? "−" : ""}₱${Math.abs(Number(value)) >= 1000 ? `${Math.round(Math.abs(Number(value)) / 1000)}k` : Math.abs(Number(value))}`
                }
                showLine={series.net && allReviewed}
                lineData={points.flatMap((point) => {
                  const entry = { value: financeIncome(point) ?? 0 };
                  return series.collected && series.expenses
                    ? [entry, entry]
                    : [entry];
                })}
                lineConfig={{
                  color: colors.textPrimary,
                  thickness: 2,
                  hideDataPoints: false,
                  dataPointsColor: colors.textPrimary,
                }}
                mostNegativeValue={
                  series.net && allReviewed
                    ? Math.min(
                        0,
                        ...points.map((point) => financeIncome(point) ?? 0),
                      )
                    : 0
                }
              />
            )}
          </View>
          {!allReviewed && (
            <Text className="font-inter text-xs text-muted">
              Review each month’s expenses to enable the net income line. Missing
              records aren’t assumed to be zero.
            </Text>
          )}
          {selected && (
            <View
              className="bg-surface-secondary rounded-2xl p-3 gap-2"
              accessibilityLiveRegion="polite"
            >
              <Text className="font-nunitoBold text-sm text-foreground">
                {financeMonthLabel(selected.month)}
              </Text>
              <MoneyRow label="Collected rent" amount={selected.collected} />
              <MoneyRow
                label="Recorded expenses (including improvements)"
                amount={selected.operating + selected.capital}
              />
              <MoneyRow
                label="Net operating income"
                amount={financeIncome(selected)}
                emphasized
              />
              <Button
                size="sm"
                variant="tertiary"
                onPress={() => onViewExpenses(selected.month)}
              >
                <Button.Label>View expenses for this month</Button.Label>
              </Button>
            </View>
          )}
        </>
      )}
    </FinanceCard>
  );
}
