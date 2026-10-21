import { Text, View } from "react-native";
import { Button, SkeletonGroup } from "heroui-native";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react-native";
import { financeMonthLabel, shiftFinanceMonth } from "@repo/utils";
import { useColors } from "@/hooks/useTheme";
import type { FinanceIncomeMonth } from "@/service/finance/financeService";

const REPORT_MONTH_COUNT = 24;

interface FinanceFilterMonthGridProps {
  year: number;
  onYearChange: (year: number) => void;
  month: string;
  currentMonth: string;
  incomeMonths?: FinanceIncomeMonth[];
  incomeMonthsLoading: boolean;
  incomeMonthsError: boolean;
  onRetryIncomeMonths: () => void;
  onChange: (month: string) => void;
}

export default function FinanceFilterMonthGrid({
  year,
  onYearChange,
  month: selectedMonth,
  currentMonth,
  incomeMonths,
  incomeMonthsLoading,
  incomeMonthsError,
  onRetryIncomeMonths,
  onChange,
}: FinanceFilterMonthGridProps) {
  const { colors } = useColors();
  const oldestMonth = shiftFinanceMonth(
    currentMonth,
    -(REPORT_MONTH_COUNT - 1),
  );
  const collectionsByMonth = new Map(
    (incomeMonthsError ? [] : (incomeMonths ?? [])).map((item) => [
      item.month,
      item.collected,
    ]),
  );
  const indicatorsPending = incomeMonthsLoading && !incomeMonths;
  return (
    <>
      {incomeMonthsError ? (
        <View className="gap-1">
          <Text
            accessibilityRole="alert"
            className="font-inter text-xs text-muted"
          >
            Could not load rent indicators. You can still choose a month.
          </Text>
          <Button
            variant="ghost"
            size="sm"
            className="self-start"
            onPress={onRetryIncomeMonths}
          >
            <Button.Label>Retry rent indicators</Button.Label>
          </Button>
        </View>
      ) : null}
      <View className="flex-row items-center justify-between">
        <Button
          isIconOnly
          variant="ghost"
          accessibilityLabel="Previous year"
          isDisabled={year <= Number(oldestMonth.slice(0, 4))}
          onPress={() => onYearChange(year - 1)}
        >
          <IconChevronLeft size={28} color={colors.textPrimary} />
        </Button>
        <Text
          accessibilityRole="header"
          className="font-nunitoBold text-lg text-foreground"
        >
          {year}
        </Text>
        <Button
          isIconOnly
          variant="ghost"
          accessibilityLabel="Next year"
          isDisabled={year >= Number(currentMonth.slice(0, 4))}
          onPress={() => onYearChange(year + 1)}
        >
          <IconChevronRight size={28} color={colors.textPrimary} />
        </Button>
      </View>
      <SkeletonGroup
        isLoading={indicatorsPending}
        className="flex-row flex-wrap"
      >
        {Array.from({ length: 12 }, (_, index) => {
          const month = `${year}-${String(index + 1).padStart(2, "0")}`;
          const selected = month === selectedMonth;
          const available = month >= oldestMonth && month <= currentMonth;
          const collected = available
            ? collectionsByMonth.get(month)
            : undefined;
          const hasIncome = collected !== undefined && collected > 0;
          const rentStatus = !available
            ? "outside report range"
            : collected === undefined
              ? "rent data unavailable"
              : hasIncome
                ? "rent collected"
                : "no rent collected";
          return (
            <View key={month} className="w-1/3 p-1">
              <Button
                variant={selected ? "primary" : "tertiary"}
                isDisabled={!available}
                accessibilityLabel={`Month: ${financeMonthLabel(month)}, ${rentStatus}`}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => onChange(month)}
              >
                <View className="flex-row items-center">
                  {indicatorsPending && available ? (
                    <SkeletonGroup.Item
                      accessible={false}
                      testID={`rent-indicator-loading-${month}`}
                      className="absolute -left-3.5 h-2 w-2 rounded-full"
                      style={
                        selected
                          ? { backgroundColor: "rgba(255,255,255,0.5)" }
                          : undefined
                      }
                    />
                  ) : hasIncome ? (
                    <View
                      accessible={false}
                      testID={`rent-collected-${month}`}
                      className={`absolute -left-3.5 h-2 w-2 rounded-full ${selected ? "bg-accent-foreground" : "bg-accent"}`}
                    />
                  ) : null}
                  <Button.Label>
                    {financeMonthLabel(month).slice(0, 3)}
                  </Button.Label>
                </View>
              </Button>
            </View>
          );
        })}
      </SkeletonGroup>
      <View className="flex-row items-center gap-2 px-1">
        <View className="h-2 w-2 rounded-full bg-accent" />
        <Text className="font-inter text-xs text-muted">Rent collected</Text>
      </View>
      <Text className="font-inter text-xs text-muted">
        Reports are available for the last {REPORT_MONTH_COUNT} months.
      </Text>
    </>
  );
}
