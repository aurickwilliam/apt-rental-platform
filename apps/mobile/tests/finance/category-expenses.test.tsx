import type { PropsWithChildren, ReactNode } from "react";
import type { PressableProps } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import CategoryExpensesScreen from "@/app/landlord/category-expenses";

const mockParams: {
  month?: string;
  apartmentId?: string;
  category?: string;
} = {};
const mockCanGoBack = jest.fn(() => true);
const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockRetry = jest.fn();
const mockFetchNextPage = jest.fn();
const mockExpensesRefetch = jest.fn();
const mockExpenseSheet = jest.fn((_props: unknown) => null);
const mockFinanceError = jest.fn(
  (_props: { message?: string; onRetry: () => void }) => null,
);
const mockHeader = jest.fn(
  (_props: { title: string; onBackPress?: () => void }) => null,
);

const expense = {
  id: "expense-1",
  apartment_id: "villa",
  category: "maintenance",
  treatment: "operating",
  amount: 3000,
  spent_on: "2026-09-10",
  description: "Repaint",
};
const mockExpenses = {
  data: { pages: [{ rows: [expense], next: null }] },
  isLoading: false,
  isRefetching: false,
  isFetchingNextPage: false,
  hasNextPage: false,
  error: undefined as Error | undefined,
  refetch: mockExpensesRefetch,
  fetchNextPage: mockFetchNextPage,
};
const mockUseFinanceExpenses = jest.fn(
  (
    _ownerId: string | null,
    _scope: { month: string; apartmentId: string | null },
    _category: string | null,
    _enabled: boolean,
  ) => mockExpenses,
);
const mockFinance = {
  enabled: true,
  ownerId: "owner",
  retry: mockRetry,
  userLoading: false,
  userError: undefined as Error | undefined,
  report: {
    data: { properties: [{ id: "villa", name: "Villa" }] },
    isLoading: false,
    error: undefined as Error | undefined,
  },
  expense: { mutateAsync: jest.fn() },
  removeExpense: { mutateAsync: jest.fn() },
};
const mockUseLandlordFinances = jest.fn(
  (_scope: { month: string; apartmentId: string | null }) => mockFinance,
);

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({
    canGoBack: mockCanGoBack,
    back: mockBack,
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
  useFinanceExpenses: (
    ownerId: string | null,
    scope: { month: string; apartmentId: string | null },
    category: string | null,
    enabled: boolean,
  ) => mockUseFinanceExpenses(ownerId, scope, category, enabled),
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
    Spinner: () => null,
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
  return {
    ExpenseTransactionsSkeleton: () => <NativeView testID="finance-skeleton" />,
  };
});
jest.mock("@/components/finance/FinanceControls", () => {
  const { View: NativeView } = jest.requireActual("react-native");
  return {
    FinanceCard: ({ children }: PropsWithChildren) => (
      <NativeView>{children}</NativeView>
    ),
    FinanceError: (props: { message?: string; onRetry: () => void }) =>
      mockFinanceError(props),
  };
});
jest.mock("@/components/finance/FinanceEntrySheet", () => ({
  ExpenseEntrySheet: (props: unknown) => mockExpenseSheet(props),
}));

describe("Category expenses route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams.month = "2026-09";
    mockParams.apartmentId = "villa";
    mockParams.category = "maintenance";
    mockCanGoBack.mockReturnValue(true);
    mockExpenses.data = { pages: [{ rows: [expense], next: null }] };
    mockExpenses.isLoading = false;
    mockExpenses.isRefetching = false;
    mockExpenses.isFetchingNextPage = false;
    mockExpenses.hasNextPage = false;
    mockExpenses.error = undefined;
    mockFinance.enabled = true;
    mockFinance.userLoading = false;
    mockFinance.userError = undefined;
    mockFinance.report.isLoading = false;
    mockFinance.report.error = undefined;
  });

  test("lists the category's transactions for the applied scope", () => {
    const screen = render(<CategoryExpensesScreen />);
    expect(mockHeader).toHaveBeenLastCalledWith(
      expect.objectContaining({ title: "Maintenance & repairs" }),
    );
    expect(mockUseLandlordFinances).toHaveBeenCalledWith({
      month: "2026-09",
      apartmentId: "villa",
    });
    expect(mockUseFinanceExpenses).toHaveBeenCalledWith(
      "owner",
      { month: "2026-09", apartmentId: "villa" },
      "maintenance",
      true,
    );
    expect(screen.getByText("Villa")).toBeTruthy();
    expect(screen.getByText("September 2026")).toBeTruthy();
    expect(screen.getByText("Repaint")).toBeTruthy();
    expect(screen.getByText("₱ 3,000")).toBeTruthy();
  });

  test("an unknown category falls back to the unfiltered list", () => {
    mockParams.category = "bogus";
    render(<CategoryExpensesScreen />);
    expect(mockHeader).toHaveBeenLastCalledWith(
      expect.objectContaining({ title: "Expense transactions" }),
    );
    expect(mockUseFinanceExpenses).toHaveBeenCalledWith(
      "owner",
      { month: "2026-09", apartmentId: "villa" },
      null,
      true,
    );
  });

  test("shows the loading skeleton while the report loads", () => {
    mockFinance.report.isLoading = true;
    const screen = render(<CategoryExpensesScreen />);
    expect(screen.getByTestId("finance-skeleton")).toBeTruthy();
  });

  test("shows a retryable error when the report fails", () => {
    mockFinance.report.error = new Error("nope");
    render(<CategoryExpensesScreen />);
    const error = mockFinanceError.mock.calls.at(-1)![0];
    expect(error.message).toBe("Failed");
    error.onRetry();
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  test("shows the empty state when the category has nothing recorded", () => {
    mockExpenses.data = { pages: [{ rows: [], next: null }] };
    const screen = render(<CategoryExpensesScreen />);
    expect(screen.getByText("No expenses in this category")).toBeTruthy();
    expect(
      screen.getByText("Nothing recorded in September 2026 for Villa."),
    ).toBeTruthy();
  });

  test("loads more transactions", () => {
    mockExpenses.hasNextPage = true;
    const screen = render(<CategoryExpensesScreen />);
    fireEvent.press(screen.getByText("Load more expenses"));
    expect(mockFetchNextPage).toHaveBeenCalledTimes(1);
  });

  test("back returns to Profit & planning, falling back when there is no history", () => {
    render(<CategoryExpensesScreen />);
    mockHeader.mock.calls.at(-1)![0].onBackPress?.();
    expect(mockBack).toHaveBeenCalledTimes(1);
    mockCanGoBack.mockReturnValue(false);
    render(<CategoryExpensesScreen />);
    mockHeader.mock.calls.at(-1)![0].onBackPress?.();
    expect(mockReplace).toHaveBeenCalledWith("/landlord/analytics");
  });

  test("pressing a transaction opens its edit sheet", () => {
    const screen = render(<CategoryExpensesScreen />);
    expect(mockExpenseSheet).toHaveBeenLastCalledWith(
      expect.objectContaining({ isOpen: false }),
    );
    fireEvent.press(
      screen.getByLabelText("Edit Repaint, ₱ 3,000, paid 2026-09-10"),
    );
    expect(mockExpenseSheet).toHaveBeenLastCalledWith(
      expect.objectContaining({ isOpen: true, initial: expense }),
    );
  });
});
