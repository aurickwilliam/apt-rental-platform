import { useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, Spinner, useToast } from "heroui-native";
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
import { ExpenseTransactionsSkeleton } from "@/components/finance/FinanceSkeleton";
import ExpenseTransactionRow from "@/components/finance/ExpenseTransactionRow";
import { ExpenseEntrySheet } from "@/components/finance/FinanceEntrySheet";
import { FinanceError } from "@/components/finance/FinanceControls";
import { useCurrentUser } from "@/hooks/auth";
import { useColors } from "@/hooks/useTheme";
import {
  useFinanceExpenses,
  useLandlordFinances,
} from "@/hooks/finance/useLandlordFinances";
import {
  financeErrorMessage,
  type ExpenseRecord,
} from "@/service/finance/financeService";

function CategoryExpenses() {
  const params = useLocalSearchParams<{
    month?: string;
    apartmentId?: string;
    category?: string;
  }>();
  const router = useRouter();
  const { colors } = useColors();
  const { toast } = useToast();
  const month = financeMonthFromParam(params.month, manilaToday().slice(0, 7));
  const apartmentId =
    typeof params.apartmentId === "string" ? params.apartmentId : null;
  const category =
    FINANCE_CATEGORIES.find((item) => item.id === params.category)?.id ?? null;
  const scope = { month, apartmentId };
  const finance = useLandlordFinances(scope);
  const expenses = useFinanceExpenses(finance.ownerId, scope, category, true);
  const [expenseEditor, setExpenseEditor] = useState<{
    initial?: ExpenseRecord;
  } | null>(null);
  const data = finance.report.data;
  const selectedProperty = data?.properties.find(
    (property) => property.id === apartmentId,
  );
  const rows = expenses.data?.pages.flatMap((page) => page.rows) ?? [];
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
              : financeErrorMessage(
                  finance.report.error ?? finance.userError,
                )
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
            <RefreshControl
              tintColor={colors.primary}
              refreshing={expenses.isRefetching}
              onRefresh={() => {
                void expenses.refetch();
              }}
            />
          }
          ListHeaderComponent={
            <View className="gap-1">
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
              onPress={() => setExpenseEditor({ initial: item })}
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
              {expenses.isLoading && (
                <Spinner accessibilityLabel="Loading expenses" />
              )}
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
      <ExpenseEntrySheet
        isOpen={expenseEditor !== null}
        properties={data.properties}
        apartmentId={apartmentId}
        month={month}
        initial={expenseEditor?.initial}
        onClose={() => setExpenseEditor(null)}
        onSave={async (draft, editing) => {
          await finance.expense.mutateAsync({ draft, editing });
          toast.show({ label: "Expense saved", variant: "success" });
        }}
        onDelete={async (id) => {
          await finance.removeExpense.mutateAsync(id);
        }}
      />
    </View>
  );
}

export default function CategoryExpensesScreen() {
  const user = useCurrentUser();
  // Account switches discard financial filters, open forms and sensitive drafts.
  return <CategoryExpenses key={user.data?.id ?? "signed-out"} />;
}
