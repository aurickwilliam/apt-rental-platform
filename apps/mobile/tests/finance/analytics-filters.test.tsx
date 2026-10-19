import type { PropsWithChildren, ReactNode } from "react";
import type { PressableProps, TextProps, TextInputProps } from "react-native";
import { act, fireEvent, render, waitFor, within } from "@testing-library/react-native";
import { Keyboard, ScrollView, View } from "react-native";
import AnalyticsScreen from "@/app/landlord/analytics";
import type { FinanceData, FinanceScope } from "@/service/finance/financeService";
import { shiftFinanceMonth, type FinanceCategory } from "@repo/utils";

const mockReview = jest.fn(() => Promise.resolve());
const mockRetry = jest.fn();
const mockFinance = {
  enabled: true,
  retry: mockRetry,
  ownerId: "owner",
  review: { isPending: false, mutateAsync: mockReview },
  report: {
    isLoading: false,
    isRefetching: false,
    refetch: jest.fn(),
    data: {
      properties: [
        { id: "villa", name: "Villa" },
        { id: "house", name: "House" },
      ],
      months: [
        {
          month: "2026-10",
          collected: 0,
          operating: 0,
          capital: 0,
          reviewed: false,
        },
      ],
      incomeMonths: [] as NonNullable<FinanceData["incomeMonths"]>,
      budgets: [] as FinanceData["budgets"],
      collections: { overdue: 0 },
      performance: [],
    },
  },
};
type MockFinance = Omit<typeof mockFinance, "report"> & {
  userError?: Error;
  report: Omit<typeof mockFinance.report, "data"> & { data?: typeof mockFinance.report.data };
};
const mockUseLandlordFinances = jest.fn((_scope: FinanceScope): MockFinance => mockFinance);
const mockIncomeRetry = jest.fn();
const mockIncomeResult = {
  data: Array.from({ length: 24 }, (_, index) => ({
    month: shiftFinanceMonth("2026-10", -index), collected: 0,
  })) as FinanceData["incomeMonths"],
  isFetching: false,
  isError: false,
  refetch: mockIncomeRetry,
};
const mockUseFinanceIncomeMonths = jest.fn(
  (_month: string, _apartmentId: string | null, _isOpen: boolean) => mockIncomeResult,
);
const mockSheetOpenStates = jest.fn();
const mockSheetContentProps = jest.fn();
const mockButtonProps = jest.fn();
const mockRouterPush = jest.fn();
const mockRouteParams: { month?: string; apartmentId?: string } = {};
const mockBudgetSheet = jest.fn((_props: unknown) => null);
const mockLedgerSheet = jest.fn((_props: unknown) => null);
const mockPropertyChart = jest.fn((_props: { onViewAll: () => void }) => null);
const mockBudgetChart = jest.fn(
  (_props: {
    onCreate: (category?: FinanceCategory, kind?: string) => void;
    onEdit: (budget: FinanceData["budgets"][number]) => void;
    onOpenGroup: (category: FinanceCategory, kind: string) => void;
  }) => null,
);
const mockCategoryChart = jest.fn(
  (_props: { onSelect: (category: FinanceCategory) => void }) => null,
);

