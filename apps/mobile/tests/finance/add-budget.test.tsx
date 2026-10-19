import type { ComponentProps, PropsWithChildren, ReactNode } from "react";
import { act, render } from "@testing-library/react-native";
import AddBudgetScreen from "@/app/landlord/add-budget";
import type { BudgetEntryPage } from "@/components/finance/FinanceEntrySheet";

const mockParams: {
  month?: string;
  apartmentId?: string;
  category?: string;
  kind?: string;
} = {};
const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockSave = jest.fn();
const mockToast = jest.fn();
const mockPage = jest.fn((_props: ComponentProps<typeof BudgetEntryPage>) => null);
const mockEntryFormSkeleton = jest.fn(() => null);
const mockEntryFormFooterSkeleton = jest.fn(() => null);
const mockFinance = {
  enabled: true,
  report: { data: { properties: [{ id: "villa", name: "Villa" }] }, isLoading: false },
  budget: { mutateAsync: mockSave },
};
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ canGoBack: () => true, back: mockBack, replace: mockReplace }),
}));
jest.mock("heroui-native", () => ({ useToast: () => ({ toast: { show: mockToast } }) }));
jest.mock("@/hooks/auth", () => ({ useCurrentUser: () => ({ data: { id: "owner" } }) }));
jest.mock("@/hooks/finance/useLandlordFinances", () => ({ useLandlordFinances: () => mockFinance }));
jest.mock("@/service/finance/financeService", () => ({ financeErrorMessage: () => "Failed" }));
jest.mock("@/components/finance/FinanceControls", () => ({ FinanceError: () => null }));
jest.mock("@/components/finance/FinanceEntrySheet", () => ({ BudgetEntryPage: (props: ComponentProps<typeof BudgetEntryPage>) => mockPage(props) }));
jest.mock("@/components/finance/FinanceSkeleton", () => ({
  EntryFormSkeleton: () => mockEntryFormSkeleton(),
  EntryFormFooterSkeleton: () => mockEntryFormFooterSkeleton(),
}));
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

describe("Add budget route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSave.mockResolvedValue(undefined);
    mockFinance.report.isLoading = false;
    delete mockParams.month;
    delete mockParams.apartmentId;
    delete mockParams.category;
    delete mockParams.kind;
    jest.useFakeTimers().setSystemTime(new Date("2026-10-17T04:00:00Z"));
  });
  afterEach(() => jest.useRealTimers());

  test("seeds the month, property and presets from analytics", () => {
    Object.assign(mockParams, {
      apartmentId: "villa",
      month: "2026-09",
      category: "insurance",
      kind: "reserve",
    });
    render(<AddBudgetScreen />);
    expect(mockPage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        apartmentId: "villa",
        month: "2026-09",
        presetCategory: "insurance",
        presetKind: "reserve",
      }),
    );
  });

  test("unowned properties and invalid presets never seed the form", () => {
    Object.assign(mockParams, {
      apartmentId: "someone-elses",
      month: "2027-13",
      category: "unknown",
      kind: "savings",
    });
    render(<AddBudgetScreen />);
    const props = mockPage.mock.calls.at(-1)![0];
    expect(props.apartmentId).toBeNull();
    expect(props.month).toBe("2026-10");
    expect(props.presetCategory).toBeUndefined();
    expect(props.presetKind).toBeUndefined();
  });

  test("shows form-shaped placeholders while loading properties", () => {
    mockFinance.report.isLoading = true;
    render(<AddBudgetScreen />);
    expect(mockEntryFormSkeleton).toHaveBeenCalledTimes(1);
    expect(mockEntryFormFooterSkeleton).toHaveBeenCalledTimes(1);
    expect(mockPage).not.toHaveBeenCalled();
  });

  test("saving uses the existing finance mutation and closing returns to analytics", async () => {
    render(<AddBudgetScreen />);
    const props = mockPage.mock.calls.at(-1)![0];
    const budget = {
      apartment_id: "villa",
      month: "2026-10",
      category: "maintenance" as const,
      kind: "expense" as const,
      amount: 5000,
      target_amount: null,
      months_remaining: null,
    };
    await act(async () => {
      await props.onSave(budget);
    });
    expect(mockSave).toHaveBeenCalledWith(budget);
    expect(mockToast).toHaveBeenCalledWith({
      label: "Budget saved",
      variant: "success",
    });
    act(() => props.onClose());
    expect(mockBack).toHaveBeenCalled();
  });
});
