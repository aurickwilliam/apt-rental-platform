import type { ComponentProps, PropsWithChildren, ReactNode } from "react";
import { act, render } from "@testing-library/react-native";
import EditBudgetScreen from "@/app/landlord/edit-budget";
import type { BudgetEntryPage } from "@/components/finance/FinanceEntrySheet";

const mockParams: {
  id?: string;
  month?: string;
  apartmentId?: string;
  amount?: string;
} = {};
const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockSave = jest.fn();
const mockRemove = jest.fn();
const mockToast = jest.fn();
const mockPage = jest.fn((_props: ComponentProps<typeof BudgetEntryPage>) => null);
const budget = {
  id: "budget-1",
  apartment_id: "villa",
  month: "2026-09-01",
  category: "insurance" as const,
  kind: "reserve" as const,
  amount: 500,
  spent: 0,
  target_amount: 12000,
  months_remaining: 12,
};
const mockFinance = {
  enabled: true,
  report: {
    data: { properties: [{ id: "villa", name: "Villa" }], budgets: [budget] },
    isLoading: false,
  },
  budget: { mutateAsync: mockSave },
  removeBudget: { mutateAsync: mockRemove },
};

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ canGoBack: () => true, back: mockBack, replace: mockReplace }),
}));
jest.mock("heroui-native", () => ({ useToast: () => ({ toast: { show: mockToast } }), Button: () => null }));
jest.mock("@/hooks/auth", () => ({ useCurrentUser: () => ({ data: { id: "owner" } }) }));
jest.mock("@/hooks/useTheme", () => ({ useColors: () => ({ colors: { gray500: "#626B73" } }) }));
jest.mock("@/hooks/finance/useLandlordFinances", () => ({ useLandlordFinances: () => mockFinance }));
jest.mock("@/service/finance/financeService", () => ({ financeErrorMessage: () => "Failed" }));
jest.mock("@/components/finance/FinanceControls", () => ({ FinanceError: () => null }));
jest.mock("@/components/finance/FinanceEntrySheet", () => ({ BudgetEntryPage: (props: ComponentProps<typeof BudgetEntryPage>) => mockPage(props) }));
jest.mock("@/components/finance/FinanceSkeleton", () => ({ EntryFormSkeleton: () => null, EntryFormFooterSkeleton: () => null }));
jest.mock("@/components/display/EmptyState", () => () => null);
jest.mock("@/components/layout/ScreenWrapper", () => {
  const { View } = jest.requireActual("react-native");
  return function Wrapper({ children, footer }: PropsWithChildren<{ footer?: ReactNode }>) {
    return <View>{children}{footer}</View>;
  };
});
jest.mock("@/components/layout/StandardHeader", () => () => null);
jest.mock("@tabler/icons-react-native", () => ({ IconTargetArrow: () => null }));

describe("Edit budget route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSave.mockResolvedValue(undefined);
    mockRemove.mockResolvedValue(undefined);
    mockParams.id = "budget-1";
    mockParams.month = "2026-09";
    mockParams.apartmentId = undefined;
    mockParams.amount = undefined;
    jest.useFakeTimers().setSystemTime(new Date("2026-10-17T04:00:00Z"));
  });
  afterEach(() => jest.useRealTimers());

  test("loads the tapped plan and a validated suggestion amount into the page form", () => {
    mockParams.amount = "1000";
    render(<EditBudgetScreen />);
    expect(mockPage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        initial: budget,
        month: "2026-09",
        suggestedAmount: 1000,
      }),
    );
  });

  test("invalid suggested amounts do not prefill the form", () => {
    mockParams.amount = "12.345";
    render(<EditBudgetScreen />);
    expect(mockPage).toHaveBeenLastCalledWith(
      expect.objectContaining({ suggestedAmount: undefined }),
    );
  });

  test("save and removal use the same finance mutations then return to the report", async () => {
    render(<EditBudgetScreen />);
    const props = mockPage.mock.calls.at(-1)![0];
    const draft = {
      apartment_id: "villa",
      month: "2026-09",
      category: "insurance" as const,
      kind: "reserve" as const,
      amount: 1000,
      target_amount: 12000,
      months_remaining: 12,
    };
    await act(async () => { await props.onSave(draft); });
    expect(mockSave).toHaveBeenCalledWith(draft);
    expect(mockToast).toHaveBeenCalledWith({ label: "Budget saved", variant: "success" });
    await act(async () => { await props.onDelete!(budget.id); });
    expect(mockRemove).toHaveBeenCalledWith(budget.id);
    act(() => props.onClose());
    expect(mockBack).toHaveBeenCalled();
  });
});
