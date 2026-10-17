import type { PropsWithChildren, ReactNode } from "react";
import type { PressableProps, TextProps, TextInputProps } from "react-native";
import { fireEvent, render, within } from "@testing-library/react-native";
import { Keyboard, ScrollView, View } from "react-native";
import AnalyticsScreen from "@/app/landlord/analytics";
import type { FinanceScope } from "@/service/finance/financeService";

const mockFinance = {
  enabled: true,
  ownerId: "owner",
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
      budgets: [],
      collections: { overdue: 0 },
      performance: [],
    },
  },
};
const mockUseLandlordFinances = jest.fn((_scope: FinanceScope) => mockFinance);
const mockSheetOpenStates = jest.fn();
const mockSheetContentProps = jest.fn();
const mockExpenseSheet = jest.fn((_props: unknown) => null);
const mockBudgetSheet = jest.fn((_props: unknown) => null);
const mockLedgerSheet = jest.fn((_props: unknown) => null);

jest.mock("@gorhom/bottom-sheet", () => {
  const { View, ScrollView } = jest.requireActual("react-native");
  return {
    BottomSheetScrollView: ScrollView,
    BottomSheetFooter: ({ children }: PropsWithChildren) => <View testID="filter-footer">{children}</View>,
  };
});
jest.mock("react-native-safe-area-context", () => ({ useSafeAreaInsets: () => ({ top: 62, bottom: 34, left: 0, right: 0 }) }));

jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("@/hooks/auth", () => ({
  useCurrentUser: () => ({ data: { id: "owner" } }),
}));
jest.mock("@/hooks/useTheme", () => ({
  useColors: () => ({ colors: { primary: "#376BF5" } }),
}));
jest.mock("@/hooks/finance/useLandlordFinances", () => ({
  useLandlordFinances: (scope: FinanceScope) => mockUseLandlordFinances(scope),
  useFinanceExpenses: () => ({}),
}));
jest.mock("@/service/finance/financeService", () => ({
  financeErrorMessage: () => "Failed",
}));
jest.mock("@tabler/icons-react-native", () => ({
  IconFilter2: () => null,
  IconPlus: () => null,
}));
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
  }: PropsWithChildren<PressableProps & { isDisabled?: boolean }>) {
    return (
      <Pressable {...props} disabled={isDisabled}>
        {children}
      </Pressable>
    );
  }
  Button.Label = function ButtonLabel({ children }: TextProps) {
    return <Text>{children}</Text>;
  };
  return {
    Button,
    Input: (props: TextInputProps) => <TextInput {...props} />,
    useBottomSheetAwareHandlers: () => ({}),
    Spinner: () => null,
    useToast: () => ({ toast: { show: jest.fn() } }),
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
    FinanceCard: ({ children }: PropsWithChildren) => <View>{children}</View>,
    FinanceHeading: () => null,
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
      return null;
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
    function Chart() {
      return null;
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
    function Chart() {
      return null;
    },
);
jest.mock(
  "@/components/finance/BudgetProgressChart",
  () =>
    function Chart() {
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
  ExpenseEntrySheet: (props: { isOpen: boolean; initial?: unknown }) => {
    mockExpenseSheet(props);
    return null;
  },
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
jest.mock(
  "@/app/(tabs)/components/dashboard/DashboardSkeleton",
  () =>
    function Skeleton() {
      return null;
    },
);

describe("analytics header filters", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date("2026-10-17T04:00:00Z"));
  });
  afterEach(() => jest.useRealTimers());

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
    fireEvent.press(screen.getByLabelText(/^Filters,/));
    fireEvent.press(screen.getByLabelText("Property: Villa"));
    fireEvent.press(screen.getByLabelText("Month tab"));
    fireEvent.press(screen.getByLabelText("Month: September 2026"));
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
    expect(screen.getByLabelText("Month: November 2026")).toBeDisabled();
    fireEvent.press(screen.getByLabelText("Previous year"));
    fireEvent.press(screen.getByLabelText("Previous year"));
    expect(screen.getByLabelText("Previous year")).toBeDisabled();
    expect(screen.getByLabelText("Month: October 2024")).toBeDisabled();
    expect(screen.getByLabelText("Month: November 2024")).not.toBeDisabled();
    fireEvent.press(screen.getByLabelText("Month: November 2024"));
    fireEvent.press(screen.getByLabelText("Property tab"));
    expect(screen.getByLabelText("Property: Villa").props.accessibilityState.checked).toBe(true);
    expect(screen.getByText("Villa · November 2024")).toBeTruthy();
    fireEvent.press(screen.getByLabelText("Month tab"));
    expect(screen.getByLabelText("Month: November 2024").props.accessibilityState.checked).toBe(true);
    fireEvent.press(screen.getByText("Apply filters"));
    expect(mockUseLandlordFinances).toHaveBeenLastCalledWith({ month: "2024-11", apartmentId: "villa" });
  });

  test("Reset changes only the draft until Apply", () => {
    const screen = render(<AnalyticsScreen />);
    fireEvent.press(screen.getByLabelText(/^Filters,/));
    fireEvent.press(screen.getByLabelText("Property: Villa"));
    fireEvent.press(screen.getByLabelText("Month tab"));
    fireEvent.press(screen.getByLabelText("Month: September 2026"));
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
  test("the finance sheets stay mounted while closed and open on press", () => {
    const screen = render(<AnalyticsScreen />);
    expect(mockLedgerSheet).toHaveBeenLastCalledWith(
      expect.objectContaining({ isOpen: false }),
    );
    expect(mockExpenseSheet).toHaveBeenLastCalledWith(
      expect.objectContaining({ isOpen: false }),
    );
    expect(mockBudgetSheet).toHaveBeenLastCalledWith(
      expect.objectContaining({ isOpen: false }),
    );
    fireEvent.press(screen.getByText("Add expense"));
    expect(mockExpenseSheet).toHaveBeenLastCalledWith(
      expect.objectContaining({ isOpen: true, initial: undefined }),
    );
    expect(mockBudgetSheet).toHaveBeenLastCalledWith(
      expect.objectContaining({ isOpen: false }),
    );
  });
});
