import type { PropsWithChildren } from "react";
import { render } from "@testing-library/react-native";
import FinanceSkeleton from "./FinanceSkeleton";
import BudgetCategorySkeleton from "./BudgetCategorySkeleton";
import EntryFormFooterSkeleton from "./EntryFormFooterSkeleton";
import EntryFormSkeleton from "./EntryFormSkeleton";
import ExpenseTransactionsSkeleton from "./ExpenseTransactionsSkeleton";
import PropertyPerformanceSkeleton from "./PropertyPerformanceSkeleton";

jest.mock("heroui-native", () => {
  const { View } = jest.requireActual("react-native");
  function Group({ children, testID }: PropsWithChildren<{ testID?: string }>) {
    return <View testID={testID}>{children}</View>;
  }
  return { SkeletonGroup: Object.assign(Group, { Item: View }) };
});
jest.mock("./FinanceCard", () => {
  const { View } = jest.requireActual("react-native");
  return {
    __esModule: true,
    default: ({
      children,
      testID,
    }: PropsWithChildren<{ testID?: string }>) => (
      <View testID={testID}>{children}</View>
    ),
  };
});

const TAB_SECTIONS = {
  overview: [
    "finance-skeleton-attention",
    "finance-skeleton-income",
    "finance-skeleton-collections",
    "finance-skeleton-monthly-plan",
    "finance-skeleton-performance",
  ],
  expenses: ["finance-skeleton-review", "finance-skeleton-categories"],
  budget: [
    "finance-skeleton-budget-groups",
    "finance-skeleton-reserves",
  ],
} as const;
const TABS = ["overview", "expenses", "budget"] as const;
const PAGE_CHROME = [
  "finance-skeleton-heading",
  "finance-skeleton-summary",
  "finance-skeleton-tabs",
  "finance-skeleton-guidelines",
];

describe("finance skeleton", () => {
  test("renders the entry form and footer placeholders accessibly", () => {
    const screen = render(
      <>
        <EntryFormSkeleton
          label="Loading expense form"
          testID="expense-entry-skeleton"
        />
        <EntryFormFooterSkeleton />
      </>,
    );
    expect(screen.getByLabelText("Loading expense form")).toBeTruthy();
    expect(screen.getByRole("progressbar").props.accessibilityState.busy).toBe(
      true,
    );
    expect(
      screen.getByTestId("expense-entry-skeleton", {
        includeHiddenElements: true,
      }),
    ).toBeTruthy();
    expect(screen.queryByTestId("expense-entry-skeleton")).toBeNull();
  });
  test("the entry form skeleton carries the caller's label", () => {
    const screen = render(
      <EntryFormSkeleton
        label="Loading budget form"
        testID="budget-entry-skeleton"
      />,
    );
    expect(screen.getByLabelText("Loading budget form")).toBeTruthy();
    expect(
      screen.getByTestId("budget-entry-skeleton", {
        includeHiddenElements: true,
      }),
    ).toBeTruthy();
  });

  test.each(TABS)(
    "renders the %s layout with an accessible loading state",
    (tab) => {
      const screen = render(<FinanceSkeleton tab={tab} />);
      expect(screen.getByLabelText("Loading profit and planning")).toBeTruthy();
      expect(
        screen.getByRole("progressbar").props.accessibilityState.busy,
      ).toBe(true);
      // Decorative placeholders are hidden from assistive technology.
      expect(
        screen.getByTestId(`finance-skeleton-${tab}`, {
          includeHiddenElements: true,
        }),
      ).toBeTruthy();
      expect(screen.queryByTestId(`finance-skeleton-${tab}`)).toBeNull();
    },
  );

  test.each(TABS)("the %s skeleton mirrors the loaded page", (tab) => {
    const screen = render(<FinanceSkeleton tab={tab} />);
    for (const id of [...PAGE_CHROME, ...TAB_SECTIONS[tab]]) {
      expect(
        screen.getByTestId(id, { includeHiddenElements: true }),
      ).toBeTruthy();
    }
    const otherSections = TABS.filter((other) => other !== tab).flatMap(
      (other) => TAB_SECTIONS[other],
    );
    for (const id of otherSections) {
      expect(
        screen.queryByTestId(id, { includeHiddenElements: true }),
      ).toBeNull();
    }
  });

  test("the drill-down skeletons carry their own page shapes", () => {
    const screen = render(
      <>
        <PropertyPerformanceSkeleton />
        <ExpenseTransactionsSkeleton />
        <BudgetCategorySkeleton />
      </>,
    );
    expect(screen.getByLabelText("Loading property performance")).toBeTruthy();
    expect(screen.getByLabelText("Loading expenses")).toBeTruthy();
    expect(screen.getByLabelText("Loading budget category")).toBeTruthy();
    expect(screen.getAllByRole("progressbar")).toHaveLength(3);
    for (const id of [
      "property-performance-skeleton-heading",
      "property-performance-skeleton-tabs",
      "property-performance-skeleton-list",
      "expense-transactions-skeleton-heading",
      "budget-category-skeleton-heading",
    ]) {
      expect(
        screen.getByTestId(id, { includeHiddenElements: true }),
      ).toBeTruthy();
    }
    // Drill-downs replace the analytics page chrome with their own heading.
    for (const id of PAGE_CHROME) {
      expect(
        screen.queryByTestId(id, { includeHiddenElements: true }),
      ).toBeNull();
    }
  });
});
