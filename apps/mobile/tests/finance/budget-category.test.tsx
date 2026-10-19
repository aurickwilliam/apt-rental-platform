import type { PropsWithChildren, ReactNode } from "react";
import type { PressableProps } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import BudgetCategoryScreen from "@/app/landlord/budget-category";

const mockParams: {
  month?: string;
  apartmentId?: string;
  category?: string;
  kind?: string;
} = {};
const mockCanGoBack = jest.fn(() => true);
const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockRetry = jest.fn();
const mockRefetch = jest.fn();
const mockFinanceError = jest.fn(
  (_props: { message?: string; onRetry: () => void }) => null,
);
const mockHeader = jest.fn(
  (_props: { title: string; onBackPress?: () => void }) => null,
);

const maintenance = {
  id: "budget-1",
  apartment_id: "villa",
  month: "2026-09-01",
  category: "maintenance",
  kind: "expense",
  amount: 3000,
  spent: 4200,
  target_amount: null,
  months_remaining: null,
};
const utilities = {
  id: "budget-2",
  apartment_id: "studio",
  month: "2026-09-01",
  category: "utilities",
  kind: "expense",
  amount: 2000,
  spent: 500,
  target_amount: null,
  months_remaining: null,
};
const maintenanceStudio = {
  id: "budget-4",
  apartment_id: "studio",
  month: "2026-09-01",
  category: "maintenance",
  kind: "expense",
  amount: 1000,
  spent: 200,
  target_amount: null,
  months_remaining: null,
};
const insurance = {
  id: "budget-3",
  apartment_id: "villa",
  month: "2026-09-01",
  category: "insurance",
  kind: "reserve",
  amount: 1000,
  spent: 0,
  target_amount: 12000,
  months_remaining: 12,
};
const mockFinance = {
  enabled: true,
  ownerId: "owner",
  retry: mockRetry,
  userLoading: false,
  userError: undefined as Error | undefined,
  report: {
    data: {
      properties: [
        { id: "villa", name: "Villa" },
        { id: "studio", name: "Studio" },
      ],
      budgets: [maintenance, maintenanceStudio, utilities, insurance],
    },
    isLoading: false,
    isRefetching: false,
    error: undefined as Error | undefined,
    refetch: mockRefetch,
  },
  budget: { mutateAsync: jest.fn() },
  removeBudget: { mutateAsync: jest.fn() },
};
const mockUseLandlordFinances = jest.fn(
  (_scope: { month: string; apartmentId: string | null }) => mockFinance,
);

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({
    canGoBack: mockCanGoBack,
    back: mockBack,
    push: mockPush,
    replace: mockReplace,
  }),
}));
jest.mock("@/hooks/auth", () => ({
  useCurrentUser: () => ({ data: { id: "owner" } }),
}));
jest.mock("@/hooks/useTheme", () => ({
  useColors: () => ({ colors: { primary: "#376BF5", gray500: "#626B73" } }),
}));
jest.mock("@/hooks/finance/useLandlordFinances", () => ({
  useLandlordFinances: (scope: { month: string; apartmentId: string | null }) =>
    mockUseLandlordFinances(scope),
}));
jest.mock("@/service/finance/financeService", () => ({
  financeErrorMessage: () => "Failed",
}));
jest.mock("heroui-native", () => {
  const { Pressable, Text } = jest.requireActual("react-native");
  function Button({
    children,
    isDisabled,
    ...props
  }: PropsWithChildren<PressableProps & { isDisabled?: boolean }>) {
    return (
      <Pressable {...props} disabled={isDisabled}>
        {children}
      </Pressable>
    );
  }
  Button.Label = function ButtonLabel({ children }: PropsWithChildren) {
    return <Text>{children}</Text>;
  };
  return {
    Button,
    useToast: () => ({ toast: { show: jest.fn() } }),
  };
});
jest.mock("@/components/layout/ScreenWrapper", () => {
  const { View: NativeView } = jest.requireActual("react-native");
  return function Wrapper({
    children,
    header,
  }: PropsWithChildren<{ header?: ReactNode }>) {
    return (
      <NativeView>
        {header}
        {children}
      </NativeView>
    );
  };
});
jest.mock("@/components/layout/StandardHeader", () => {
  return function Header(props: { title: string; onBackPress?: () => void }) {
    return mockHeader(props);
  };
});
jest.mock("@/components/finance/FinanceSkeleton", () => {
  const { View: NativeView } = jest.requireActual("react-native");
  return function Skeleton() {
    return <NativeView testID="finance-skeleton" />;
  };
});
jest.mock("@/components/finance/FinanceControls", () => {
  const { Text } = jest.requireActual("react-native");
  return {
    FinanceError: (props: { message?: string; onRetry: () => void }) =>
      mockFinanceError(props),
    MoneyRow: ({ label, amount }: { label: string; amount: number | null }) => (
      <Text>
        {label}: {amount === null ? "Not calculated" : amount}
      </Text>
    ),
  };
});
jest.mock("@/components/finance/FinanceEntrySheet", () => ({}));

