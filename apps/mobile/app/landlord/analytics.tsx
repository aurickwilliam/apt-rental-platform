import { useRef, useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, LinkButton, Spinner, useToast } from "heroui-native";
import {
  IconChartBar,
  IconFilter2,
  IconLock,
  IconPlus,
  IconTargetArrow,
} from "@tabler/icons-react-native";
import {
  financeCategoryLabel,
  financeMonthFromParam,
  financeMonthLabel,
  formatPesoDisplay,
  manilaToday,
  type BudgetKind,
  type FinanceBudget,
  type FinanceCategory,
} from "@repo/utils";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import ConfirmDialog from "@/components/display/ConfirmDialog";
import EmptyState from "@/components/display/EmptyState";
import EmptyProperties from "@/app/(tabs)/components/units/EmptyProperties";
import FinanceSkeleton from "@/components/finance/FinanceSkeleton";
import { useCurrentUser } from "@/hooks/auth";
import { useColors } from "@/hooks/useTheme";
import {
  useFinanceExpenses,
  useFinanceIncomeMonths,
  useLandlordFinances,
} from "@/hooks/finance/useLandlordFinances";
import {
  financeErrorMessage,
  type CollectionStatus,
  type ExpenseRecord,
  type FinanceScope,
} from "@/service/finance/financeService";
import {
  FinanceCard,
  FinanceError,
  FinanceHeading,
  FinanceTabs,
  MoneyRow,
} from "@/components/finance/FinanceControls";
import IncomeTrendChart from "@/components/finance/IncomeTrendChart";
import EarningsSummaryCard from "@/components/finance/EarningsSummaryCard";
import ExpenseCategoryChart from "@/components/finance/ExpenseCategoryChart";
import CollectionHealthChart from "@/components/finance/CollectionHealthChart";
import PropertyPerformanceChart from "@/components/finance/PropertyPerformanceChart";
import BudgetProgressChart from "@/components/finance/BudgetProgressChart";
import CollectionLedgerSheet from "@/components/finance/CollectionLedgerSheet";
import FinanceFilterSheet from "@/components/finance/FinanceFilterSheet";
import FinanceGuidelinesDialog from "@/components/finance/FinanceGuidelinesDialog";
import {
  BudgetEntrySheet,
  ExpenseEntrySheet,
} from "@/components/finance/FinanceEntrySheet";

type FinanceTab = "overview" | "expenses" | "budget";
type BudgetEditor = {
  initial?: FinanceBudget;
  category?: FinanceCategory;
  kind?: BudgetKind;
};

