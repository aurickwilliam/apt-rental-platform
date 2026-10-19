import type { ComponentProps, PropsWithChildren, ReactNode } from "react";
import { act, render } from "@testing-library/react-native";
import { financeMonthLabel } from "@repo/utils";
import PropertyPerformanceScreen from "@/app/landlord/property-performance";
import type PropertyPerformanceList from "@/components/finance/PropertyPerformanceList";

const mockParams: { month?: string } = {};
const mockCanGoBack = jest.fn(() => true);
const mockBack = jest.fn();
const mockDismissTo = jest.fn();
const mockReplace = jest.fn();
const mockRetry = jest.fn();
const mockList = jest.fn(
  (_props: ComponentProps<typeof PropertyPerformanceList>) => null,
);
const mockFinanceError = jest.fn(
  (_props: { message?: string; onRetry: () => void }) => null,
);
const mockHeader = jest.fn(
  (_props: { title: string; onBackPress?: () => void }) => null,
);
const mockFinance = {
  enabled: true,
  retry: mockRetry,
  userLoading: false,
  userError: undefined as Error | undefined,
  report: {
    data: {
      properties: [{ id: "villa", name: "Villa" }],
      performance: [
        {
          id: "villa",
          name: "Villa",
          month: "2026-09",
          collected: 12000,
          operating: 2000,
          capital: 0,
          reviewed: true,
        },
        {
          id: "house",
          name: "House",
          month: "2026-09",
          collected: 6000,
          operating: 0,
          capital: 0,
          reviewed: false,
        },
      ],
    },
    isLoading: false,
    error: undefined as Error | undefined,
  },
};
const mockUseLandlordFinances = jest.fn(
  (_scope: { month: string; apartmentId: string | null }) => mockFinance,
);

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({
    canGoBack: mockCanGoBack,
    back: mockBack,
    dismissTo: mockDismissTo,
    replace: mockReplace,
  }),
}));
jest.mock("@/hooks/auth", () => ({
  useCurrentUser: () => ({ data: { id: "owner" } }),
}));
jest.mock("@/hooks/finance/useLandlordFinances", () => ({
  useLandlordFinances: (scope: { month: string; apartmentId: string | null }) =>
    mockUseLandlordFinances(scope),
}));
jest.mock("@/service/finance/financeService", () => ({
  financeErrorMessage: () => "Failed",
}));
jest.mock("@/components/finance/PropertyPerformanceList", () => ({
  __esModule: true,
  default: function List(props: ComponentProps<typeof PropertyPerformanceList>) {
    return mockList(props);
  },
  PropertyPerformanceTabs: () => null,
}));
jest.mock("@/components/finance/FinanceControls", () => {
  const { View } = jest.requireActual("react-native");
  return {
    FinanceCard: ({ children }: PropsWithChildren) => <View>{children}</View>,
    FinanceError: (props: { message?: string; onRetry: () => void }) =>
      mockFinanceError(props),
  };
});
jest.mock("@/components/finance/FinanceSkeleton", () => ({
  PropertyPerformanceSkeleton: () => null,
}));
jest.mock("@/components/layout/ScreenWrapper", () => {
  const { View } = jest.requireActual("react-native");
  return function Wrapper({
    children,
    header,
  }: PropsWithChildren<{ header?: ReactNode }>) {
    return (
      <View>
        {header}
        {children}
      </View>
    );
  };
});
jest.mock("@/components/layout/StandardHeader", () =>
  function Header(props: { title: string; onBackPress?: () => void }) {
    return mockHeader(props);
  },
);

describe("Property performance route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanGoBack.mockReturnValue(true);
    mockFinance.enabled = true;
    mockFinance.userLoading = false;
    mockFinance.userError = undefined;
    mockFinance.report.isLoading = false;
    mockFinance.report.error = undefined;
    delete mockParams.month;
    jest.useFakeTimers().setSystemTime(new Date("2026-10-17T04:00:00Z"));
  });
  afterEach(() => jest.useRealTimers());

  test("opens the month from analytics and shows every property", () => {
    Object.assign(mockParams, { month: "2026-09" });
    const screen = render(<PropertyPerformanceScreen />);
    expect(mockUseLandlordFinances).toHaveBeenCalledWith({
      month: "2026-09",
      apartmentId: null,
    });
    expect(mockList).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: mockFinance.report.data.performance,
        metric: "collected",
        onSelect: expect.any(Function),
      }),
    );
    expect(screen.getByText(financeMonthLabel("2026-09"))).toBeTruthy();
    expect(screen.getByText("All properties")).toBeTruthy();
  });

  test("selecting a property returns to analytics with its report filter", () => {
    Object.assign(mockParams, { month: "2026-09" });
    render(<PropertyPerformanceScreen />);
    const props = mockList.mock.calls.at(-1)![0];
    act(() => props.onSelect!("house"));
    expect(mockDismissTo).toHaveBeenCalledWith({
      pathname: "/landlord/analytics",
      params: { month: "2026-09", apartmentId: "house" },
    });
  });

  test("invalid month params fall back to the current month", () => {
    Object.assign(mockParams, { month: "2027-13" });
    render(<PropertyPerformanceScreen />);
    expect(mockUseLandlordFinances).toHaveBeenCalledWith({
      month: "2026-10",
      apartmentId: null,
    });
  });

  test("loading uses the finance layout", () => {
    mockFinance.report.isLoading = true;
    render(<PropertyPerformanceScreen />);
    expect(mockList).not.toHaveBeenCalled();
    expect(mockFinanceError).not.toHaveBeenCalled();
  });

  test("unavailable access explains the landlord requirement and retries", () => {
    mockFinance.enabled = false;
    render(<PropertyPerformanceScreen />);
    const props = mockFinanceError.mock.calls.at(-1)![0];
    expect(props.message).toBe(
      "Switch to your landlord portal to compare property performance.",
    );
    act(() => props.onRetry());
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  test("closing returns to the previous screen", () => {
    render(<PropertyPerformanceScreen />);
    act(() => mockHeader.mock.calls.at(-1)![0].onBackPress?.());
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test("closing falls back to analytics when there is nothing to go back to", () => {
    mockCanGoBack.mockReturnValue(false);
    render(<PropertyPerformanceScreen />);
    act(() => mockHeader.mock.calls.at(-1)![0].onBackPress?.());
    expect(mockReplace).toHaveBeenCalledWith("/landlord/analytics");
  });
});
