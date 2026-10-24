import { fireEvent, render, screen } from "@testing-library/react-native";

import LandlordPaymentsScreen from "@/app/landlord/payments";

jest.mock("heroui-native", () => jest.requireActual("../../tests/support/heroUINativeStub"));
jest.mock("@/hooks/useTheme", () => ({
  useColors: () => ({ colors: { primary: "#376BF5", gray500: "#6B7280", gray400: "#9CA3AF" }, isDark: false }),
}));

const mockPush = jest.fn();
let mockParams: { status?: string } = {};
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
  useLocalSearchParams: () => mockParams,
}));

type Payment = {
  id: string; apartment_id: string; apartment_name: string; tenant_name: string | null; amount: number;
  status: string; method: string | null; date: string; due_date: string | null; period_start: string | null; reference_id: string | null;
};

const payment = (id: string, change: Partial<Payment> = {}): Payment => ({
  id, apartment_id: "unit-a", apartment_name: "Unit A", tenant_name: "Ryan", amount: 5000, status: "paid", method: "gcash",
  date: "2026-03-05", due_date: "2026-03-05", period_start: "2026-03-01", reference_id: "APT-ABCD1234", ...change,
});

let mockData = {
  units: [{ id: "unit-a", name: "Unit A" }, { id: "unit-b", name: "Unit B" }],
  payments: [] as Payment[],
  isLoading: false,
  error: null as unknown,
  refetch: jest.fn(),
  isRefetching: false,
};
jest.mock("@/hooks/landlord", () => ({ useAllLandlordPayments: () => mockData }));

jest.mock("@/components/layout/ScreenWrapper", () => {
  const { View: V } = jest.requireActual("react-native");
  return { __esModule: true, default: ({ children, header }: { children: React.ReactNode; header?: React.ReactNode }) => <V>{header}{children}</V> };
});
jest.mock("@/components/layout/StandardHeader", () => {
  const { Text: T } = jest.requireActual("react-native");
  return { __esModule: true, default: ({ title }: { title: string }) => <T>{title}</T> };
});
jest.mock("@/components/landlord-payments/LandlordPaymentsSkeleton", () => {
  const { Text: T } = jest.requireActual("react-native");
  return { __esModule: true, default: () => <T>payments skeleton</T> };
});
jest.mock("@/components/display/EmptyState", () => {
  const { Text: T } = jest.requireActual("react-native");
  return { __esModule: true, default: ({ title }: { title: string }) => <T>{title}</T> };
});

// Selects and tabs are exercised through their props: each option is a button.
jest.mock("@/components/finance/FinanceSelect", () => {
  const { Pressable: P, Text: T, View: V } = jest.requireActual("react-native");
  return {
    __esModule: true,
    default: ({ label, value, options, onChange, searchable }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void; searchable?: boolean }) => (
      <V accessibilityLabel={`${label} select`} testID={`select-${label}`}>
        <T>{`${label}: ${options.find((o) => o.value === value)?.label}${searchable ? " (searchable)" : ""}`}</T>
        {options.map((o) => <P key={o.value} accessibilityLabel={`${label} option ${o.label}`} onPress={() => onChange(o.value)}><T>{o.label}</T></P>)}
      </V>
    ),
  };
});
jest.mock("@/components/buttons/DropdownButton", () => {
  const { Pressable: P, Text: T, View: V } = jest.requireActual("react-native");
  return {
    __esModule: true,
    default: ({ options, value, onSelect, align, width }: { options: string[]; value: string; onSelect: (v: string) => void; align?: string; width?: unknown }) => (
      <V>
        <T>{`status menu: ${value} (${align}, ${String(width)})`}</T>
        {options.map((o) => <P key={o} accessibilityLabel={`status option ${o}`} onPress={() => onSelect(o)}><T>{o}</T></P>)}
      </V>
    ),
  };
});
jest.mock("@/components/landlord-payments/PaymentFilterSheet", () => {
  const { Pressable: P, Text: T, View: V } = jest.requireActual("react-native");
  return {
    __esModule: true,
    default: ({ isOpen, onOpenChange, yearOptions, year, onYearChange, sortOptions, sort, onSortChange, onReset, isChanged }: {
      isOpen: boolean; onOpenChange: (open: boolean) => void; yearOptions: string[]; year: string; onYearChange: (v: string) => void;
      sortOptions: string[]; sort: string; onSortChange: (v: string) => void; onReset: () => void; isChanged: boolean;
    }) => (
      <V>
        <T>{`sheet: ${isOpen ? "open" : "closed"} year=${year} sort=${sort} changed=${String(isChanged)}`}</T>
        {yearOptions.map((o) => <P key={o} accessibilityLabel={`sheet year ${o}`} onPress={() => onYearChange(o)}><T>{o}</T></P>)}
        {sortOptions.map((o) => <P key={o} accessibilityLabel={`sheet sort ${o}`} onPress={() => onSortChange(o)}><T>{o}</T></P>)}
        <P accessibilityLabel="sheet reset" onPress={onReset}><T>reset</T></P>
        <P accessibilityLabel="sheet close" onPress={() => onOpenChange(false)}><T>close</T></P>
      </V>
    ),
  };
});
jest.mock("../../app/landlord/manage-apartment/[apartmentId]/components/PaymentHistoryCard", () => {
  const { Pressable: P, Text: T } = jest.requireActual("react-native");
  return {
    __esModule: true,
    default: ({ month, unitName, tenantName, onPress, amount }: { month: string; unitName?: string | null; tenantName?: string | null; onPress: () => void; amount: number }) => (
      <P accessibilityLabel={`payment ${month} ${amount}`} onPress={onPress}>
        <T>{`${month}|${unitName ?? "no-unit"}|${tenantName ?? ""}`}</T>
      </P>
    ),
  };
});
jest.mock("@/app/(tabs)/components/dashboard/DashboardStatTile", () => {
  const { Pressable: P, Text: T } = jest.requireActual("react-native");
  return {
    __esModule: true,
    default: ({ label, value, caption, onPress }: { label: string; value: string; caption?: string; onPress?: () => void }) => (
      <P accessibilityLabel={`tile ${label}`} onPress={onPress} disabled={!onPress}><T>{`${label}: ${value} (${caption})`}</T></P>
    ),
  };
});

