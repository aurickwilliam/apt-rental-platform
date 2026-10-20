import type { ReactNode } from "react";
import { View } from "react-native";
import { SkeletonGroup } from "heroui-native";
import { FinanceCard } from "./FinanceControls";

interface FinanceSkeletonProps {
  tab: "overview" | "expenses" | "budget";
}

/** White button placeholders on the primary-coloured cards. */
const onPrimary = { backgroundColor: "rgba(255, 255, 255, 0.4)" };

const TAB_INDEX: Record<FinanceSkeletonProps["tab"], number> = {
  overview: 0,
  expenses: 1,
  budget: 2,
};

/**
 * One busy state for a whole page: the decorative bars stay out of the
 * accessibility tree so a screen reader hears a single progressbar.
 */
function LoadingState({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <View
      accessible
      accessibilityLabel={label}
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {children}
      </View>
    </View>
  );
}

/** Property (or "All properties") and month above every finance page. */
function HeadingBlockSkeleton({ testID }: { testID?: string }) {
  return (
    <View testID={testID} className="gap-1">
      <SkeletonGroup.Item className="h-6 w-36 rounded-md" />
      <SkeletonGroup.Item className="h-4 w-28 rounded-md" />
    </View>
  );
}

function MoneyRowSkeleton() {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <SkeletonGroup.Item className="h-4 w-1/2 rounded-md" />
      <SkeletonGroup.Item className="h-4 w-20 rounded-md" />
    </View>
  );
}

/** Segmented control matching `FinanceTabs`, with its selected segment white. */
function TabStripSkeleton({
  activeIndex = 0,
  testID,
}: {
  activeIndex?: number;
  testID?: string;
}) {
  return (
    <View
      testID={testID}
      className="flex-row items-center gap-1 rounded-3xl bg-default p-1"
    >
      {[0, 1, 2].map((segment) =>
        segment === activeIndex ? (
          <View
            key={segment}
            className="h-8 flex-1 rounded-3xl bg-surface shadow-sm"
          />
        ) : (
          <SkeletonGroup.Item
            key={segment}
            className="h-8 flex-1 rounded-3xl"
          />
        ),
      )}
    </View>
  );
}

/** `EarningsSummaryCard`: primary-light header, two money rows and one action. */
function SummaryCardSkeleton() {
  return (
    <View
      testID="finance-skeleton-summary"
      className="bg-surface border border-border rounded-3xl overflow-hidden"
    >
      <View className="bg-primary-light p-5 gap-2">
        <SkeletonGroup.Item className="h-4 w-32 rounded-md" />
        <SkeletonGroup.Item className="h-8 w-40 rounded-md" />
        <SkeletonGroup.Item className="h-3 w-48 rounded-md" />
        <SkeletonGroup.Item className="h-3 w-3/4 rounded-md" />
      </View>
      <View className="p-4 gap-3">
        <MoneyRowSkeleton />
        <MoneyRowSkeleton />
        <SkeletonGroup.Item className="h-9 w-full rounded-full" />
      </View>
    </View>
  );
}

function OverviewSkeleton() {
  return (
    <>
      <FinanceCard
        className="bg-primary border-primary"
        testID="finance-skeleton-attention"
      >
        <SkeletonGroup.Item
          className="h-5 w-36 rounded-md"
          style={onPrimary}
        />
        <SkeletonGroup.Item
          className="h-11 w-full rounded-2xl"
          style={onPrimary}
        />
        <SkeletonGroup.Item
          className="h-11 w-full rounded-2xl"
          style={onPrimary}
        />
      </FinanceCard>

      <FinanceCard testID="finance-skeleton-income">
        <SkeletonGroup.Item className="h-5 w-32 rounded-md" />
        <SkeletonGroup.Item className="h-3 w-full rounded-md" />
        <SkeletonGroup.Item className="h-3 w-2/3 rounded-md" />
        <TabStripSkeleton activeIndex={1} />
        <View className="flex-row flex-wrap gap-2">
          {[0, 1, 2].map((legend) => (
            <SkeletonGroup.Item
              key={legend}
              className="h-7 w-24 rounded-full"
            />
          ))}
        </View>
        <SkeletonGroup.Item className="h-40 w-full rounded-2xl" />
      </FinanceCard>

      <FinanceCard testID="finance-skeleton-collections">
        <SkeletonGroup.Item className="h-5 w-36 rounded-md" />
        <SkeletonGroup.Item className="h-3 w-full rounded-md" />
        <SkeletonGroup.Item className="h-3 w-4/5 rounded-md" />
        <MoneyRowSkeleton />
        <SkeletonGroup.Item className="h-12 w-full rounded-xl" />
        {[0, 1, 2].map((row) => (
          <SkeletonGroup.Item
            key={row}
            className="h-9 w-full rounded-full"
          />
        ))}
        <SkeletonGroup.Item className="h-3 w-full rounded-md" />
      </FinanceCard>

      <FinanceCard testID="finance-skeleton-monthly-plan">
        <SkeletonGroup.Item className="h-5 w-40 rounded-md" />
        <SkeletonGroup.Item className="h-3 w-full rounded-md" />
        <MoneyRowSkeleton />
        <MoneyRowSkeleton />
        <SkeletonGroup.Item className="h-10 w-full rounded-full" />
      </FinanceCard>

      <FinanceCard testID="finance-skeleton-performance">
        <SkeletonGroup.Item className="h-5 w-40 rounded-md" />
        <SkeletonGroup.Item className="h-3 w-2/3 rounded-md" />
        <TabStripSkeleton />
        {[0, 1, 2].map((row) => (
          <View key={row} className="gap-2">
            <MoneyRowSkeleton />
            <SkeletonGroup.Item className="h-2 w-full rounded-full" />
          </View>
        ))}
      </FinanceCard>
    </>
  );
}

