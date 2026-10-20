import { FlatList, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button } from "heroui-native";
import { IconTargetArrow } from "@tabler/icons-react-native";
import {
  budgetKindFromParam,
  financeCategoryFromParam,
  financeCategoryLabel,
  financeMonthFromParam,
  financeMonthLabel,
  formatPesoDisplay,
  manilaToday,
  type BudgetKind,
} from "@repo/utils";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import EmptyState from "@/components/display/EmptyState";
import {
  PullToRefreshControl,
  PullToRefreshIndicator,
} from "@/components/display/PullToRefresh";
import { BudgetCategorySkeleton } from "@/components/finance/FinanceSkeleton";
import BudgetProgressRow from "@/components/finance/BudgetProgressRow";
import { FinanceError } from "@/components/finance/FinanceControls";
import { useCurrentUser } from "@/hooks/auth";
import { useColors } from "@/hooks/useTheme";
import { useLandlordFinances } from "@/hooks/finance/useLandlordFinances";
import { financeErrorMessage } from "@/service/finance/financeService";

const KIND_TITLES: Record<BudgetKind, string> = {
  expense: "Spending limits",
  reserve: "Planned reserves",
};

function BudgetCategory() {
  const params = useLocalSearchParams<{
    month?: string;
    apartmentId?: string;
    category?: string;
    kind?: string;
  }>();
  const router = useRouter();
  const { colors } = useColors();
  const month = financeMonthFromParam(params.month, manilaToday().slice(0, 7));
  const apartmentId =
    typeof params.apartmentId === "string" ? params.apartmentId : null;
  const category = financeCategoryFromParam(params.category);
  const kind = budgetKindFromParam(params.kind) ?? "expense";
  const finance = useLandlordFinances({ month, apartmentId });
  const data = finance.report.data;
  const title = category ? financeCategoryLabel(category) : "Budget plan";
  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/landlord/analytics");
  };
  // Editing has its own page, like planning; it reads the row from this report.
  const openBudgetEditor = (id: string) => {
    router.push({
      pathname: "/landlord/edit-budget",
      params: {
        id,
        month,
        ...(apartmentId ? { apartmentId } : {}),
      },
    });
  };
  const propertyName = (id: string) =>
    data?.properties.find((property) => property.id === id)?.name ?? "Property";
  const selectedProperty = data?.properties.find(
    (property) => property.id === apartmentId,
  );
  const rows = (data?.budgets ?? [])
    .filter((budget) => budget.category === category && budget.kind === kind)
    .sort((a, b) =>
      propertyName(a.apartment_id).localeCompare(propertyName(b.apartment_id)),
    );
  const totalAmount = rows.reduce((sum, budget) => sum + budget.amount, 0);
  const totalSpent = rows.reduce((sum, budget) => sum + budget.spent, 0);
  const propertyCount = `${rows.length} ${rows.length === 1 ? "property" : "properties"}`;
  if (finance.userLoading || finance.report.isLoading)
    return (
      <ScreenWrapper
        header={<StandardHeader title={title} onBackPress={close} />}
        scrollable
        className="p-5"
      >
        <BudgetCategorySkeleton />
      </ScreenWrapper>
    );
  if (finance.userError || !finance.enabled || finance.report.error || !data)
    return (
      <ScreenWrapper
        header={<StandardHeader title={title} onBackPress={close} />}
        className="p-5"
      >
        <FinanceError
          message={
            !finance.enabled
              ? "Switch to your landlord portal to view these budgets."
              : financeErrorMessage(finance.report.error ?? finance.userError)
          }
          onRetry={() => {
            void finance.retry();
          }}
        />
      </ScreenWrapper>
    );
  if (!category)
    return (
      <ScreenWrapper
        header={<StandardHeader title={title} onBackPress={close} />}
        className="p-5"
      >
        <EmptyState
          icon={<IconTargetArrow size={32} color={colors.gray500} />}
          title="Budget category not found"
          description="Open the Budget tab and choose a category to see its properties."
        />
        <Button variant="secondary" onPress={close}>
          <Button.Label>Back to budgets</Button.Label>
        </Button>
      </ScreenWrapper>
    );
  return (
    <View className="flex-1">
      <ScreenWrapper
        header={<StandardHeader title={title} onBackPress={close} />}
        dismissKeyboardOnTouch={false}
      >
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}
          contentInsetAdjustmentBehavior="automatic"
          refreshControl={
            <PullToRefreshControl
              refreshing={finance.report.isRefetching}
              onRefresh={() => {
                void finance.report.refetch();
              }}
            />
          }
          ListHeaderComponent={
            <View className="gap-1">
              <PullToRefreshIndicator
                refreshing={finance.report.isRefetching}
              />
              <Text
                accessibilityRole="header"
                accessibilityLabel={
                  selectedProperty
                    ? `Filtered property: ${selectedProperty.name}`
                    : "All properties"
                }
                className="font-nunitoBold text-lg text-foreground"
              >
                {selectedProperty?.name ?? "All properties"}
              </Text>
              <Text
                accessibilityLabel={`${KIND_TITLES[kind]}, report month ${financeMonthLabel(month)}`}
                className="font-inter text-sm text-muted"
              >
                {KIND_TITLES[kind]} · {financeMonthLabel(month)}
              </Text>
              {rows.length > 0 && (
                <Text className="font-inter text-sm text-muted">
                  {kind === "expense"
                    ? `${formatPesoDisplay(totalSpent)} spent of ${formatPesoDisplay(totalAmount)} across ${propertyCount}`
                    : `${formatPesoDisplay(totalAmount)} planned across ${propertyCount}`}
                </Text>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <View
              testID="budget-property-card"
              className="bg-surface border border-border rounded-3xl overflow-hidden"
            >
              {kind === "reserve" ? (
                <Button
                  variant="ghost"
                  className="h-auto min-h-14 rounded-3xl p-4"
                  onPress={() => openBudgetEditor(item.id)}
                  accessibilityLabel={`Reserve for ${propertyName(item.apartment_id)}. ${formatPesoDisplay(item.amount)} per month. ${item.target_amount && item.months_remaining ? `${formatPesoDisplay(item.target_amount)} spread over ${item.months_remaining} ${item.months_remaining === 1 ? "month" : "months"}. ` : ""}Edit budget`}
                >
                  <View className="w-full gap-2">
                    <View
                      testID="reserve-card-header"
                      className="flex-row items-start justify-between gap-3"
                    >
                      <Text className="flex-1 font-nunitoSemiBold text-base text-foreground">
                        {propertyName(item.apartment_id)}
                      </Text>
                      {!item.target_amount ? (
                        <View className="max-w-[45%] items-end gap-1">
                          <Text className="font-inter text-xs text-muted text-right">
                            Monthly allocation
                          </Text>
                          <Text
                            selectable
                            className="font-nunitoSemiBold text-base text-foreground text-right"
                            style={{ fontVariant: ["tabular-nums"] }}
                          >
                            {formatPesoDisplay(item.amount)}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    {item.target_amount ? (
                      <View
                        testID="reserve-card-amounts"
                        className="flex-row items-center justify-between gap-3"
                      >
                        <Text
                          selectable
                          className="flex-1 font-nunitoBold text-xl text-accent"
                          style={{ fontVariant: ["tabular-nums"] }}
                        >
                          {formatPesoDisplay(item.amount)} / month
                        </Text>
                        <View className="max-w-[45%] items-end gap-1">
                          <Text className="font-inter text-xs text-muted text-right">
                            Goal amount
                          </Text>
                          <Text
                            selectable
                            className="font-nunitoSemiBold text-base text-foreground text-right"
                            style={{ fontVariant: ["tabular-nums"] }}
                          >
                            {formatPesoDisplay(item.target_amount)}
                          </Text>
                        </View>
                      </View>
                    ) : null}
                    {item.target_amount && item.months_remaining ? (
                      <View className="bg-surface-secondary rounded-2xl p-3 mt-1">
                        <Text className="font-inter text-sm text-muted">
                          Goal spread across {item.months_remaining}{" "}
                          {item.months_remaining === 1 ? "month" : "months"}.{" "}
                          This is a plan, not money transferred.
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </Button>
              ) : (
                <BudgetProgressRow
                  title={propertyName(item.apartment_id)}
                  amount={item.amount}
                  spent={item.spent}
                  action="Edit budget"
                  onPress={() => openBudgetEditor(item.id)}
                />
              )}
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon={<IconTargetArrow size={32} color={colors.gray500} />}
              title={
                kind === "reserve"
                  ? "No reserve goals in this category"
                  : "No spending limits in this category"
              }
              description={`Nothing planned for ${financeMonthLabel(month)}${
                selectedProperty ? ` for ${selectedProperty.name}` : ""
              }.`}
            />
          }
        />
      </ScreenWrapper>
    </View>
  );
}

export default function BudgetCategoryScreen() {
  const user = useCurrentUser();
  // Account switches discard financial filters, open forms and sensitive drafts.
  return <BudgetCategory key={user.data?.id ?? "signed-out"} />;
}
