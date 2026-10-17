import type { PropsWithChildren, ReactNode } from "react";
import type { PressableProps, TextProps } from "react-native";
import { fireEvent, render, within } from "@testing-library/react-native";
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
const mockExpenseSheet = jest.fn((_props: unknown) => null);
const mockBudgetSheet = jest.fn((_props: unknown) => null);
const mockLedgerSheet = jest.fn((_props: unknown) => null);

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
  const { Pressable, Text, View } = jest.requireActual("react-native");
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
  function SheetContent({ children }: PropsWithChildren) {
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
    return visible ? <View>{children}</View> : null;
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
    FinanceTabs: () => null,
    MoneyRow: () => null,
    FinanceSelect: ({
      label,
      value,
      options,
      onChange,
    }: {
      label: string;
      value: string;
      options: { value: string; label: string }[];
      onChange: (value: string) => void;
    }) => (
      <View>
        <Text>
          {label}: {value}
        </Text>
        {options.map((option) => (
          <Pressable
            key={option.value}
            accessibilityLabel={`${label}: ${option.label}`}
            onPress={() => onChange(option.value)}
          >
            <Text>{option.label}</Text>
          </Pressable>
        ))}
      </View>
    ),
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
    expect(screen.queryByText("Property: all")).toBeNull();
    expect(screen.queryByText("Month: 2026-10")).toBeNull();
    const button = screen.getByLabelText(
      "Filters, All properties, October 2026",
    );
    expect(
      within(screen.getByTestId("standard-header")).getByLabelText(
        "Filters, All properties, October 2026",
      ),
    ).toBeTruthy();
    fireEvent.press(button);
    expect(screen.getByText("Property: all")).toBeTruthy();
    expect(screen.getByText("Month: 2026-10")).toBeTruthy();
  });

  test("the sheet is mounted closed before the first header press", () => {
    const screen = render(<AnalyticsScreen />);
    expect(mockSheetOpenStates).toHaveBeenNthCalledWith(1, false);
    fireEvent.press(screen.getByLabelText(/^Filters,/));
    expect(mockSheetOpenStates).toHaveBeenLastCalledWith(true);
    expect(screen.getByText("Apply filters")).toBeTruthy();
  });

  test("both filters apply together and remain selected when reopened", () => {
    const screen = render(<AnalyticsScreen />);
    fireEvent.press(screen.getByLabelText(/^Filters,/));
    fireEvent.press(screen.getByLabelText("Property: Villa"));
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
    expect(screen.getByText("Property: villa")).toBeTruthy();
    expect(screen.getByText("Month: 2026-09")).toBeTruthy();
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
    expect(screen.getByText("Property: all")).toBeTruthy();
  });

  test("dismissing the sheet discards changes and it can open again", () => {
    const screen = render(<AnalyticsScreen />);
    fireEvent.press(screen.getByLabelText(/^Filters,/));
    fireEvent.press(screen.getByLabelText("Property: House"));
    fireEvent.press(screen.getByLabelText("Dismiss filters"));
    expect(mockSheetOpenStates).toHaveBeenLastCalledWith(false);
    expect(screen.queryByText("Apply filters")).toBeNull();
    fireEvent.press(screen.getByLabelText(/^Filters,/));
    expect(screen.getByText("Property: all")).toBeTruthy();
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