function ExpensesSkeleton() {
  return (
    <>
      <FinanceCard
        className="bg-primary border-primary"
        testID="finance-skeleton-review"
      >
        <SkeletonGroup.Item
          className="h-5 w-40 rounded-md"
          style={onPrimary}
        />
        <SkeletonGroup.Item
          className="h-3 w-full rounded-md"
          style={onPrimary}
        />
        <SkeletonGroup.Item
          className="h-3 w-4/5 rounded-md"
          style={onPrimary}
        />
        <SkeletonGroup.Item
          className="h-11 w-full rounded-2xl"
          style={onPrimary}
        />
      </FinanceCard>

      <FinanceCard testID="finance-skeleton-categories">
        <SkeletonGroup.Item className="h-5 w-40 rounded-md" />
        <SkeletonGroup.Item className="h-3 w-full rounded-md" />
        {[0, 1, 2, 3].map((row) => (
          <View key={row} className="gap-2">
            <MoneyRowSkeleton />
            <SkeletonGroup.Item className="h-2 w-full rounded-full" />
            <SkeletonGroup.Item className="h-3 w-1/3 rounded-md" />
          </View>
        ))}
      </FinanceCard>
    </>
  );
}

function BudgetSkeleton() {
  return (
    <>
      <FinanceCard testID="finance-skeleton-budget-groups">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-1">
            <SkeletonGroup.Item className="h-5 w-40 rounded-md" />
            <SkeletonGroup.Item className="h-3 w-full rounded-md" />
          </View>
          <SkeletonGroup.Item className="h-8 w-16 rounded-full" />
        </View>
        {[0, 1, 2].map((row) => (
          <View key={row} className="gap-2">
            <SkeletonGroup.Item className="h-4 w-1/2 rounded-md" />
            <SkeletonGroup.Item className="h-3 w-1/3 rounded-md" />
            <SkeletonGroup.Item className="h-4 w-24 rounded-md" />
            <SkeletonGroup.Item className="h-2 w-full rounded-full" />
            <SkeletonGroup.Item className="h-3 w-1/3 rounded-md" />
          </View>
        ))}
      </FinanceCard>

      <FinanceCard testID="finance-skeleton-reserves">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-1">
            <SkeletonGroup.Item className="h-5 w-36 rounded-md" />
            <SkeletonGroup.Item className="h-3 w-full rounded-md" />
          </View>
          <SkeletonGroup.Item className="h-8 w-16 rounded-full" />
        </View>
        {[0, 1].map((row) => (
          <View key={row} className="gap-1">
            <MoneyRowSkeleton />
            <SkeletonGroup.Item className="h-3 w-1/3 rounded-md" />
          </View>
        ))}
      </FinanceCard>

    </>
  );
}

export function EntryFormSkeleton({
  label,
  testID,
}: {
  label: string;
  testID: string;
}) {
  return (
    <LoadingState label={label}>
      <SkeletonGroup isLoading className="gap-4" testID={testID}>
        <SkeletonGroup.Item className="h-4 w-full rounded-md" />
        <SkeletonGroup.Item className="h-4 w-4/5 rounded-md" />
        {[0, 1, 2].map((field) => (
          <View key={field} className="gap-2">
            <SkeletonGroup.Item className="h-4 w-28 rounded-md" />
            <SkeletonGroup.Item className="h-12 w-full rounded-2xl" />
          </View>
        ))}
        <View className="gap-2">
          <SkeletonGroup.Item className="h-3 w-full rounded-md" />
          <SkeletonGroup.Item className="h-3 w-4/5 rounded-md" />
        </View>
        {[0, 1, 2].map((field) => (
          <View key={`details-${field}`} className="gap-2">
            <SkeletonGroup.Item className="h-4 w-24 rounded-md" />
            <SkeletonGroup.Item className="h-12 w-full rounded-2xl" />
          </View>
        ))}
      </SkeletonGroup>
    </LoadingState>
  );
}