jest.mock("@gorhom/bottom-sheet", () => {
  const { View, ScrollView } = jest.requireActual("react-native");
  return {
    BottomSheetScrollView: ScrollView,
    BottomSheetFooter: ({ children }: PropsWithChildren) => <View testID="filter-footer">{children}</View>,
  };
});
jest.mock("react-native-safe-area-context", () => ({ useSafeAreaInsets: () => ({ top: 62, bottom: 34, left: 0, right: 0 }) }));

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockRouteParams,
  useRouter: () => ({ push: mockRouterPush }),
}));
jest.mock("@/hooks/auth", () => ({
  useCurrentUser: () => ({ data: { id: "owner" } }),
}));
jest.mock("@/hooks/useTheme", () => ({
  useColors: () => ({ colors: { primary: "#376BF5" } }),
}));
jest.mock("@/hooks/finance/useLandlordFinances", () => ({
  useLandlordFinances: (scope: FinanceScope) => mockUseLandlordFinances(scope),
  useFinanceIncomeMonths: (month: string, apartmentId: string | null, isOpen: boolean) =>
    mockUseFinanceIncomeMonths(month, apartmentId, isOpen),
}));
jest.mock("@/service/finance/financeService", () => ({
  financeErrorMessage: () => "Failed",
}));
jest.mock("@/components/finance/FinanceSkeleton", () => {
  const { View } = jest.requireActual("react-native");
  return function Skeleton({ tab }: { tab: string }) { return <View testID={`finance-skeleton-${tab}`} />; };
});
jest.mock("@tabler/icons-react-native", () => {
  const { View } = jest.requireActual("react-native");
  return {
  IconChartBar: () => <View testID="finance-error-icon" />,
  IconLock: () => <View testID="finance-lock-icon" />,
  IconFilter2: () => null,
  IconPlus: () => null,
  IconCheck: () => null,
  IconChevronLeft: () => null,
  IconChevronRight: () => null,
  IconTargetArrow: () => null,
  };
});
jest.mock("@/components/layout/StandardHeader", () => {
  const { Text, View } = jest.requireActual("react-native");
  return function Header({
    title,
    rightComponent,
  }: {
    title: string;
    rightComponent?: ReactNode;
  }) {
    return (
      <View testID="standard-header">
        <Text>{title}</Text>
        {rightComponent}
      </View>
    );
  };
});
jest.mock("@/components/layout/ScreenWrapper", () => {
  const { View } = jest.requireActual("react-native");
  return function Wrapper({
    children,
    header,
    footer,
  }: PropsWithChildren<{ header: ReactNode; footer: ReactNode }>) {
    return (
      <View>
        {header}
        {children}
        {footer}
      </View>
    );
  };
});
jest.mock("heroui-native", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { Pressable, Text, TextInput, View } = jest.requireActual("react-native");
  const SheetContext = React.createContext({
    isOpen: false,
    onOpenChange: (_open: boolean) => {},
  });
  function Container({ children }: PropsWithChildren) {
    return <View>{children}</View>;
  }
  function SheetRoot({
    children,
    isOpen,
    onOpenChange,
  }: PropsWithChildren<{
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
  }>) {
    mockSheetOpenStates(isOpen);
    return (
      <SheetContext.Provider value={{ isOpen, onOpenChange }}>
        {children}
      </SheetContext.Provider>
    );
  }
  function SheetContent({ children, ...props }: PropsWithChildren<{ contentContainerClassName?: string; footerComponent?: (props: never) => ReactNode }>) {
    mockSheetContentProps(props);
    const { isOpen } = React.useContext(SheetContext);
    const previousOpen = React.useRef(isOpen);
    const [visible, setVisible] = React.useState(false);
    // Match installed HeroUI: Gorhom mounts at index -1 and only snaps open
    // after a false -> true transition, not when initially mounted open.
    React.useEffect(() => {
      if (isOpen && !previousOpen.current) setVisible(true);
      else if (!isOpen && previousOpen.current) setVisible(false);
      previousOpen.current = isOpen;
    }, [isOpen]);
    return visible ? <View>{children}{props.footerComponent?.({} as never)}</View> : null;
  }
  function SheetOverlay() {
    const { isOpen, onOpenChange } = React.useContext(SheetContext);
    return isOpen ? (
      <Pressable
        accessibilityLabel="Dismiss filters"
        onPress={() => onOpenChange(false)}
      />
    ) : null;
  }
  function Button({
    children,
    isDisabled,
    ...props
  }: PropsWithChildren<PressableProps & { isDisabled?: boolean; variant?: string }>) {
    mockButtonProps({ ...props, isDisabled, children });
    return (
      <Pressable {...props} disabled={isDisabled}>
        {children}
      </Pressable>
    );
  }
  Button.Label = function ButtonLabel({
    children,
    className,
  }: TextProps & { className?: string }) {
    return <Text className={className}>{children}</Text>;
  };
  const LinkButton = Object.assign(Button, { Label: Button.Label });
  const SearchContext = React.createContext({ value: "", onChange: (_value: string) => {} });
  function SearchRoot({ children, value, onChange }: PropsWithChildren<{ value: string; onChange: (value: string) => void }>) {
    return <SearchContext.Provider value={{ value, onChange }}>{children}</SearchContext.Provider>;
  }
  function SearchInput(props: TextInputProps) {
    const { value, onChange } = React.useContext(SearchContext);
    return <TextInput value={value} onChangeText={onChange} {...props} />;
  }
  function ClearSearch(props: PressableProps) {
    const { value, onChange } = React.useContext(SearchContext);
    return value.length ? <Pressable {...props} onPress={() => onChange("")} /> : null;
  }
  function DialogRoot({ children, isOpen }: PropsWithChildren<{ isOpen: boolean }>) {
    return isOpen ? <View>{children}</View> : null;
  }
  function SkeletonGroupRoot({ children }: PropsWithChildren<{ isLoading?: boolean }>) {
    return <View>{children}</View>;
  }
  function SkeletonGroupItem({ testID }: { testID?: string }) {
    return testID ? <View testID={testID} /> : null;
  }
  return {
    Button,
    LinkButton,
    SkeletonGroup: Object.assign(SkeletonGroupRoot, { Item: SkeletonGroupItem }),
    SearchField: Object.assign(SearchRoot, {
      Group: Container,
      SearchIcon: () => <View testID="property-search-icon" />,
      Input: SearchInput,
      ClearButton: ClearSearch,
    }),
    useBottomSheetAwareHandlers: () => ({}),
    Spinner: () => null,
    useToast: () => ({ toast: { show: jest.fn() } }),
    Dialog: Object.assign(DialogRoot, {
      Portal: Container,
      Overlay: Container,
      Content: Container,
      Title: Text,
      Description: Text,
      Close: () => null,
    }),
    BottomSheet: Object.assign(SheetRoot, {
      Portal: Container,
      Overlay: SheetOverlay,
      Content: SheetContent,
      Title: Text,
      Description: Text,
    }),
  };
});
jest.mock("@/components/finance/FinanceControls", () => {
  const { Pressable, Text, View } = jest.requireActual("react-native");
  return {
    FinanceCard: ({
      children,
      className,
    }: PropsWithChildren<{ className?: string }>) => (
      <View className={className}>{children}</View>
    ),
    FinanceHeading: ({
      title,
      titleClassName,
      description,
      descriptionClassName,
    }: {
      title: string;
      titleClassName?: string;
      description?: string;
      descriptionClassName?: string;
    }) => (
      <>
        <Text className={titleClassName}>{title}</Text>
        {description && (
          <Text className={descriptionClassName}>{description}</Text>
        )}
      </>
    ),
    FinanceError: () => null,
    FinanceTabs: ({ options, onChange }: { options: { value: string; label: string }[]; onChange: (value: string) => void }) => <View>
      {options.map((option) => <Pressable key={option.value} accessibilityLabel={`${option.label} tab`} onPress={() => onChange(option.value)}><Text>{option.label}</Text></Pressable>)}
    </View>,
    MoneyRow: () => null,
    FinanceSelect: () => { throw new Error("Report filters must not open nested selectors"); },
  };
});
jest.mock(
  "@/components/finance/IncomeTrendChart",
  () =>
    function Chart() {
      const { Text } = jest.requireActual("react-native");
      return <Text>Income trends</Text>;
    },
);
jest.mock(
  "@/components/finance/EarningsSummaryCard",
  () =>
    function Summary() {
      return null;
    },
);
jest.mock(
  "@/components/finance/ExpenseCategoryChart",
  () =>
    function Chart(props: { onSelect: (category: FinanceCategory) => void }) {
      mockCategoryChart(props);
      const { Text } = jest.requireActual("react-native");
      return <Text>Where expenses go</Text>;
    },
);
jest.mock(
  "@/components/finance/CollectionHealthChart",
  () =>
    function Chart() {
      return null;
    },
);
jest.mock(
  "@/components/finance/PropertyPerformanceChart",
  () =>
    function Chart(props: { onViewAll: () => void }) {
      mockPropertyChart(props);
      return null;
    },
);
jest.mock(
  "@/components/finance/BudgetProgressChart",
  () =>
    function Chart(props: {
      onCreate: (category?: FinanceCategory, kind?: string) => void;
      onEdit: (budget: FinanceData["budgets"][number]) => void;
      onOpenGroup: (category: FinanceCategory, kind: string) => void;
    }) {
      mockBudgetChart(props);
      return null;
    },
);
jest.mock(
  "@/components/finance/CollectionLedgerSheet",
  () =>
    function Sheet(props: { isOpen: boolean }) {
      mockLedgerSheet(props);
      return null;
    },
);
jest.mock("@/components/finance/FinanceEntrySheet", () => ({
  BudgetEntrySheet: (props: { isOpen: boolean; initial?: unknown }) => {
    mockBudgetSheet(props);
    return null;
  },
}));
jest.mock(
  "@/app/(tabs)/components/units/EmptyProperties",
  () =>
    function Empty() {
      return null;
    },
);