describe("Budget category route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams.month = "2026-09";
    mockParams.apartmentId = undefined;
    mockParams.category = "maintenance";
    mockParams.kind = undefined;
    mockCanGoBack.mockReturnValue(true);
    mockFinance.enabled = true;
    mockFinance.userLoading = false;
    mockFinance.userError = undefined;
    mockFinance.report.isLoading = false;
    mockFinance.report.isRefetching = false;
    mockFinance.report.error = undefined;
  });

  test("lists every property holding the category's budget with what it spent", () => {
    const screen = render(<BudgetCategoryScreen />);
    expect(mockHeader).toHaveBeenLastCalledWith(
      expect.objectContaining({ title: "Maintenance & repairs" }),
    );
    expect(mockUseLandlordFinances).toHaveBeenCalledWith({
      month: "2026-09",
      apartmentId: null,
    });
    expect(screen.getByText("All properties")).toBeTruthy();
    expect(screen.getByText("Spending limits · September 2026")).toBeTruthy();
    expect(
      screen.getByText("₱ 4,400 spent of ₱ 4,000 across 2 properties"),
    ).toBeTruthy();
    // Each property is its own surface card.
    expect(screen.getAllByTestId("budget-property-card")).toHaveLength(2);
    expect(screen.getByText("Villa")).toBeTruthy();
    expect(screen.getByText("Studio")).toBeTruthy();
    expect(screen.getByText(/₱ 4,200 \/ ₱ 3,000/)).toBeTruthy();
    expect(screen.getByText(/₱ 1,200 over budget · 140% used/)).toBeTruthy();
    expect(screen.getByText(/₱ 200 \/ ₱ 1,000/)).toBeTruthy();
    expect(screen.getByText(/₱ 800 remaining/)).toBeTruthy();
    // Other categories and reserve plans never leak into this page.
    expect(screen.queryByText(/₱ 500 \/ ₱ 2,000/)).toBeNull();
    expect(screen.queryByText(/Villa: 1000/)).toBeNull();
  });

  test("a reserve category lists planned amounts instead of spending", () => {
    mockParams.category = "insurance";
    mockParams.kind = "reserve";
    const screen = render(<BudgetCategoryScreen />);
    expect(mockHeader).toHaveBeenLastCalledWith(
      expect.objectContaining({ title: "Insurance" }),
    );
    expect(screen.getByText("Planned reserves · September 2026")).toBeTruthy();
    expect(screen.getByText("₱ 1,000 planned across 1 property")).toBeTruthy();
    expect(screen.getAllByTestId("budget-property-card")).toHaveLength(1);
    expect(screen.getByText(/Villa: 1000/)).toBeTruthy();
    expect(screen.getByText("planned this month")).toBeTruthy();
    fireEvent.press(screen.getByLabelText(/Villa, planned ₱ 1,000 this month/));
    expect(mockPush).toHaveBeenLastCalledWith({
      pathname: "/landlord/edit-budget",
      params: { id: insurance.id, month: "2026-09" },
    });
  });

  test("an applied property filter travels with the page", () => {
    mockParams.apartmentId = "villa";
    const screen = render(<BudgetCategoryScreen />);
    expect(mockUseLandlordFinances).toHaveBeenCalledWith({
      month: "2026-09",
      apartmentId: "villa",
    });
    expect(screen.getByLabelText("Filtered property: Villa")).toBeTruthy();
  });

  test("editing a property's budget opens its edit page", () => {
    const screen = render(<BudgetCategoryScreen />);
    fireEvent.press(screen.getByLabelText(/Villa, spent this month/));
    expect(mockPush).toHaveBeenLastCalledWith({
      pathname: "/landlord/edit-budget",
      params: { id: maintenance.id, month: "2026-09" },
    });
  });

  test("an unknown category asks the reader to pick one from the Budget tab", () => {
    mockParams.category = "bogus";
    const screen = render(<BudgetCategoryScreen />);
    expect(mockHeader).toHaveBeenLastCalledWith(
      expect.objectContaining({ title: "Budget plan" }),
    );
    expect(screen.getByText("Budget category not found")).toBeTruthy();
    fireEvent.press(screen.getByText("Back to budgets"));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  test("shows the loading skeleton while the report loads", () => {
    mockFinance.report.isLoading = true;
    const screen = render(<BudgetCategoryScreen />);
    expect(screen.getByTestId("finance-skeleton")).toBeTruthy();
  });

  test("shows a retryable error when the report fails", () => {
    mockFinance.report.error = new Error("nope");
    render(<BudgetCategoryScreen />);
    const error = mockFinanceError.mock.calls.at(-1)![0];
    expect(error.message).toBe("Failed");
    error.onRetry();
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  test("an empty category explains what is missing", () => {
    mockParams.category = "taxes";
    const screen = render(<BudgetCategoryScreen />);
    expect(screen.getByText("No spending limits in this category")).toBeTruthy();
    expect(
      screen.getByText("Nothing planned for September 2026."),
    ).toBeTruthy();
  });

  test("back returns to Profit & planning, falling back when there is no history", () => {
    render(<BudgetCategoryScreen />);
    mockHeader.mock.calls.at(-1)![0].onBackPress?.();
    expect(mockBack).toHaveBeenCalledTimes(1);
    mockCanGoBack.mockReturnValue(false);
    render(<BudgetCategoryScreen />);
    mockHeader.mock.calls.at(-1)![0].onBackPress?.();
    expect(mockReplace).toHaveBeenCalledWith("/landlord/analytics");
  });
});