export function EntryFormFooterSkeleton() {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <SkeletonGroup isLoading className="flex-row gap-3">
        <SkeletonGroup.Item className="h-12 flex-1 rounded-full" />
        <SkeletonGroup.Item className="h-12 flex-1 rounded-full" />
      </SkeletonGroup>
    </View>
  );
}

/**
 * Profit & planning placeholder, shaped like the loaded page: property and
 * month, the earnings panel, the tab strip, the selected tab's cards and the
 * Planning guidelines link.
 */
export default function FinanceSkeleton({ tab }: FinanceSkeletonProps) {
  return (
    <LoadingState label="Loading profit and planning">
      <SkeletonGroup
        isLoading
        className="gap-5"
        testID={`finance-skeleton-${tab}`}
      >
        <HeadingBlockSkeleton testID="finance-skeleton-heading" />
        <SummaryCardSkeleton />
        <TabStripSkeleton
          activeIndex={TAB_INDEX[tab]}
          testID="finance-skeleton-tabs"
        />
        {tab === "overview" && <OverviewSkeleton />}
        {tab === "expenses" && <ExpensesSkeleton />}
        {tab === "budget" && <BudgetSkeleton />}
        <SkeletonGroup.Item
          testID="finance-skeleton-guidelines"
          className="h-4 w-40 rounded-md"
        />
      </SkeletonGroup>
    </LoadingState>
  );
}

/** Property performance drill-down: heading, metric tabs, ranked property rows. */
export function PropertyPerformanceSkeleton() {
  return (
    <LoadingState label="Loading property performance">
      <SkeletonGroup
        isLoading
        className="gap-5"
        testID="property-performance-skeleton"
      >
        <HeadingBlockSkeleton testID="property-performance-skeleton-heading" />
        <TabStripSkeleton testID="property-performance-skeleton-tabs" />
        <FinanceCard testID="property-performance-skeleton-list">
          {[0, 1, 2, 3, 4].map((row) => (
            <View key={row} className="gap-2">
              <MoneyRowSkeleton />
              <SkeletonGroup.Item className="h-2 w-full rounded-full" />
              <SkeletonGroup.Item className="h-3 w-1/3 rounded-md" />
            </View>
          ))}
        </FinanceCard>
      </SkeletonGroup>
    </LoadingState>
  );
}

/** Category expenses drill-down: heading and transaction cards. */
export function ExpenseTransactionsSkeleton() {
  return (
    <LoadingState label="Loading expenses">
      <SkeletonGroup
        isLoading
        className="gap-4"
        testID="expense-transactions-skeleton"
      >
        <HeadingBlockSkeleton testID="expense-transactions-skeleton-heading" />
        {[0, 1, 2, 3, 4].map((row) => (
          <View
            key={row}
            className="bg-surface border border-border rounded-2xl p-3 gap-2"
          >
            <MoneyRowSkeleton />
            <SkeletonGroup.Item className="h-3 w-2/3 rounded-md" />
            <SkeletonGroup.Item className="h-3 w-1/2 rounded-md" />
          </View>
        ))}
      </SkeletonGroup>
    </LoadingState>
  );
}

/** Budget category drill-down: heading summary and one card per property. */
export function BudgetCategorySkeleton() {
  return (
    <LoadingState label="Loading budget category">
      <SkeletonGroup
        isLoading
        className="gap-4"
        testID="budget-category-skeleton"
      >
        <View testID="budget-category-skeleton-heading" className="gap-1">
          <SkeletonGroup.Item className="h-6 w-36 rounded-md" />
          <SkeletonGroup.Item className="h-4 w-44 rounded-md" />
          <SkeletonGroup.Item className="h-4 w-3/4 rounded-md" />
        </View>
        {[0, 1, 2].map((row) => (
          <View
            key={row}
            className="bg-surface border border-border rounded-3xl p-4 gap-3"
          >
            <MoneyRowSkeleton />
            <SkeletonGroup.Item className="h-3 w-1/3 rounded-md" />
            <SkeletonGroup.Item className="h-2 w-full rounded-full" />
          </View>
        ))}
      </SkeletonGroup>
    </LoadingState>
  );
}
