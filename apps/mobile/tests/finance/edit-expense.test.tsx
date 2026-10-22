import type { ComponentProps, PropsWithChildren, ReactNode } from "react";
import { act, render } from "@testing-library/react-native";
import EditExpenseScreen from "@/app/landlord/edit-expense";
import type ExpenseEntryPage from "@/components/finance/ExpenseEntryPage";

const mockParams: { id?: string; month?: string; apartmentId?: string } = {};
const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockSave = jest.fn();
const mockRemove = jest.fn();
const mockToast = jest.fn();
const mockUseFinanceExpense = jest.fn();
const mockPage = jest.fn((_props: ComponentProps<typeof ExpenseEntryPage>) => null);
const mockSkeleton = jest.fn(() => null);
const expense = {
  id: "exp-1",
  apartment_id: "villa",
  category: "maintenance" as const,
  treatment: "operating" as const,
  amount: 2500,
  spent_on: "2026-10-05",
  description: "AC repair",
};
const mockFinance = {
  enabled: true,
  ownerId: "owner",
  report: { data: { properties: [{ id: "villa", name: "Villa" }] }, isLoading: false },
  expense: { mutateAsync: mockSave },
  removeExpense: { mutateAsync: mockRemove },
  retry: jest.fn(),
};
const mockExpenseQuery: {
  data: typeof expense | null | undefined;
  isLoading: boolean;
  error: Error | undefined;
  refetch: jest.Mock;
} = { data: expense, isLoading: false, error: undefined, refetch: jest.fn() };

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ canGoBack: () => true, back: mockBack, replace: mockReplace }),
}));
jest.mock("heroui-native", () => {
  const { Pressable, Text } = jest.requireActual("react-native");
  return {
    useToast: () => ({ toast: { show: mockToast } }),
    Button: Object.assign(
      ({ children, ...props }: PropsWithChildren) => <Pressable {...props}>{children}</Pressable>,
      { Label: ({ children }: PropsWithChildren) => <Text>{children}</Text> },
    ),
  };
});
jest.mock("@/hooks/auth", () => ({ useCurrentUser: () => ({ data: { id: "owner" } }) }));
jest.mock("@/hooks/useTheme", () => ({ useColors: () => ({ colors: { gray500: "#888" } }) }));
jest.mock("@/hooks/finance/useLandlordFinances", () => ({
  useLandlordFinances: () => mockFinance,
  useFinanceExpense: (...args: unknown[]) => {
    mockUseFinanceExpense(...args);
    return mockExpenseQuery;
  },
}));
jest.mock("@/service/finance/financeService", () => ({ financeErrorMessage: () => "Failed" }));
jest.mock("@/components/finance/FinanceError", () => () => null);
jest.mock("@/components/display/EmptyState", () => ({ title }: { title: string }) => {
  const { Text } = jest.requireActual("react-native");
  return <Text>{title}</Text>;
});
jest.mock("@/components/finance/ExpenseEntryPage", () => (props: ComponentProps<typeof ExpenseEntryPage>) => mockPage(props));
jest.mock("@/components/finance/EntryFormSkeleton", () => () => mockSkeleton());
jest.mock("@/components/finance/EntryFormFooterSkeleton", () => () => null);
jest.mock("@/components/layout/ScreenWrapper", () => {
  const { View } = jest.requireActual("react-native");
  return function Wrapper({ children, footer }: PropsWithChildren<{ footer?: ReactNode }>) {
    return (
      <View>
        {children}
        {footer}
      </View>
    );
  };
});
jest.mock("@/components/layout/StandardHeader", () => () => null);

describe("Edit expense route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSave.mockResolvedValue(undefined);
    mockRemove.mockResolvedValue(undefined);
    mockFinance.report.isLoading = false;
    mockExpenseQuery.data = expense;
    mockExpenseQuery.isLoading = false;
    mockExpenseQuery.error = undefined;
    Object.assign(mockParams, { id: "exp-1", month: "2026-10" });
    delete mockParams.apartmentId;
    jest.useFakeTimers().setSystemTime(new Date("2026-10-17T04:00:00Z"));
  });
  afterEach(() => jest.useRealTimers());

  test("reads the expense again by id and seeds the form with it", () => {
    render(<EditExpenseScreen />);
    expect(mockUseFinanceExpense).toHaveBeenCalledWith("owner", "exp-1");
    expect(mockPage).toHaveBeenLastCalledWith(
      expect.objectContaining({ initial: expense, month: "2026-10" }),
    );
  });

  test("shows form-shaped placeholders while the expense loads", () => {
    mockExpenseQuery.isLoading = true;
    mockExpenseQuery.data = undefined;
    render(<EditExpenseScreen />);
    expect(mockSkeleton).toHaveBeenCalledTimes(1);
    expect(mockPage).not.toHaveBeenCalled();
  });

  test("a missing expense shows a not-found state instead of an empty form", () => {
    mockExpenseQuery.data = null;
    const screen = render(<EditExpenseScreen />);
    expect(screen.getByText("Expense not found")).toBeTruthy();
    expect(mockPage).not.toHaveBeenCalled();
  });

  test("saving and deleting use the existing finance mutations", async () => {
    render(<EditExpenseScreen />);
    const props = mockPage.mock.calls.at(-1)![0];
    const draft = { id: "exp-1", apartment_id: "villa", category: "maintenance" as const, treatment: "operating" as const, amount: 3000, spent_on: "2026-10-05", description: "AC repair" };
    await act(async () => { await props.onSave(draft, true); });
    expect(mockSave).toHaveBeenCalledWith({ draft, editing: true });
    expect(mockToast).toHaveBeenCalledWith({ label: "Expense saved", variant: "success" });
    await act(async () => { await props.onDelete?.("exp-1"); });
    expect(mockRemove).toHaveBeenCalledWith("exp-1");
    act(() => props.onClose());
    expect(mockBack).toHaveBeenCalled();
  });
});
