import type { ComponentProps, PropsWithChildren } from "react";
import { act, fireEvent, render } from "@testing-library/react-native";
import { type PressableProps, type TextProps, View } from "react-native";
import type { BarChart } from "react-native-gifted-charts";
import IncomeTrendChart from "./IncomeTrendChart";
import ExpenseCategoryChart from "./ExpenseCategoryChart";
import PropertyPerformanceChart from "./PropertyPerformanceChart";
import PropertyPerformanceList from "./PropertyPerformanceList";
import CollectionHealthChart from "./CollectionHealthChart";
import BudgetProgressChart from "./BudgetProgressChart";
import type { FinanceMonth } from "@repo/utils";

const mockBarChart = jest.fn();
jest.mock("react-native-gifted-charts", () => ({
  BarChart: (props: ComponentProps<typeof BarChart>) => {
    mockBarChart(props);
    const { Text: ChartText } = jest.requireActual("react-native");
    return <ChartText testID="chart">Chart</ChartText>;
  },
}));
jest.mock("@/hooks/useTheme", () => ({
  useColors: () => ({
    colors: {
      primary: "#376BF5",
      chartSky: "#0891B2",
      dangerMid: "#FF4B4B",
      textPrimary: "#333333",
      textSecondary: "#626B73",
      border: "#E5EAF2",
      danger: "#E50914",
      warning: "#FACC15",
      gray500: "#626B73",
    },
  }),
}));
jest.mock("heroui-native", () => {
  const { Pressable, Text } = jest.requireActual("react-native");
  const Button = ({
    children,
    onPress,
    isDisabled,
    ...props
  }: PropsWithChildren<PressableProps & { isDisabled?: boolean }>) => (
    <Pressable
      {...props}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ ...props.accessibilityState, disabled: isDisabled }}
    >
      {children}
    </Pressable>
  );
  Button.Label = function ButtonLabel({ children, ...props }: TextProps) {
    return <Text {...props}>{children}</Text>;
  };
  return { Button };
});
jest.mock("./FinanceControls", () => {
  const { Pressable, Text } = jest.requireActual("react-native");
  return {
    FinanceCard: ({ children }: PropsWithChildren) => <>{children}</>,
    FinanceHeading: ({
      title,
      action,
    }: {
      title: string;
      action?: React.ReactNode;
    }) => (
      <>
        <Text>{title}</Text>
        {action}
      </>
    ),
    MoneyRow: ({ label, amount }: { label: string; amount: number | null }) => (
      <Text>
        {label}: {amount === null ? "Not calculated" : amount}
      </Text>
    ),
    FinanceTabs: ({
      options,
      onChange,
    }: {
      options: { value: string; label: string }[];
      onChange: (value: string) => void;
    }) => (
      <>
        {options.map((option) => (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            onPress={() => onChange(option.value)}
          >
            <Text>{option.label}</Text>
          </Pressable>
        ))}
      </>
    ),
  };
});

const months: FinanceMonth[] = Array.from({ length: 12 }, (_, index) => ({
  month: `2026-${String(index + 1).padStart(2, "0")}`,
  collected: 10000,
  operating: 2000,
  capital: 1000,
  reviewed: true,
}));