describe("analytics header filters", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLandlordFinances.mockImplementation(() => mockFinance);
    mockUseFinanceIncomeMonths.mockImplementation(() => mockIncomeResult);
    delete mockRouteParams.month;
    delete mockRouteParams.apartmentId;
    jest.useFakeTimers().setSystemTime(new Date("2026-10-17T04:00:00Z"));
  });
  afterEach(() => jest.useRealTimers());

  test("Needs attention appears before Income trends in the overview", () => {
    const screen = render(<AnalyticsScreen />);
    expect(
      screen.getAllByText(/^(Needs attention|Income trends)$/)
        .map((heading) => heading.props.children),
    ).toEqual(["Needs attention", "Income trends"]);
  });

  test("the monthly plan shows an empty state until budgets or reserves exist", () => {
    const screen = render(<AnalyticsScreen />);
    expect(screen.getByText("No plan for this month yet")).toBeTruthy();
    expect(
      screen.getByText(
        "Set spending limits and reserve goals for this month to see your plan here.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("View budgets & suggestions")).toBeTruthy();
    const budget: FinanceData["budgets"][number] = {
      id: "budget",
      apartment_id: "villa",
      month: "2026-10-01",
      category: "maintenance",
      kind: "expense",
      amount: 3000,
      spent: 0,
      target_amount: null,
      months_remaining: null,
    };
    mockUseLandlordFinances.mockReturnValue({
      ...mockFinance,
      report: {
        ...mockFinance.report,
        data: {
          ...mockFinance.report.data!,
          budgets: [budget],
        },
      },
    });
    screen.rerender(<AnalyticsScreen />);
    expect(screen.queryByText("No plan for this month yet")).toBeNull();
    expect(screen.getByText("View budgets & suggestions")).toBeTruthy();
  });

  test("planning guidelines open a clear explanation dialog", () => {
    const screen = render(<AnalyticsScreen />);
    fireEvent.press(screen.getByText("Planning guidelines"));
    expect(screen.getByText("Profit & planning guidelines")).toBeTruthy();
    expect(
      screen.getByText(
        "Budgets and reserve goals help you plan, but they do not move, hold or transfer money. They are not tax, accounting, legal or investment advice.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Collection expectations cover active leases and ended leases with a recorded end date. Removed listings are excluded. PayMongo transactions currently use test funds.",
      ),
    ).toBeTruthy();
  });

  test("view all opens the full property performance page for the shown month", () => {
    render(<AnalyticsScreen />);
    const chart = mockPropertyChart.mock.calls.at(-1)![0];
    chart.onViewAll();
    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: "/landlord/property-performance",
      params: { month: "2026-10" },
    });
  });

  test("a category opens its transactions page for the applied month", () => {
    const screen = render(<AnalyticsScreen />);
    fireEvent.press(screen.getByLabelText("Expenses tab"));
    const chart = mockCategoryChart.mock.calls.at(-1)![0];
    chart.onSelect("maintenance");
    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: "/landlord/category-expenses",
      params: { month: "2026-10", category: "maintenance" },
    });
  });

  test("the category page carries the filtered property", () => {
    Object.assign(mockRouteParams, { month: "2026-09", apartmentId: "house" });
    const screen = render(<AnalyticsScreen />);
    fireEvent.press(screen.getByLabelText("Expenses tab"));
    const chart = mockCategoryChart.mock.calls.at(-1)![0];
    chart.onSelect("insurance");
    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: "/landlord/category-expenses",
      params: { month: "2026-09", apartmentId: "house", category: "insurance" },
    });
  });

  test("a property selected from the full list filters the returned report", () => {
    Object.assign(mockRouteParams, { month: "2026-09", apartmentId: "house" });
    const screen = render(<AnalyticsScreen />);
    expect(mockUseLandlordFinances).toHaveBeenLastCalledWith({
      month: "2026-09",
      apartmentId: "house",
    });
    expect(screen.getByLabelText("Filtered property: House")).toBeTruthy();
  });

  test("unavailable access uses the landlord empty state without a retry action", () => {
    mockUseLandlordFinances.mockReturnValue({ ...mockFinance, enabled: false });
    const screen = render(<AnalyticsScreen />);

    expect(screen.getByTestId("finance-lock-icon")).toBeTruthy();
    expect(screen.getByText("Finances unavailable")).toBeTruthy();
    expect(screen.getByText("Switch to your landlord portal to view and manage finances for your properties.")).toBeTruthy();
    expect(screen.queryByText("Try again")).toBeNull();
    expect(screen.queryByText("Add expense")).toBeNull();
  });

  test("a loading failure uses the empty state with a working retry action", () => {
    mockUseLandlordFinances.mockReturnValue({ ...mockFinance, userError: new Error("Profile unavailable") });
    const screen = render(<AnalyticsScreen />);

    expect(screen.getByTestId("finance-error-icon")).toBeTruthy();
    expect(screen.getByText("Couldn't load your finances")).toBeTruthy();
    expect(screen.getByText("Failed")).toBeTruthy();
    fireEvent.press(screen.getByText("Try again"));
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  test("initial loading uses the finance layout and disables footer and filter actions", () => {
    mockUseLandlordFinances.mockReturnValue({ ...mockFinance, report: { ...mockFinance.report, isLoading: true, data: undefined } });
    const screen = render(<AnalyticsScreen />);
    expect(screen.getByTestId("finance-skeleton-overview")).toBeTruthy();
    expect(screen.getByLabelText("Filters")).toBeDisabled();
    expect(screen.getByText("Add expense")).toBeDisabled();
  });

  test("changing scope keeps the selected tab's skeleton", () => {
    const screen = render(<AnalyticsScreen />);
    fireEvent.press(screen.getByLabelText("Budget tab"));
    mockUseLandlordFinances.mockImplementation(() => ({ ...mockFinance, report: { ...mockFinance.report, isLoading: true, data: undefined } }));
    screen.rerender(<AnalyticsScreen />);
    expect(screen.getByTestId("finance-skeleton-budget")).toBeTruthy();
  });

  test("a background refresh keeps loaded content and footer actions", () => {
    mockUseLandlordFinances.mockReturnValue({ ...mockFinance, report: { ...mockFinance.report, isRefetching: true } });
    const screen = render(<AnalyticsScreen />);
    expect(screen.queryByTestId("finance-skeleton-overview")).toBeNull();
    expect(screen.getByLabelText(/^Filters,/)).not.toBeDisabled();
    expect(screen.getByText("Add expense")).not.toBeDisabled();
  });

  test("the header button opens the selectors, which are absent from page content", () => {
    const screen = render(<AnalyticsScreen />);
    expect(screen.queryByLabelText("Search properties")).toBeNull();
    expect(screen.queryByText("Apply filters")).toBeNull();
    const button = screen.getByLabelText(
      "Filters, All properties, October 2026",
    );
    expect(
      within(screen.getByTestId("standard-header")).getByLabelText(
        "Filters, All properties, October 2026",
      ),
    ).toBeTruthy();
    fireEvent.press(button);
    expect(screen.getByLabelText("Property: All properties")).toBeTruthy();
    expect(screen.getByText("All properties · October 2026")).toBeTruthy();
  });

  test("the sheet is mounted closed before the first header press", () => {
    const screen = render(<AnalyticsScreen />);
    expect(mockSheetOpenStates).toHaveBeenNthCalledWith(1, false);
    fireEvent.press(screen.getByLabelText(/^Filters,/));
    expect(mockSheetOpenStates).toHaveBeenLastCalledWith(true);
    expect(screen.getByText("Apply filters")).toBeTruthy();
  });

  test("the list fills a bounded sheet and the fixed footer buttons share a row equally", () => {
    const screen = render(<AnalyticsScreen />);
    fireEvent.press(screen.getByLabelText(/^Filters,/));
    expect(mockSheetContentProps).toHaveBeenLastCalledWith(expect.objectContaining({ contentContainerClassName: "h-full" }));
    const scroll = screen.UNSAFE_getAllByType(ScrollView).find((item) => item.props.enableFooterMarginAdjustment)!;
    expect(scroll.props.style).toEqual({ flex: 1 });
    expect(scroll.props.enableFooterMarginAdjustment).toBe(true);
    expect(within(scroll).queryByText("Apply filters")).toBeNull();
    expect(within(screen.getByTestId("filter-footer")).getByText("Apply filters")).toBeTruthy();
    const actions = screen.UNSAFE_getAllByType(View).find((item) => item.props.className === "flex-row gap-3");
    expect(actions).toBeTruthy();
    const buttons = actions!.findAllByProps({ className: "flex-1" });
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    expect(within(actions!).getByText("Cancel")).toBeTruthy();
    expect(within(actions!).getByText("Apply filters")).toBeTruthy();
  });

  test("one scroll view stays mounted across tabs and keyboard handling respects the safe area", () => {
    const dismiss = jest.spyOn(Keyboard, "dismiss").mockImplementation(() => {});
    const screen = render(<AnalyticsScreen />);
    fireEvent.press(screen.getByLabelText(/^Filters,/));
    const scroll = screen.UNSAFE_getAllByType(ScrollView).find((item) => item.props.enableFooterMarginAdjustment)!;
    expect(mockSheetContentProps).toHaveBeenLastCalledWith(expect.objectContaining({
      topInset: 62, keyboardBehavior: "fillParent", keyboardBlurBehavior: "restore", enableBlurKeyboardOnGesture: true,
    }));
    expect(screen.getByLabelText("Search properties").props.autoFocus).toBe(false);
    fireEvent(screen.getByLabelText("Search properties"), "submitEditing");
    expect(dismiss).toHaveBeenCalled();
    fireEvent.press(screen.getByLabelText("Month tab"));
    expect(screen.UNSAFE_getAllByType(ScrollView).filter((item) => item.props.enableFooterMarginAdjustment)).toEqual([scroll]);
    expect(scroll.props.keyboardDismissMode).toBe("on-drag");
    dismiss.mockRestore();
  });

  test("both filters apply together and remain selected when reopened", () => {
    const screen = render(<AnalyticsScreen />);
    expect(screen.getByLabelText("Report month: October 2026")).toBeTruthy();
    fireEvent.press(screen.getByLabelText(/^Filters,/));
    fireEvent.press(screen.getByLabelText("Property: Villa"));
    fireEvent.press(screen.getByLabelText("Month tab"));
    fireEvent.press(screen.getByLabelText(/^Month: September 2026,/));
    expect(mockUseLandlordFinances).toHaveBeenLastCalledWith({
      month: "2026-10",
      apartmentId: null,
    });
    fireEvent.press(screen.getByText("Apply filters"));
    expect(mockUseLandlordFinances).toHaveBeenLastCalledWith({
      month: "2026-09",
      apartmentId: "villa",
    });
    expect(screen.queryByText("Apply filters")).toBeNull();
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByLabelText("Report month: September 2026")).toBeTruthy();
    fireEvent.press(screen.getByLabelText("Filters, Villa, September 2026"));
    expect(screen.getByLabelText("Property: Villa").props.accessibilityState.checked).toBe(true);
    expect(screen.getByText("Villa · September 2026")).toBeTruthy();
  });

  test("Cancel discards pending filter changes", () => {
    const screen = render(<AnalyticsScreen />);
    fireEvent.press(screen.getByLabelText(/^Filters,/));
    fireEvent.press(screen.getByLabelText("Property: House"));
    fireEvent.press(screen.getByText("Cancel"));
    expect(mockUseLandlordFinances).toHaveBeenLastCalledWith({
      month: "2026-10",
      apartmentId: null,
    });
    fireEvent.press(screen.getByLabelText(/^Filters,/));
    expect(screen.getByLabelText("Property: All properties").props.accessibilityState.checked).toBe(true);
  });

  test("dismissing the sheet discards changes and it can open again", () => {
    const screen = render(<AnalyticsScreen />);
    fireEvent.press(screen.getByLabelText(/^Filters,/));
    fireEvent.press(screen.getByLabelText("Property: House"));
    fireEvent.press(screen.getByLabelText("Dismiss filters"));
    expect(mockSheetOpenStates).toHaveBeenLastCalledWith(false);
    expect(screen.queryByText("Apply filters")).toBeNull();
    fireEvent.press(screen.getByLabelText(/^Filters,/));
    expect(screen.getByLabelText("Property: All properties").props.accessibilityState.checked).toBe(true);
  });

  test("filters can return to their defaults", () => {
    const screen = render(<AnalyticsScreen />);
    fireEvent.press(screen.getByLabelText(/^Filters,/));
    fireEvent.press(screen.getByLabelText("Property: Villa"));
    fireEvent.press(screen.getByText("Apply filters"));
    fireEvent.press(screen.getByLabelText(/^Filters,/));
    fireEvent.press(screen.getByLabelText("Property: All properties"));
    fireEvent.press(screen.getByText("Apply filters"));
    expect(mockUseLandlordFinances).toHaveBeenLastCalledWith({
      month: "2026-10",
      apartmentId: null,
    });
    expect(screen.queryByText("1")).toBeNull();
  });

  test("search icon stays visible and clearing restores listings without changing the selected property", () => {
    const screen = render(<AnalyticsScreen />);
    fireEvent.press(screen.getByLabelText(/^Filters,/));
    expect(screen.getByTestId("property-search-icon")).toBeTruthy();
    expect(screen.queryByLabelText("Clear property search")).toBeNull();
    fireEvent.press(screen.getByLabelText("Property: Villa"));
    fireEvent.changeText(screen.getByLabelText("Search properties"), "house");
    expect(screen.queryByLabelText("Property: Villa")).toBeNull();
    expect(screen.getByLabelText("Property: House")).toBeTruthy();
    fireEvent.press(screen.getByLabelText("Clear property search"));
    expect(screen.getByLabelText("Search properties").props.value).toBe("");
    expect(screen.getByLabelText("Property: House")).toBeTruthy();
    expect(screen.getByLabelText("Property: Villa").props.accessibilityState.checked).toBe(true);
    expect(screen.getByTestId("property-search-icon")).toBeTruthy();
    expect(screen.queryByLabelText("Clear property search")).toBeNull();
  });

  test("only the selected property has the soft primary blue background", () => {
    const screen = render(<AnalyticsScreen />);
    fireEvent.press(screen.getByLabelText(/^Filters,/));
    expect(screen.getByLabelText("Property: All properties").props.className).toContain("bg-primary-light");
    expect(screen.getByLabelText("Property: Villa").props.className).not.toContain("bg-primary-light");
    fireEvent.press(screen.getByLabelText("Property: Villa"));
    expect(screen.getByLabelText("Property: Villa").props.className).toContain("bg-primary-light");
    expect(screen.getByLabelText("Property: All properties").props.className).not.toContain("bg-primary-light");
  });

  test("the page labels the selected property above the report month", () => {
    const screen = render(<AnalyticsScreen />);
    expect(screen.queryByText("Filtered property")).toBeNull();
    expect(screen.getByLabelText("All properties")).toBeTruthy();
    fireEvent.press(screen.getByLabelText(/^Filters,/));
    fireEvent.press(screen.getByLabelText("Property: Villa"));
    expect(screen.queryByText("Filtered property")).toBeNull();
    fireEvent.press(screen.getByText("Apply filters"));
    expect(screen.getByLabelText("Filtered property: Villa")).toBeTruthy();
    fireEvent.press(screen.getByLabelText(/^Filters,/));
    fireEvent.press(screen.getByLabelText("Property: House"));
    fireEvent.press(screen.getByText("Apply filters"));
    expect(screen.getByLabelText("Filtered property: House")).toBeTruthy();
    expect(screen.queryByLabelText("Filtered property: Villa")).toBeNull();
    fireEvent.press(screen.getByLabelText(/^Filters,/));
    fireEvent.press(screen.getByText("Reset"));
    fireEvent.press(screen.getByText("Apply filters"));
    expect(screen.queryByText("Filtered property")).toBeNull();
    expect(screen.getByLabelText("All properties")).toBeTruthy();
  });

  test("property search filters inline without mounting another sheet", () => {
    const screen = render(<AnalyticsScreen />);
    fireEvent.press(screen.getByLabelText(/^Filters,/));
    fireEvent.changeText(screen.getByLabelText("Search properties"), "  VILLA ");
    expect(screen.getByLabelText("Property: Villa")).toBeTruthy();
    expect(screen.queryByLabelText("Property: House")).toBeNull();
    fireEvent.changeText(screen.getByLabelText("Search properties"), "nothing");
    expect(screen.getByText("No matching properties.")).toBeTruthy();
    expect(screen.getByLabelText("Property: All properties")).toBeTruthy();
    expect(screen.getAllByText("Apply filters")).toHaveLength(1);
    expect(screen.queryByLabelText("Property")).toBeNull();
  });

  test("month grid enforces the 24-month range and keeps draft selections across tabs", () => {
    const screen = render(<AnalyticsScreen />);
    fireEvent.press(screen.getByLabelText(/^Filters,/));
    fireEvent.press(screen.getByLabelText("Property: Villa"));
    fireEvent.press(screen.getByLabelText("Month tab"));
    expect(screen.getByLabelText("Next year")).toBeDisabled();
    expect(screen.getByLabelText(/^Month: November 2026,/)).toBeDisabled();
    fireEvent.press(screen.getByLabelText("Previous year"));
    fireEvent.press(screen.getByLabelText("Previous year"));
    expect(screen.getByLabelText("Previous year")).toBeDisabled();
    expect(screen.getByLabelText(/^Month: October 2024,/)).toBeDisabled();
    expect(screen.getByLabelText(/^Month: November 2024,/)).not.toBeDisabled();
    fireEvent.press(screen.getByLabelText(/^Month: November 2024,/));
    fireEvent.press(screen.getByLabelText("Property tab"));
    expect(screen.getByLabelText("Property: Villa").props.accessibilityState.checked).toBe(true);
    expect(screen.getByText("Villa · November 2024")).toBeTruthy();
    fireEvent.press(screen.getByLabelText("Month tab"));
    expect(screen.getByLabelText(/^Month: November 2024,/).props.accessibilityState.checked).toBe(true);
    fireEvent.press(screen.getByText("Apply filters"));
    expect(mockUseLandlordFinances).toHaveBeenLastCalledWith({ month: "2024-11", apartmentId: "villa" });
  });

  test("the month grid marks only months with recorded rent collections", () => {
    mockUseFinanceIncomeMonths.mockReturnValue({
      ...mockIncomeResult,
      data: [
        { month: "2026-10", collected: 12000 },
        { month: "2026-09", collected: 0 },
      ],
    });
    const screen = render(<AnalyticsScreen />);
    fireEvent.press(screen.getByLabelText(/^Filters,/));
    fireEvent.press(screen.getByText("Month"));
    expect(screen.getByText("Rent collected")).toBeTruthy();
    expect(
      screen.getByLabelText("Month: October 2026, rent collected"),
    ).toBeTruthy();
    expect(
      screen.getByLabelText("Month: September 2026, no rent collected"),
    ).toBeTruthy();
    expect(screen.getByTestId("rent-collected-2026-10").props.className).toContain("bg-accent-foreground");
    expect(screen.queryByTestId("rent-collected-2026-09")).toBeNull();
    expect(screen.queryByText(/No dot means/)).toBeNull();
  });

  test("month dots use the draft property before applying filters", () => {
    mockUseFinanceIncomeMonths.mockImplementation((_month, property) => ({
      ...mockIncomeResult,
      data: [{ month: "2026-09", collected: property === "villa" ? 1000 : 0 }],
    }));
    const screen = render(<AnalyticsScreen />);
    fireEvent.press(screen.getByLabelText(/^Filters,/));
    fireEvent.press(screen.getByLabelText("Property: Villa"));
    fireEvent.press(screen.getByLabelText("Month tab"));
    expect(mockUseFinanceIncomeMonths).toHaveBeenLastCalledWith("2026-10", "villa", true);
    expect(screen.getByTestId("rent-collected-2026-09").props.className).toContain("bg-accent");
    expect(mockUseLandlordFinances).toHaveBeenLastCalledWith({ month: "2026-10", apartmentId: null });
  });

  test("missing and failed month data are not presented as zero rent", () => {
    mockUseFinanceIncomeMonths.mockReturnValue({ ...mockIncomeResult, data: undefined, isFetching: true });
    const screen = render(<AnalyticsScreen />);
    fireEvent.press(screen.getByLabelText(/^Filters,/));
    fireEvent.press(screen.getByLabelText("Month tab"));
    expect(screen.getByTestId("rent-indicator-loading-2026-09")).toBeTruthy();
    expect(screen.queryByTestId("rent-collected-2026-09")).toBeNull();
    expect(screen.queryByTestId("rent-indicator-loading-2026-11")).toBeNull();
    expect(screen.getByLabelText("Month: September 2026, rent data unavailable")).toBeTruthy();
    mockUseFinanceIncomeMonths.mockReturnValue({ ...mockIncomeResult, data: undefined, isError: true });
    screen.rerender(<AnalyticsScreen />);
    expect(screen.queryByTestId("rent-indicator-loading-2026-09")).toBeNull();
    fireEvent.press(screen.getByText("Retry rent indicators"));
    expect(mockIncomeRetry).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Month: September 2026, rent data unavailable")).not.toBeDisabled();
  });

  test("Reset changes only the draft until Apply", () => {
    const screen = render(<AnalyticsScreen />);
    fireEvent.press(screen.getByLabelText(/^Filters,/));
    fireEvent.press(screen.getByLabelText("Property: Villa"));
    fireEvent.press(screen.getByLabelText("Month tab"));
    fireEvent.press(screen.getByLabelText(/^Month: September 2026,/));
    fireEvent.press(screen.getByText("Apply filters"));
    fireEvent.press(screen.getByLabelText(/^Filters,/));
    fireEvent.press(screen.getByText("Reset"));
    expect(screen.getByText("All properties · October 2026")).toBeTruthy();
    expect(mockUseLandlordFinances).toHaveBeenLastCalledWith({ month: "2026-09", apartmentId: "villa" });
    fireEvent.press(screen.getByText("Cancel"));
    expect(screen.getByLabelText("Filters, Villa, September 2026")).toBeTruthy();
    fireEvent.press(screen.getByLabelText(/^Filters,/));
    fireEvent.press(screen.getByText("Reset"));
    fireEvent.press(screen.getByText("Apply filters"));
    expect(mockUseLandlordFinances).toHaveBeenLastCalledWith({ month: "2026-10", apartmentId: null });
  });

  test("reopening clears search and restores the selected month year", () => {
    const screen = render(<AnalyticsScreen />);
    fireEvent.press(screen.getByLabelText(/^Filters,/));
    fireEvent.changeText(screen.getByLabelText("Search properties"), "villa");
    fireEvent.press(screen.getByLabelText("Month tab"));
    fireEvent.press(screen.getByLabelText("Previous year"));
    fireEvent.press(screen.getByText("Cancel"));
    fireEvent.press(screen.getByLabelText(/^Filters,/));
    expect(screen.getByLabelText("Search properties").props.value).toBe("");
    fireEvent.press(screen.getByLabelText("Month tab"));
    expect(screen.getByText("2026")).toBeTruthy();
  });

  // HeroUI only snaps a sheet open on a closed → open transition, so the page keeps
  // every sheet mounted and drives it with `isOpen`.
  test("the Add expense FAB opens its own page while the budget sheet stays mounted closed", () => {
    const screen = render(<AnalyticsScreen />);
    expect(mockLedgerSheet).toHaveBeenLastCalledWith(
      expect.objectContaining({ isOpen: false }),
    );
    expect(mockBudgetSheet).toHaveBeenLastCalledWith(
      expect.objectContaining({ isOpen: false }),
    );
    const addExpenseFab = screen.getByLabelText("Add expense");
    expect(addExpenseFab.props.className).toContain("shadow-lg");
    expect(addExpenseFab.props.className).toContain("rounded-full");
    const floatingContainer = screen.UNSAFE_getAllByType(View).find(
      (view) => view.props.className === "absolute right-5",
    );
    expect(floatingContainer?.props.style).toEqual({ bottom: 50 });
    expect(floatingContainer?.props.pointerEvents).toBe("box-none");
    fireEvent.press(addExpenseFab);
    expect(mockRouterPush).toHaveBeenCalledWith({ pathname: "/landlord/add-expense", params: { month: "2026-10" } });
    expect(mockBudgetSheet).toHaveBeenLastCalledWith(
      expect.objectContaining({ isOpen: false }),
    );
  });

  // Creating a plan opens its own page (like Add expense); tapping a budget edits in the sheet.
  test("creating a budget opens the plan page while tapping one edits in the sheet", () => {
    const screen = render(<AnalyticsScreen />);
    fireEvent.press(screen.getByLabelText("Budget tab"));
    const chart = mockBudgetChart.mock.calls.at(-1)![0];
    act(() => chart.onCreate("insurance", "reserve"));
    expect(mockRouterPush).toHaveBeenLastCalledWith({
      pathname: "/landlord/add-budget",
      params: { month: "2026-10", category: "insurance", kind: "reserve" },
    });
    expect(mockBudgetSheet).toHaveBeenLastCalledWith(
      expect.objectContaining({ isOpen: false }),
    );
    act(() =>
      chart.onEdit({
        id: "budget",
        apartment_id: "villa",
        month: "2026-10-01",
        category: "maintenance",
        kind: "expense",
        amount: 3000,
        spent: 0,
        target_amount: null,
        months_remaining: null,
      }),
    );
    expect(mockBudgetSheet).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isOpen: true,
        initial: expect.objectContaining({ id: "budget" }),
      }),
    );
  });

  // The plan is grouped by category; opening a group lists the properties holding it.
  test("opening a budget category drills into the properties holding it", () => {
    const screen = render(<AnalyticsScreen />);
    fireEvent.press(screen.getByLabelText("Budget tab"));
    const chart = mockBudgetChart.mock.calls.at(-1)![0];
    act(() => chart.onOpenGroup("maintenance", "expense"));
    expect(mockRouterPush).toHaveBeenLastCalledWith({
      pathname: "/landlord/budget-category",
      params: { category: "maintenance", kind: "expense", month: "2026-10" },
    });
  });

  test("the budget drill-down carries the filtered property", () => {
    Object.assign(mockRouteParams, { month: "2026-09", apartmentId: "house" });
    const screen = render(<AnalyticsScreen />);
    fireEvent.press(screen.getByLabelText("Budget tab"));
    const chart = mockBudgetChart.mock.calls.at(-1)![0];
    act(() => chart.onOpenGroup("insurance", "reserve"));
    expect(mockRouterPush).toHaveBeenLastCalledWith({
      pathname: "/landlord/budget-category",
      params: {
        month: "2026-09",
        apartmentId: "house",
        category: "insurance",
        kind: "reserve",
      },
    });
  });

  test("the empty reserve shortcut opens the plan page preset to an emergency reserve", () => {
    const screen = render(<AnalyticsScreen />);
    fireEvent.press(screen.getByText("Plan an emergency reserve"));
    expect(mockRouterPush).toHaveBeenLastCalledWith({
      pathname: "/landlord/add-budget",
      params: { month: "2026-10", category: "emergency", kind: "reserve" },
    });
  });

  test("the review card sits above the category chart", () => {
    const screen = render(<AnalyticsScreen />);
    fireEvent.press(screen.getByLabelText("Expenses tab"));
    expect(
      screen
        .getAllByText(/^(Review this month|Where expenses go|Expense transactions)$/)
        .map((node) => node.props.children),
    ).toEqual(["Review this month", "Where expenses go"]);
  });

  test("the Expenses tab no longer lists transactions", () => {
    const screen = render(<AnalyticsScreen />);
    fireEvent.press(screen.getByLabelText("Expenses tab"));
    expect(screen.queryByText("Expense transactions")).toBeNull();
    expect(
      screen.queryByText("Tap a transaction to edit or delete it."),
    ).toBeNull();
    expect(
      screen.queryByText(
        "No expenses recorded. Add an expense, or review this month if you had none.",
      ),
    ).toBeNull();
    expect(screen.getByText("Planning guidelines")).toBeTruthy();
  });

  test("the review card is a blue card with a white outline action", () => {
    const screen = render(<AnalyticsScreen />);
    fireEvent.press(screen.getByLabelText("Expenses tab"));

    const reviewCard = screen
      .UNSAFE_getAllByType(View)
      .find((node) =>
        (node.props.className as string | undefined)
          ?.split(" ")
          .includes("bg-primary"),
      );
    expect(reviewCard).toBeTruthy();
    expect(screen.getByText("Review this month").props.className).toContain(
      "text-white",
    );
    expect(
      screen.getByText(
        "Check every expense for the selected properties before confirming. Zero spending is valid only after review.",
      ).props.className,
    ).toContain("text-white");

    const button = mockButtonProps.mock.calls
      .map(([props]) => props as { children?: PropsWithChildren; variant?: string; className?: string })
      .find((props) => (props.children as { props?: { children?: string } })?.props?.children === "Mark expenses reviewed");
    expect(button).toBeDefined();
    expect(button?.variant).toBe("outline");
    expect(button?.className?.split(" ")).toEqual(
      expect.arrayContaining(["bg-white", "border-white"]),
    );
    expect(screen.getByText("Mark expenses reviewed").props.className).toContain(
      "text-primary",
    );

    expect(screen.queryByText("Confirm expenses are complete")).toBeNull();
    fireEvent.press(screen.getByText("Mark expenses reviewed"));
    expect(screen.getByText("Confirm expenses are complete")).toBeTruthy();
    expect(screen.getByText("I have entered all expenses paid in October 2026 for all my properties, including any zero-expense properties.")).toBeTruthy();
    expect(mockReview).not.toHaveBeenCalled();
  });

  test("the confirmation names the filtered property and closes on Keep reviewing", () => {
    const screen = render(<AnalyticsScreen />);
    fireEvent.press(screen.getByLabelText(/^Filters,/));
    fireEvent.press(screen.getByLabelText("Property: Villa"));
    fireEvent.press(screen.getByText("Apply filters"));
    fireEvent.press(screen.getByLabelText("Expenses tab"));
    fireEvent.press(screen.getByText("Mark expenses reviewed"));
    expect(screen.getByText("I have entered all expenses paid in October 2026 for Villa, including any zero-expense properties.")).toBeTruthy();
    fireEvent.press(screen.getByText("Keep reviewing"));
    expect(screen.queryByText("Confirm expenses are complete")).toBeNull();
    expect(mockReview).not.toHaveBeenCalled();
  });

  test("confirming runs the review once and closes the dialog", async () => {
    const screen = render(<AnalyticsScreen />);
    fireEvent.press(screen.getByLabelText("Expenses tab"));
    fireEvent.press(screen.getByText("Mark expenses reviewed"));
    fireEvent.press(screen.getByText("Confirm"));
    await waitFor(() => expect(mockReview).toHaveBeenCalledTimes(1));
    expect(screen.queryByText("Confirm expenses are complete")).toBeNull();
  });

  test("a failed review keeps the dialog open with the error", async () => {
    mockReview.mockRejectedValueOnce(new Error("nope"));
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    const screen = render(<AnalyticsScreen />);
    fireEvent.press(screen.getByLabelText("Expenses tab"));
    fireEvent.press(screen.getByText("Mark expenses reviewed"));
    fireEvent.press(screen.getByText("Confirm"));
    expect(await screen.findByText("Failed")).toBeTruthy();
    expect(screen.getByText("Confirm expenses are complete")).toBeTruthy();
    consoleError.mockRestore();
  });
});
