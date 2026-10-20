import type { ComponentProps, PropsWithChildren, ReactNode } from "react";
import { act, render } from "@testing-library/react-native";
import AddExpenseScreen from "@/app/landlord/add-expense";
import type ExpenseEntryPage from "@/components/finance/ExpenseEntryPage";

const mockParams: { month?: string; apartmentId?: string } = {};
const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockSave = jest.fn();
const mockToast = jest.fn();
const mockPage = jest.fn((_props: ComponentProps<typeof ExpenseEntryPage>) => null);
const mockExpenseEntrySkeleton = jest.fn(() => null);
const mockExpenseEntryFooterSkeleton = jest.fn(() => null);
const mockFinance = {
  enabled: true,
  report: { data: { properties: [{ id: "villa", name: "Villa" }] }, isLoading: false },
  expense: { mutateAsync: mockSave },
};
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ canGoBack: () => true, back: mockBack, replace: mockReplace }),
}));
jest.mock("heroui-native", () => ({ useToast: () => ({ toast: { show: mockToast } }) }));
jest.mock("@/hooks/auth", () => ({ useCurrentUser: () => ({ data: { id: "owner" } }) }));
jest.mock("@/hooks/finance/useLandlordFinances", () => ({ useLandlordFinances: () => mockFinance }));
jest.mock("@/service/finance/financeService", () => ({ financeErrorMessage: () => "Failed" }));
jest.mock("@/components/finance/FinanceError", () => () => null);
jest.mock("@/components/finance/ExpenseEntryPage", () => (props: ComponentProps<typeof ExpenseEntryPage>) => mockPage(props));
jest.mock("@/components/finance/EntryFormSkeleton", () => () => mockExpenseEntrySkeleton());
jest.mock("@/components/finance/EntryFormFooterSkeleton", () => () => mockExpenseEntryFooterSkeleton());
jest.mock("@/components/layout/ScreenWrapper", () => {
  const { View } = jest.requireActual("react-native");
  return function Wrapper({
    children,
    footer,
  }: PropsWithChildren<{ footer?: ReactNode }>) {
    return (
      <View>
        {children}
        {footer}
      </View>
    );
  };
});
jest.mock("@/components/layout/StandardHeader", () => () => null);

describe("Add expense route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSave.mockResolvedValue(undefined);
    mockFinance.report.isLoading = false;
    delete mockParams.month; delete mockParams.apartmentId;
    jest.useFakeTimers().setSystemTime(new Date("2026-10-17T04:00:00Z"));
  });
  afterEach(() => jest.useRealTimers());

  test("preselects the property and month from analytics", () => {
    Object.assign(mockParams, { apartmentId: "villa", month: "2026-09" });
    render(<AddExpenseScreen />);
    expect(mockPage).toHaveBeenLastCalledWith(expect.objectContaining({ apartmentId: "villa", month: "2026-09" }));
  });

  test("unowned property and invalid month params do not seed the form", () => {
    Object.assign(mockParams, { apartmentId: "someone-elses", month: "2027-13" });
    render(<AddExpenseScreen />);
    expect(mockPage).toHaveBeenLastCalledWith(expect.objectContaining({ apartmentId: null, month: "2026-10" }));
  });

  test("shows form-shaped placeholders while loading properties", () => {
    mockFinance.report.isLoading = true;
    render(<AddExpenseScreen />);
    expect(mockExpenseEntrySkeleton).toHaveBeenCalledTimes(1);
    expect(mockExpenseEntryFooterSkeleton).toHaveBeenCalledTimes(1);
    expect(mockPage).not.toHaveBeenCalled();
  });

  test("saving uses the existing finance mutation and closing returns to analytics", async () => {
    render(<AddExpenseScreen />);
    const props = mockPage.mock.calls.at(-1)![0];
    const draft = { id: "stable-id", apartment_id: "villa", category: "maintenance" as const, treatment: "operating" as const, amount: 2500, spent_on: "2026-10-17", description: "AC repair" };
    await act(async () => { await props.onSave(draft, false); });
    expect(mockSave).toHaveBeenCalledWith({ draft, editing: false });
    expect(mockToast).toHaveBeenCalledWith({ label: "Expense saved", variant: "success" });
    act(() => props.onClose());
    expect(mockBack).toHaveBeenCalled();
  });
});