describe("interactive finance charts", () => {
  beforeEach(() => mockBarChart.mockClear());
  test.each([
    { emptyMonths: [] },
    {
      emptyMonths: months.map((month) => ({
        ...month,
        collected: 0,
        operating: 0,
        capital: 0,
        reviewed: false,
      })),
    },
  ])("empty ranges show a message instead of a chart", ({ emptyMonths }) => {
    const screen = render(
      <IncomeTrendChart months={emptyMonths} onViewExpenses={jest.fn()} />,
    );
    expect(screen.getByText("No income activity yet")).toBeTruthy();
    expect(
      screen.getByText("Collected rent and recorded expenses will appear here."),
    ).toBeTruthy();
    expect(screen.queryByText("View expenses for this month")).toBeNull();
    expect(screen.queryByLabelText("Toggle collected")).toBeNull();
    expect(screen.queryByText(/Review each month/)).toBeNull();
    expect(mockBarChart).not.toHaveBeenCalled();
    expect(screen.getByText("3M")).toBeTruthy();
    expect(screen.getByText("6M")).toBeTruthy();
    expect(screen.getByText("12M")).toBeTruthy();
  });
  test("switching ranges restores the chart when an older month has activity", () => {
    const screen = render(
      <IncomeTrendChart
        months={months.map((month, index) => ({
          ...month,
          collected: index === 0 ? 10000 : 0,
          operating: 0,
          capital: 0,
        }))}
        onViewExpenses={jest.fn()}
      />,
    );
    expect(screen.getByText("No income activity yet")).toBeTruthy();
    fireEvent.press(screen.getByText("12M"));
    expect(screen.queryByText("No income activity yet")).toBeNull();
    const container = screen
      .UNSAFE_getAllByType(View)
      .find((node) => node.props.onLayout);
    fireEvent(container!, "layout", { nativeEvent: { layout: { width: 320 } } });
    expect(screen.getByTestId("chart")).toBeTruthy();
    fireEvent.press(screen.getByText("3M"));
    expect(screen.queryByTestId("chart")).toBeNull();
    expect(screen.getByText("No income activity yet")).toBeTruthy();
  });
  test("range, bar selection and transaction drill-down use the selected month", () => {
    const onViewExpenses = jest.fn();
    const screen = render(
      <IncomeTrendChart months={months} onViewExpenses={onViewExpenses} />,
    );
    // Layout is delivered by React Native, not a hard-coded device width.
    const container = screen
      .UNSAFE_getAllByType(View)
      .find((node) => node.props.onLayout);
    fireEvent(container!, "layout", {
      nativeEvent: { layout: { width: 320 } },
    });
    expect(mockBarChart.mock.lastCall?.[0].data).toHaveLength(12);
    fireEvent.press(screen.getByText("3M"));
    expect(mockBarChart.mock.lastCall?.[0].data).toHaveLength(6);
    const props = mockBarChart.mock.lastCall![0] as ComponentProps<
      typeof BarChart
    >;
    act(() => props.data?.[0].onPress?.());
    expect(screen.getByText("October 2026")).toBeTruthy();
    expect(screen.queryByText("View data / select month")).toBeNull();
    expect(screen.queryByText("Hide data")).toBeNull();
    fireEvent.press(screen.getByText("View expenses for this month"));
    expect(onViewExpenses).toHaveBeenCalledWith("2026-10");
    expect(props.width).toBe(272);
  });
  test("legend controls cannot hide both bar series", () => {
    const screen = render(
      <IncomeTrendChart months={months} onViewExpenses={jest.fn()} />,
    );
    fireEvent.press(screen.getByLabelText("Toggle collected"));
    fireEvent.press(screen.getByLabelText("Toggle expenses"));
    expect(
      screen.getByLabelText("Toggle expenses").props.accessibilityState
        .selected,
    ).toBe(true);
  });
  test("net line requires complete expense reviews", () => {
    const screen = render(
      <IncomeTrendChart
        months={months.map((month) => ({ ...month, reviewed: false }))}
        onViewExpenses={jest.fn()}
      />,
    );
    expect(screen.getByLabelText("Toggle net")).toBeDisabled();
    expect(
      screen.getByText(/Missing records aren’t assumed to be zero/),
    ).toBeTruthy();
  });
  test("negative net income is passed below the chart baseline", () => {
    const screen = render(
      <IncomeTrendChart
        months={months.map((month) => ({ ...month, operating: 15000 }))}
        onViewExpenses={jest.fn()}
      />,
    );
    const container = screen
      .UNSAFE_getAllByType(View)
      .find((node) => node.props.onLayout);
    fireEvent(container!, "layout", {
      nativeEvent: { layout: { width: 320 } },
    });
    fireEvent.press(screen.getByLabelText("Toggle net"));
    expect(mockBarChart.mock.lastCall?.[0].mostNegativeValue).toBe(-5000);
    expect(mockBarChart.mock.lastCall?.[0].showLine).toBe(true);
  });
  test("expense categories show the peso amount and its share without a mode switch", () => {
    const onSelect = jest.fn();
    const screen = render(
      <ExpenseCategoryChart
        categories={[
          { category: "maintenance", amount: 3000, previous_amount: 1000 },
          { category: "insurance", amount: 1000, previous_amount: 0 },
        ]}
        onSelect={onSelect}
      />,
    );
    expect(screen.getByText("₱ 3,000")).toBeTruthy();
    expect(screen.getByText("₱ 1,000")).toBeTruthy();
    expect(screen.getByText("75%")).toBeTruthy();
    expect(screen.getByText("25%")).toBeTruthy();
    expect(
      screen.getByText("Previous comparable period: ₱ 1,000"),
    ).toBeTruthy();
    expect(screen.getByText("Previous comparable period: ₱ 0")).toBeTruthy();
    expect(screen.queryByText("Amount")).toBeNull();
    expect(screen.queryByText("% of expenses")).toBeNull();
    expect(screen.queryByText("Show all categories")).toBeNull();
    fireEvent.press(
      screen.getByLabelText(/Maintenance & repairs,.*75 percent/),
    );
    expect(onSelect).toHaveBeenCalledWith("maintenance");
  });

  test("expense categories show an empty state when nothing is recorded", () => {
    const screen = render(
      <ExpenseCategoryChart
        categories={[]}
        onSelect={jest.fn()}
      />,
    );
    expect(screen.getByText("No expenses recorded")).toBeTruthy();
    expect(
      screen.getByText("Nothing recorded this month or the previous month."),
    ).toBeTruthy();

    screen.rerender(
      <ExpenseCategoryChart
        categories={[
          { category: "maintenance", amount: 0, previous_amount: 0 },
        ]}
        onSelect={jest.fn()}
      />,
    );
    expect(screen.getByText("No expenses recorded")).toBeTruthy();
  });

  test("property net ranking never treats missing expenses as zero", () => {
    const onSelect = jest.fn();
    const screen = render(
      <PropertyPerformanceChart
        properties={[
          { ...months[0], id: "a", name: "Villa", reviewed: false },
          { ...months[0], id: "b", name: "House" },
        ]}
        onSelect={onSelect}
        onViewAll={jest.fn()}
      />,
    );
    fireEvent.press(screen.getByText("Net income"));
    expect(screen.getByText("Not reviewed")).toBeTruthy();
    fireEvent.press(screen.getByLabelText(/House, net,/));
    expect(onSelect).toHaveBeenCalledWith("b");
  });
  test("view all hands the full ranked list to its own page", () => {
    const onViewAll = jest.fn();
    const screen = render(
      <PropertyPerformanceChart
        properties={[
          { ...months[0], id: "a", name: "Villa", collected: 40000 },
          { ...months[0], id: "b", name: "House", collected: 30000 },
          { ...months[0], id: "c", name: "Condo", collected: 20000 },
          { ...months[0], id: "d", name: "Studio", collected: 10000 },
        ]}
        onSelect={jest.fn()}
        onViewAll={onViewAll}
      />,
    );
    expect(screen.getByText("Villa")).toBeTruthy();
    expect(screen.queryByText("Studio")).toBeNull();
    fireEvent.press(screen.getByText("View all 4 properties"));
    expect(onViewAll).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Show top 3")).toBeNull();
  });
  test("the full page keeps every property without a filter affordance", () => {
    const screen = render(
      <PropertyPerformanceList
        properties={[
          { ...months[0], id: "a", name: "Villa", collected: 40000 },
          { ...months[0], id: "b", name: "House", collected: 30000 },
          { ...months[0], id: "c", name: "Condo", collected: 20000 },
          { ...months[0], id: "d", name: "Studio", collected: 10000 },
        ]}
        metric="collected"
      />,
    );
    ["Villa", "House", "Condo", "Studio"].forEach((name) => {
      expect(screen.getByText(name)).toBeTruthy();
    });
    expect(screen.queryByLabelText(/Filter this property/)).toBeNull();
  });
  test("collection segments open filtered rent lists", () => {
    const onSelect = jest.fn();
    const screen = render(
      <CollectionHealthChart
        data={{
          expected: 10000,
          collected: 6000,
          pending: 1000,
          overdue: 3000,
          overdueCount: 1,
          age7: 3000,
          age30: 0,
          ageOlder: 0,
        }}
        onSelect={onSelect}
      />,
    );
    fireEvent.press(screen.getByLabelText(/View overdue,/));
    expect(onSelect).toHaveBeenCalledWith("overdue");
    expect(screen.getByText("Expected rent: 10000")).toBeTruthy();
    expect(screen.queryByText("No billable tenancies this month")).toBeNull();
  });
  test("a month without billable tenancies shows an empty state instead of zero rows", () => {
    const onSelect = jest.fn();
    const screen = render(
      <CollectionHealthChart
        data={{
          expected: 0,
          collected: 0,
          pending: 0,
          overdue: 0,
          overdueCount: 0,
          age7: 0,
          age30: 0,
          ageOlder: 0,
        }}
        onSelect={onSelect}
      />,
    );
    expect(screen.getByText("No billable tenancies this month")).toBeTruthy();
    expect(
      screen.getByText(
        "Expected rent and payment status will appear here once a tenancy is billed for this month.",
      ),
    ).toBeTruthy();
    expect(screen.queryByText("Expected rent: 0")).toBeNull();
    expect(screen.queryByText("Collected")).toBeNull();
    expect(screen.queryByText("Not yet due")).toBeNull();
    expect(screen.queryByText("Overdue")).toBeNull();
    expect(screen.queryByLabelText(/^View collected/)).toBeNull();
    expect(screen.queryByText(/Late rent is outstanding income/)).toBeNull();
    expect(onSelect).not.toHaveBeenCalled();
  });
  test("empty spending limits and reserves show their empty states", () => {
    const screen = render(
      <BudgetProgressChart
        properties={[]}
        budgets={[]}
        onEdit={jest.fn()}
        onOpenGroup={jest.fn()}
        onCreate={jest.fn()}
      />,
    );
    expect(screen.getByText("No spending limits yet")).toBeTruthy();
    expect(
      screen.getByText(
        "Set spending limits for repairs, utilities and other property costs.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("No reserve goals yet")).toBeTruthy();
    expect(
      screen.getByText(
        "Plan a buffer for unexpected repairs, late payments, vacancies or replacements.",
      ),
    ).toBeTruthy();
  });
  test("one row per category totals its properties and flags overspending", () => {
    const onOpenGroup = jest.fn();
    const screen = render(
      <BudgetProgressChart
        properties={[
          { id: "a", name: "Villa" },
          { id: "b", name: "Studio" },
        ]}
        budgets={[
          {
            id: "b",
            apartment_id: "a",
            month: "2026-10-01",
            category: "maintenance",
            kind: "expense",
            amount: 3000,
            spent: 4200,
            target_amount: null,
            months_remaining: null,
          },
          {
            id: "c",
            apartment_id: "b",
            month: "2026-10-01",
            category: "maintenance",
            kind: "expense",
            amount: 1000,
            spent: 200,
            target_amount: null,
            months_remaining: null,
          },
        ]}
        onEdit={jest.fn()}
        onOpenGroup={onOpenGroup}
        onCreate={jest.fn()}
      />,
    );
    expect(screen.getByText("Maintenance & repairs")).toBeTruthy();
    expect(screen.getByText("2 properties")).toBeTruthy();
    expect(screen.getByText(/₱ 4,400 \/ ₱ 4,000/)).toBeTruthy();
    expect(screen.getByText(/₱ 400 over budget · 110% used/)).toBeTruthy();
    fireEvent.press(screen.getByLabelText(/Over budget. View properties/));
    expect(onOpenGroup).toHaveBeenCalledWith("maintenance", "expense");
  });
  test("a single-property category names it, and reserves stay plans that open their properties", () => {
    const onOpenGroup = jest.fn();
    const onEdit = jest.fn();
    const screen = render(
      <BudgetProgressChart
        properties={[{ id: "a", name: "Villa" }]}
        budgets={[
          {
            id: "b",
            apartment_id: "a",
            month: "2026-10-01",
            category: "maintenance",
            kind: "expense",
            amount: 3000,
            spent: 1200,
            target_amount: null,
            months_remaining: null,
          },
          {
            id: "r",
            apartment_id: "a",
            month: "2026-10-01",
            category: "insurance",
            kind: "reserve",
            amount: 1000,
            spent: 0,
            target_amount: 12000,
            months_remaining: 12,
          },
        ]}
        onEdit={onEdit}
        onOpenGroup={onOpenGroup}
        onCreate={jest.fn()}
      />,
    );
    expect(screen.getByText("Villa")).toBeTruthy();
    expect(screen.getByText(/₱ 1,800 remaining/)).toBeTruthy();
    expect(screen.getByText(/Insurance: 1000/)).toBeTruthy();
    fireEvent.press(screen.getByLabelText(/Insurance, Villa. Planned ₱ 1,000/));
    expect(onOpenGroup).toHaveBeenCalledWith("insurance", "reserve");
    // Goal suggestions still open the editor, not the drill-down.
    fireEvent.press(screen.getByText("Review suggestion"));
    expect(onEdit).toHaveBeenCalledWith(
      expect.objectContaining({ id: "r", amount: 1000 }),
    );
  });
});