beforeEach(() => {
  mockPush.mockClear();
  mockParams = {};
  mockData = { ...mockData, isLoading: false, error: null, isRefetching: false, refetch: jest.fn(), payments: [] };
});

const rows = () => [
  payment("old", { date: "2025-01-05", due_date: "2025-01-05", period_start: "2025-01-01", amount: 4000 }),
  payment("new", { amount: 6000 }),
  payment("cash", { status: "pending", method: "cash", amount: 7000, apartment_id: "unit-b", apartment_name: "Unit B", date: "2026-04-02", due_date: "2026-04-05", period_start: "2026-04-01" }),
  payment("declined", { status: "rejected", amount: 100, date: "2026-02-01", due_date: "2026-02-05", period_start: "2026-02-01" }),
];

describe("landlord Payments screen", () => {
  it("shows loading, an error with Try Again, and an empty state for a landlord without units", () => {
    mockData.isLoading = true;
    const loading = render(<LandlordPaymentsScreen />);
    // The skeleton stands in for the whole body; no figures or spinner.
    expect(loading.getByText("payments skeleton")).toBeTruthy();
    expect(loading.getByText("Payments")).toBeTruthy();
    expect(loading.queryByText(/Collected/)).toBeNull();
    loading.unmount();

    mockData.isLoading = false;
    mockData.error = new Error("boom");
    const failed = render(<LandlordPaymentsScreen />);
    fireEvent.press(failed.getByText("Try Again"));
    expect(mockData.refetch).toHaveBeenCalled();
    failed.unmount();

    mockData.error = null;
    mockData = { ...mockData, units: [] };
    render(<LandlordPaymentsScreen />);
    expect(screen.getByText("No units yet")).toBeTruthy();
    mockData = { ...mockData, units: [{ id: "unit-a", name: "Unit A" }, { id: "unit-b", name: "Unit B" }] };
  });

  it("lists every unit's payments by default, naming the unit, with a searchable All apartments picker", () => {
    mockData.payments = rows();
    render(<LandlordPaymentsScreen />);
    expect(screen.getByText("Apartment: All apartments (searchable)")).toBeTruthy();
    expect(screen.getByText("April 2026|Unit B|Ryan")).toBeTruthy();
    expect(screen.getByText("March 2026|Unit A|Ryan")).toBeTruthy();
    expect(screen.getByText(/^status menu: All payments \(start, trigger\)/)).toBeTruthy();
  });

  it("totals only paid money and shows the cash waiting for the landlord", () => {
    mockData.payments = rows();
    render(<LandlordPaymentsScreen />);
    expect(screen.getByText(/^Collected: ₱\s?10,000/)).toBeTruthy();
    expect(screen.getByText(/^Cash to confirm: ₱\s?7,000 \(1 payment waiting\)/)).toBeTruthy();
    expect(screen.getByText(/^Declined or failed: 1/)).toBeTruthy();
    expect(screen.getByLabelText(/Needs attention: 1 cash payment to confirm/)).toBeTruthy();
  });

  it("narrows to one unit, hides the unit line, and its figures follow", () => {
    mockData.payments = rows();
    render(<LandlordPaymentsScreen />);
    fireEvent.press(screen.getByLabelText("Apartment option Unit B"));
    expect(screen.getByText("Apartment: Unit B (searchable)")).toBeTruthy();
    expect(screen.getByText("April 2026|no-unit|Ryan")).toBeTruthy();
    expect(screen.queryByText(/March 2026/)).toBeNull();
    expect(screen.getByText(/^Collected: ₱\s?0\b/)).toBeTruthy();
  });

  it("filters by status through the menu, opens on the status from the Dashboard link, and the cash card jumps to Pending", () => {
    mockData.payments = rows();
    mockParams = { status: "pending" };
    const first = render(<LandlordPaymentsScreen />);
    expect(screen.getByText(/^status menu: Pending/)).toBeTruthy();
    expect(screen.getByText("April 2026|Unit B|Ryan")).toBeTruthy();
    expect(screen.queryByText(/March 2026/)).toBeNull();
    first.unmount();

    mockParams = { status: "not-a-status" };
    render(<LandlordPaymentsScreen />);
    expect(screen.getByText(/^status menu: All payments/)).toBeTruthy();
    fireEvent.press(screen.getByLabelText(/Needs attention/));
    expect(screen.getByText(/^status menu: Pending/)).toBeTruthy();
    fireEvent.press(screen.getByLabelText("status option Declined"));
    expect(screen.getByText("February 2026|Unit A|Ryan")).toBeTruthy();
    expect(screen.queryByText(/April 2026/)).toBeNull();
  });

  it("has no tabs and no year or sort selects on the screen itself", () => {
    mockData.payments = rows();
    render(<LandlordPaymentsScreen />);
    expect(screen.queryByText(/^tab:/)).toBeNull();
    expect(screen.queryByTestId("select-Year")).toBeNull();
    expect(screen.queryByTestId("select-Sort")).toBeNull();
  });

  it("opens the filter sheet from the filter icon, with year and sort inside it", () => {
    mockData.payments = rows();
    render(<LandlordPaymentsScreen />);
    expect(screen.getByText(/^sheet: closed year=All years sort=Newest changed=false/)).toBeTruthy();
    fireEvent.press(screen.getByLabelText("Filters"));
    expect(screen.getByText(/^sheet: open/)).toBeTruthy();
    fireEvent.press(screen.getByLabelText("sheet close"));
    expect(screen.getByText(/^sheet: closed/)).toBeTruthy();
  });

  it("filters by year through the sheet, badges the icon, and Reset puts it back", () => {
    mockData.payments = rows();
    render(<LandlordPaymentsScreen />);
    fireEvent.press(screen.getByLabelText("sheet year 2025"));
    expect(screen.getByText("January 2025|Unit A|Ryan")).toBeTruthy();
    expect(screen.queryByText(/March 2026/)).toBeNull();
    expect(screen.getByText(/year=2025 sort=Newest changed=true/)).toBeTruthy();
    expect(screen.getByLabelText("Filters, 1 active")).toBeTruthy();

    fireEvent.press(screen.getByLabelText("sheet sort Oldest"));
    expect(screen.getByLabelText("Filters, 2 active")).toBeTruthy();

    fireEvent.press(screen.getByLabelText("sheet reset"));
    expect(screen.getByLabelText("Filters")).toBeTruthy();
    expect(screen.getByText(/year=All years sort=Newest changed=false/)).toBeTruthy();
    expect(screen.getByText("March 2026|Unit A|Ryan")).toBeTruthy();
  });

  it("sorts the list oldest first through the sheet", () => {
    mockData.payments = rows();
    render(<LandlordPaymentsScreen />);
    const order = () => screen.getAllByLabelText(/^payment /).map((node) => node.props.accessibilityLabel);
    expect(order()[0]).toBe("payment April 2026 7000");
    fireEvent.press(screen.getByLabelText("sheet sort Oldest"));
    expect(order()[0]).toBe("payment January 2025 4000");
  });

  it("offers Clear filters when the status and year match nothing", () => {
    mockData.payments = rows();
    render(<LandlordPaymentsScreen />);
    fireEvent.press(screen.getByLabelText("sheet year 2025"));
    fireEvent.press(screen.getByLabelText("status option Pending"));
    expect(screen.getByText("No payments found")).toBeTruthy();
    fireEvent.press(screen.getByText("Clear filters"));
    expect(screen.getByText("January 2025|Unit A|Ryan")).toBeTruthy();
    expect(screen.getByText(/^status menu: All payments/)).toBeTruthy();
  });

  it("opens that payment's receipt for its own unit", () => {
    mockData.payments = rows();
    render(<LandlordPaymentsScreen />);
    fireEvent.press(screen.getByLabelText("payment April 2026 7000"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/landlord/manage-apartment/[apartmentId]/payment-history/[paymentId]",
      params: { apartmentId: "unit-b", paymentId: "cash" },
    });
  });

  it("shows a bounded page and loads more on demand", () => {
    mockData.payments = Array.from({ length: 35 }, (_, i) => payment(`p${i}`, { date: `2026-03-${String((i % 28) + 1).padStart(2, "0")}`, amount: 1000 + i }));
    render(<LandlordPaymentsScreen />);
    expect(screen.getAllByLabelText(/^payment /)).toHaveLength(30);
    fireEvent.press(screen.getByText("Show more (5 left)"));
    expect(screen.getAllByLabelText(/^payment /)).toHaveLength(35);
  });

  it("says so when there are no payments yet", () => {
    render(<LandlordPaymentsScreen />);
    expect(screen.getByText("No payments yet")).toBeTruthy();
    expect(screen.queryByText("Clear filters")).toBeNull();
  });
});