function LandlordAnalytics() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    month?: string;
    apartmentId?: string;
  }>();
  const { colors } = useColors();
  const { toast } = useToast();
  const listRef = useRef<FlatList<ExpenseRecord>>(null);
  const today = manilaToday();
  const [month, setMonth] = useState(today.slice(0, 7));
  const [apartmentId, setApartmentId] = useState<string | null>(null);
  const routeApartmentId =
    typeof params.apartmentId === "string" ? params.apartmentId : null;
  const routeMonth = financeMonthFromParam(params.month, today.slice(0, 7));
  const [appliedRouteApartmentId, setAppliedRouteApartmentId] =
    useState<string | null>(null);
  const [filterDraft, setFilterDraft] = useState<FinanceScope | null>(null);
  const [tab, setTab] = useState<FinanceTab>("overview");
  const [category, setCategory] = useState<FinanceCategory | null>(null);
  const [expenseEditor, setExpenseEditor] = useState<{
    initial?: ExpenseRecord;
  } | null>(null);
  const [budgetEditor, setBudgetEditor] = useState<BudgetEditor | null>(null);
  const [collectionStatus, setCollectionStatus] =
    useState<CollectionStatus | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);
  const scope = { month, apartmentId };
  const filterValues = filterDraft ?? scope;
  const finance = useLandlordFinances(scope);
  const incomeMonths = useFinanceIncomeMonths(
    today.slice(0, 7),
    filterValues.apartmentId,
    filterDraft !== null,
  );
  const expenses = useFinanceExpenses(
    finance.ownerId,
    scope,
    category,
    tab === "expenses",
  );
  const data = finance.report.data;
  if (
    data &&
    routeApartmentId !== null &&
    routeApartmentId !== appliedRouteApartmentId
  ) {
    setAppliedRouteApartmentId(routeApartmentId);
    setMonth(routeMonth);
    setApartmentId(
      data.properties.some((property) => property.id === routeApartmentId)
        ? routeApartmentId
        : null,
    );
  }
  const selectedProperty = data?.properties.find(
    (property) => property.id === apartmentId,
  );
  const active = data?.months.at(-1);
  const reserve =
    data?.budgets
      .filter((budget) => budget.kind === "reserve")
      .reduce((sum, budget) => sum + budget.amount, 0) ?? 0;
  const activeFilterCount =
    Number(apartmentId !== null) + Number(month !== today.slice(0, 7));
  const expenseRows =
    tab === "expenses"
      ? (expenses.data?.pages.flatMap((page) => page.rows) ?? [])
      : [];
  const changeTab = (value: string) => {
    setTab(value as FinanceTab);
    setReviewDialogOpen(false);
    setReviewError(null);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  };
  const changeMonth = (value: string) => {
    setMonth(value);
    setReviewDialogOpen(false);
    setReviewError(null);
  };
  const changeProperty = (value: string | null) => {
    setApartmentId(value);
    setReviewDialogOpen(false);
    setReviewError(null);
  };
  const reviewExpenses = async () => {
    if (finance.review.isPending) return;
    setReviewError(null);
    try {
      await finance.review.mutateAsync();
      setReviewDialogOpen(false);
      toast.show({
        label: "Expenses reviewed",
        description: "Operating income is now available for this month.",
        variant: "success",
      });
    } catch (error) {
      console.error("Finance expense review failed");
      setReviewError(financeErrorMessage(error));
    }
  };
  const loadingReport =
    finance.userLoading || (!data && finance.report.isLoading);
  const accessUnavailable = !finance.enabled && !finance.userError;
  const expenseFab = (
    <View
      pointerEvents="box-none"
      className="absolute right-5"
      style={{ bottom: insets.bottom + 16 }}
    >
      <Button
        accessibilityLabel="Add expense"
        className="h-14 px-5 rounded-full shadow-lg active:opacity-80"
        isDisabled={loadingReport}
        onPress={() =>
          router.push({
            pathname: "/landlord/add-expense",
            params: { month, ...(apartmentId ? { apartmentId } : {}) },
          })
        }
      >
        <IconPlus size={20} color="#FFFFFF" />
        <Button.Label>Add expense</Button.Label>
      </Button>
    </View>
  );
  if (loadingReport)
    return (
      <View className="flex-1">
        <ScreenWrapper
          header={
            <StandardHeader
              title="Profit & planning"
              rightComponent={
                <Button
                  variant="ghost"
                  isIconOnly
                  isDisabled
                  accessibilityLabel="Filters"
                >
                  <IconFilter2 size={22} color="#FFFFFF" />
                </Button>
              }
            />
          }
          scrollable
          bottomPadding={104}
          className="p-5 gap-5"
        >
          <FinanceSkeleton tab={tab} />
        </ScreenWrapper>
        {expenseFab}
      </View>
    );
  if (
    finance.userError ||
    !finance.enabled ||
    finance.report.error ||
    !data ||
    !active
  )
    return (
      <ScreenWrapper
        header={<StandardHeader title="Profit & planning" />}
        scrollable
        className="p-5"
      >
        <EmptyState
          className="py-16"
          icon={
            accessUnavailable ? (
              <IconLock size={48} color={colors.gray500} />
            ) : (
              <IconChartBar size={48} color={colors.gray500} />
            )
          }
          title={
            accessUnavailable
              ? "Finances unavailable"
              : "Couldn't load your finances"
          }
          description={
            accessUnavailable
              ? "Switch to your landlord portal to view and manage finances for your properties."
              : financeErrorMessage(finance.report.error ?? finance.userError)
          }
          action={
            !accessUnavailable ? (
              <Button
                variant="secondary"
                onPress={() => {
                  void finance.retry();
                }}
              >
                <Button.Label>Try again</Button.Label>
              </Button>
            ) : undefined
          }
        />
      </ScreenWrapper>
    );
  if (data.properties.length === 0)
    return (
      <ScreenWrapper
        header={<StandardHeader title="Profit & planning" />}
        scrollable
      >
        <EmptyProperties
          onAdd={() => router.push("/landlord/manage-apartment/add-apartment/")}
        />
      </ScreenWrapper>
    );

  return (
    <View className="flex-1">
      <ScreenWrapper
        header={
          <StandardHeader
            title="Profit & planning"
            rightComponent={
              <View className="relative">
                <Button
                  variant="ghost"
                  isIconOnly
                  accessibilityLabel={`Filters, ${data.properties.find((property) => property.id === apartmentId)?.name ?? "All properties"}, ${financeMonthLabel(month)}`}
                  accessibilityState={{ expanded: filterDraft !== null }}
                  onPress={() => setFilterDraft(scope)}
                >
                  <IconFilter2 size={22} color="#FFFFFF" />
                </Button>
                {activeFilterCount > 0 && (
                  <View
                    pointerEvents="none"
                    accessible={false}
                    className="absolute -top-0.5 -right-0.5 min-w-4 h-4 rounded-full bg-white items-center justify-center"
                  >
                    <Text className="text-accent text-[10px] font-nunitoSemiBold">
                      {activeFilterCount}
                    </Text>
                  </View>
                )}
              </View>
            }
          />
        }
        dismissKeyboardOnTouch={false}
      >
        <FlatList
          ref={listRef}
          data={expenseRows}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 104 }}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              tintColor={colors.primary}
              refreshing={finance.report.isRefetching}
              onRefresh={() => {
                void finance.report.refetch();
                if (tab === "expenses") void expenses.refetch();
              }}
            />
          }
          ListHeaderComponent={
            <View className="gap-5">
              <View className="gap-1">
                {selectedProperty ? (
                  <>
                    <Text className="font-inter text-xs text-muted">
                      Filtered property
                    </Text>
                    <Text
                      accessibilityRole="header"
                      accessibilityLabel={`Filtered property: ${selectedProperty.name}`}
                      className="font-nunitoBold text-lg text-foreground"
                    >
                      {selectedProperty.name}
                    </Text>
                  </>
                ) : (
                  <Text
                    accessibilityRole="header"
                    accessibilityLabel="All properties"
                    className="font-nunitoBold text-lg text-foreground"
                  >
                    All properties
                  </Text>
                )}
                <Text
                  accessibilityLabel={`Report month: ${financeMonthLabel(month)}`}
                  className="font-inter text-sm text-muted"
                >
                  {financeMonthLabel(month)}
                </Text>
              </View>
              <EarningsSummaryCard
                data={data}
                month={month}
                onReview={() => changeTab("expenses")}
              />
              <FinanceTabs
                value={tab}
                onChange={changeTab}
                options={[
                  { value: "overview", label: "Overview" },
                  { value: "expenses", label: "Expenses" },
                  { value: "budget", label: "Budget" },
                ]}
              />
              {tab === "overview" && (
                <>
                  <FinanceCard className="bg-primary border-primary">
                    <FinanceHeading
                      title="Needs attention"
                      titleClassName="text-white"
                    />
                    {data.collections.overdue > 0 ? (
                      <Button
                        variant="outline"
                        onPress={() => setCollectionStatus("overdue")}
                        className="h-auto min-h-12 py-2 bg-white border-white"
                      >
                        <Button.Label
                          className="text-primary"
                          numberOfLines={2}
                        >
                          {formatPesoDisplay(data.collections.overdue)} overdue
                          · {data.collections.overdueCount} tenancies ›
                        </Button.Label>
                      </Button>
                    ) : (
                      <Text className="font-inter text-sm text-white">
                        No overdue balances for this rental month.
                      </Text>
                    )}
                    {!active.reviewed && (
                      <Button
                        variant="outline"
                        onPress={() => changeTab("expenses")}
                        className="bg-white border-white"
                      >
                        <Button.Label className="text-primary">
                          Review expenses to see income
                        </Button.Label>
                      </Button>
                    )}
                    {data.budgets.some(
                      (budget) =>
                        budget.kind === "expense" &&
                        budget.spent > budget.amount,
                    ) && (
                      <Button
                        variant="outline"
                        onPress={() => changeTab("budget")}
                        className="bg-white border-white"
                      >
                        <Button.Label className="text-primary">
                          Review budgets over their limits
                        </Button.Label>
                      </Button>
                    )}
                    {reserve === 0 && (
                      <Button
                        variant="outline"
                        className="bg-white border-white"
                        onPress={() => {
                          changeTab("budget");
                          setBudgetEditor({
                            category: "emergency",
                            kind: "reserve",
                          });
                        }}
                      >
                        <Button.Label className="text-primary">
                          Plan an emergency reserve
                        </Button.Label>
                      </Button>
                    )}
                  </FinanceCard>
                  <IncomeTrendChart
                    months={data.months}
                    onViewExpenses={(value) => {
                      changeMonth(value);
                      setCategory(null);
                      changeTab("expenses");
                    }}
                  />
                  <CollectionHealthChart
                    data={data.collections}
                    onSelect={setCollectionStatus}
                  />
                  <FinanceCard>
                    <FinanceHeading
                      title="Your monthly plan"
                      description="Spending limits and reserve allocations are kept separate."
                    />
                    {data.budgets.length === 0 ? (
                      <EmptyState
                        icon={
                          <IconTargetArrow size={32} color={colors.gray500} />
                        }
                        title="No plan for this month yet"
                        description="Set spending limits and reserve goals for this month to see your plan here."
                      />
                    ) : (
                      <>
                        <MoneyRow
                          label="Planned spending limits"
                          amount={data.budgets
                            .filter((budget) => budget.kind === "expense")
                            .reduce((sum, budget) => sum + budget.amount, 0)}
                        />
                        <MoneyRow
                          label="Planned reserve allocations"
                          amount={reserve}
                        />
                      </>
                    )}
                    <Button
                      variant="secondary"
                      onPress={() => changeTab("budget")}
                    >
                      <Button.Label>View budgets & suggestions</Button.Label>
                    </Button>
                  </FinanceCard>
                  <PropertyPerformanceChart
                    properties={data.performance}
                    onSelect={changeProperty}
                    onViewAll={() =>
                      router.push({
                        pathname: "/landlord/property-performance",
                        params: { month },
                      })
                    }
                  />
                </>
              )}
              {tab === "expenses" && (
                <>
                  <ExpenseCategoryChart
                    categories={data.categories}
                    selected={category}
                    onSelect={setCategory}
                  />
                  <FinanceCard>
                    <FinanceHeading
                      title={
                        active.reviewed
                          ? "Expenses reviewed"
                          : "Review this month"
                      }
                      description={
                        active.reviewed
                          ? "Income uses your reviewed records. Adding, editing or deleting expenses reopens the review."
                          : "Check every expense for the selected properties before confirming. Zero spending is valid only after review."
                      }
                    />
                    {!active.reviewed && (
                      <Button
                        isDisabled={finance.review.isPending}
                        onPress={() => {
                          setReviewError(null);
                          setReviewDialogOpen(true);
                        }}
                      >
                        <Button.Label>Mark expenses reviewed</Button.Label>
                      </Button>
                    )}
                  </FinanceCard>
                  <FinanceHeading
                    title={
                      category
                        ? `${financeCategoryLabel(category)} transactions`
                        : "Expense transactions"
                    }
                    description="Tap a transaction to edit or delete it."
                  />
                </>
              )}
              {tab === "budget" && (
                <BudgetProgressChart
                  budgets={data.budgets}
                  properties={data.properties}
                  onEdit={(initial) => setBudgetEditor({ initial })}
                  onCreate={(value, kind) =>
                    setBudgetEditor({ category: value, kind })
                  }
                />
              )}
            </View>
          }
          renderItem={({ item }) => (
            <View className="bg-surface rounded-2xl border border-border p-3">
              <Button
                variant="ghost"
                className="h-auto min-h-14 py-2"
                onPress={() => setExpenseEditor({ initial: item })}
                accessibilityLabel={`Edit ${item.description}, ${formatPesoDisplay(item.amount)}, paid ${item.spent_on}`}
              >
                <View className="flex-1 gap-1">
                  <View className="flex-row justify-between gap-3">
                    <Text className="font-nunitoSemiBold text-sm text-foreground flex-1">
                      {item.description}
                    </Text>
                    <Text className="font-nunitoBold text-sm text-accent">
                      {formatPesoDisplay(item.amount)}
                    </Text>
                  </View>
                  <Text className="font-inter text-xs text-muted">
                    {item.spent_on} · {financeCategoryLabel(item.category)}
                  </Text>
                  <Text className="font-inter text-xs text-muted">
                    {
                      data.properties.find(
                        (property) => property.id === item.apartment_id,
                      )?.name
                    }{" "}
                    ·{" "}
                    {item.treatment === "capital"
                      ? "Improvement / replacement"
                      : "Operating"}
                  </Text>
                </View>
              </Button>
            </View>
          )}
          ListFooterComponent={
            <View className="gap-4">
              {tab === "expenses" && (
                <>
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
                  {!expenses.isLoading &&
                    !expenses.error &&
                    expenseRows.length === 0 && (
                      <Text className="font-inter text-sm text-muted">
                        {category
                          ? "No expenses in this category."
                          : "No expenses recorded. Add an expense, or review this month if you had none."}
                      </Text>
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
                </>
              )}
              <LinkButton
                className="self-start"
                onPress={() => setGuidelinesOpen(true)}
              >
                <LinkButton.Label className="text-sm font-nunitoSemiBold text-accent underline">
                  Planning guidelines
                </LinkButton.Label>
              </LinkButton>
            </View>
          }
        />
        {/* Every sheet stays mounted while closed: HeroUI snaps one open on a closed → open transition. */}
        <ConfirmDialog
          isOpen={reviewDialogOpen}
          onOpenChange={(open) => {
            setReviewDialogOpen(open);
            if (!open) setReviewError(null);
          }}
          title="Confirm expenses are complete"
          description={`I have entered all expenses paid in ${financeMonthLabel(month)} for ${
            apartmentId
              ? (data.properties.find((property) => property.id === apartmentId)
                  ?.name ?? "this property")
              : "all my properties"
          }, including any zero-expense properties.`}
          confirmLabel={finance.review.isPending ? "Confirming…" : "Confirm"}
          confirmVariant="primary"
          cancelLabel="Keep reviewing"
          isConfirmDisabled={finance.review.isPending}
          errorMessage={reviewError}
          onConfirm={() => {
            void reviewExpenses();
          }}
        />
        <FinanceGuidelinesDialog
          isOpen={guidelinesOpen}
          onOpenChange={setGuidelinesOpen}
        />
        <FinanceFilterSheet
          isOpen={filterDraft !== null}
          value={filterValues}
          currentMonth={today.slice(0, 7)}
          properties={data.properties}
          incomeMonths={incomeMonths.data}
          incomeMonthsLoading={incomeMonths.isFetching}
          incomeMonthsError={incomeMonths.isError}
          onRetryIncomeMonths={() => { void incomeMonths.refetch(); }}
          onChange={setFilterDraft}
          onClose={() => setFilterDraft(null)}
          onApply={() => {
            if (!filterDraft) return;
            changeMonth(filterDraft.month);
            changeProperty(filterDraft.apartmentId);
            setFilterDraft(null);
          }}
        />
        {finance.ownerId && (
          <CollectionLedgerSheet
            ownerId={finance.ownerId}
            isOpen={collectionStatus !== null}
            scope={scope}
            status={collectionStatus}
            onChangeStatus={setCollectionStatus}
            onClose={() => setCollectionStatus(null)}
          />
        )}
        <ExpenseEntrySheet
          isOpen={expenseEditor !== null}
          properties={data.properties}
          apartmentId={apartmentId}
          month={month}
          category={category}
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
        <BudgetEntrySheet
          isOpen={budgetEditor !== null}
          properties={data.properties}
          apartmentId={apartmentId}
          month={month}
          initial={budgetEditor?.initial}
          presetCategory={budgetEditor?.category}
          presetKind={budgetEditor?.kind}
          onClose={() => setBudgetEditor(null)}
          onSave={async (budget) => {
            await finance.budget.mutateAsync(budget);
            toast.show({ label: "Budget saved", variant: "success" });
          }}
          onDelete={async (id) => {
            await finance.removeBudget.mutateAsync(id);
          }}
        />
      </ScreenWrapper>
      {expenseFab}
    </View>
  );
}

export default function AnalyticsScreen() {
  const user = useCurrentUser();
  // Account switches discard financial filters, open forms and sensitive drafts.
  return <LandlordAnalytics key={user.data?.id ?? "signed-out"} />;
}
