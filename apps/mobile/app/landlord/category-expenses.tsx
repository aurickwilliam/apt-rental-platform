import { FlatList, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button } from "heroui-native";
import { IconReceipt2 } from "@tabler/icons-react-native";
import {
  FINANCE_CATEGORIES,
  financeCategoryLabel,
  financeMonthFromParam,
  financeMonthLabel,
  manilaToday,
} from "@repo/utils";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import EmptyState from "@/components/display/EmptyState";
import {
  PullToRefreshControl,
  PullToRefreshIndicator,
} from "@/components/display/PullToRefresh";
import CategoryTotalCard from "@/components/finance/CategoryTotalCard";
import ExpenseRowsSkeleton from "@/components/finance/ExpenseRowsSkeleton";
import ExpenseTransactionsSkeleton from "@/components/finance/ExpenseTransactionsSkeleton";
import ExpenseTransactionRow from "@/components/finance/ExpenseTransactionRow";
import FinanceError from "@/components/finance/FinanceError";
import { useCurrentUser } from "@/hooks/auth";
import { useColors } from "@/hooks/useTheme";
import {
  useFinanceExpenses,
  useLandlordFinances,
} from "@/hooks/finance/useLandlordFinances";
import { financeErrorMessage } from "@/service/finance/financeService";

function CategoryExpenses() {
  const params = useLocalSearchParams<{
    month?: string;
    apartmentId?: string;
    category?: string;
  }>();
  const router = useRouter();
  const { colors } = useColors();
  const month = financeMonthFromParam(params.month, manilaToday().slice(0, 7));
  const apartmentId =
    typeof params.apartmentId === "string" ? params.apartmentId : null;
  const category =
    FINANCE_CATEGORIES.find((item) => item.id === params.category)?.id ?? null;
  const scope = { month, apartmentId };
  const finance = useLandlordFinances(scope);
  const expenses = useFinanceExpenses(finance.ownerId, scope, category, true);
  const data = finance.report.data;
  const selectedProperty = data?.properties.find(
    (property) => property.id === apartmentId,
  );
  const rows = expenses.data?.pages.flatMap((page) => page.rows) ?? [];
  // Totals come from the report's category rows, never from paged transactions.
  const categoryRow = category
    ? data?.categories.find((row) => row.category === category)
    : undefined;
  const spendingTotal =
    data?.categories.reduce((sum, row) => sum + (row.amount ?? 0), 0) ?? 0;
  const title = category
    ? financeCategoryLabel(category)
    : "Expense transactions";
  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/landlord/analytics");
  };
  if (finance.userLoading || finance.report.isLoading)
    return (
      <ScreenWrapper
        header={<StandardHeader title={title} onBackPress={close} />}
        scrollable
        className="p-5"
      >
        <ExpenseTransactionsSkeleton />
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
              ? "Switch to your landlord portal to view these expenses."
              : financeErrorMessage(finance.report.error ?? finance.userError)
          }
          onRetry={() => {
            void finance.retry();
          }}
        />
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
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <PullToRefreshControl
              refreshing={expenses.isRefetching}
              onRefresh={() => {
                void expenses.refetch();
              }}
            />
          }
          ListHeaderComponent={
            <View className="gap-1">
              <PullToRefreshIndicator refreshing={expenses.isRefetching} />
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
                accessibilityLabel={`Report month: ${financeMonthLabel(month)}`}
                className="font-inter text-sm text-muted"
              >
                {financeMonthLabel(month)}
              </Text>
              {category ? (
                <View className="mt-3">
                  <CategoryTotalCard
                    category={category}
                    amount={categoryRow?.amount ?? 0}
                    total={spendingTotal}
                    previousAmount={categoryRow?.previous_amount ?? 0}
                  />
                </View>
              ) : null}
            </View>
          }
          renderItem={({ item }) => (
            <ExpenseTransactionRow
              expense={item}
              propertyName={
                data.properties.find(
                  (property) => property.id === item.apartment_id,
                )?.name
              }
              onPress={() =>
                router.push({
                  pathname: "/landlord/edit-expense",
                  params: { id: item.id, month, ...(apartmentId ? { apartmentId } : {}) },
                })
              }
            />
          )}
          ListEmptyComponent={
            !expenses.isLoading && !expenses.error ? (
              <EmptyState
                icon={<IconReceipt2 size={32} color={colors.gray500} />}
                title={
                  category
                    ? "No expenses in this category"
                    : "No expenses recorded"
                }
                description={`Nothing recorded in ${financeMonthLabel(month)}${
                  selectedProperty ? ` for ${selectedProperty.name}` : ""
                }.`}
              />
            ) : null
          }
          ListFooterComponent={
            <View className="gap-4">
              {expenses.isLoading && <ExpenseRowsSkeleton />}
              {expenses.error && (
                <FinanceError
                  onRetry={() => {
                    void expenses.refetch();
                  }}
                />
              )}
              {expenses.hasNextPage && (
                <Button
                  variant="secondary"
                  isDisabled={expenses.isFetchingNextPage}
                  onPress={() => {
                    void expenses.fetchNextPage();
                  }}
                >
                  <Button.Label>
                    {expenses.isFetchingNextPage
                      ? "Loading…"
                      : "Load more expenses"}
                  </Button.Label>
                </Button>
              )}
            </View>
          }
        />
      </ScreenWrapper>
    </View>
  );
}

export default function CategoryExpensesScreen() {
  const user = useCurrentUser();
  // Account switches discard financial filters, open forms and sensitive drafts.
  return <CategoryExpenses key={user.data?.id ?? "signed-out"} />;
}
