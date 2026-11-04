import type { ReactNode } from "react";
import { View } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import MaintenanceHistory from "@/app/tenant/maintenance-history";

const mockDashboard = jest.fn();
const mockPush = jest.fn();
const mockRefresh = jest.fn();
jest.mock("@/hooks/maintenance-requests/useMaintenanceDashboard", () => ({ useMaintenanceDashboard: () => mockDashboard() }));
jest.mock("expo-router", () => ({ useLocalSearchParams: () => ({ apartmentId: "apartment" }), useRouter: () => ({ push: mockPush }) }));
jest.mock("@/components/layout/ScreenWrapper", () => ({ __esModule: true, default: ({ children }: { children: ReactNode }) => children }));
jest.mock("@/components/layout/StandardHeader", () => () => null);
jest.mock("@/components/display/PullToRefresh", () => ({ PullToRefreshControl: () => null, PullToRefreshIndicator: () => null }));
jest.mock("@/hooks/useTheme", () => ({ useColors: () => ({ colors: { primary: "#376BF5", primaryLightForeground: "#2F5FE0", textSecondary: "#6C757D" } }) }));
jest.mock("@tabler/icons-react-native", () => Object.fromEntries(["IconChartBar", "IconHistory", "IconTool", "IconCalendarEvent", "IconChevronRight", "IconStack", "IconReceipt"].map((key) => [key, () => null])));
jest.mock("@/hooks/maintenance-requests", () => {
  const style = { textColor: "#111111", backgroundColor: "#FFFFFF", borderColor: "#CCCCCC" };
  return {
    useMaintenanceRequestStatusStyles: () => ({ Pending: style, "In Progress": style, Resolved: style, Cancelled: style }),
    useMaintenanceRequestUrgencyStyles: () => ({ low: style, medium: style, high: style }),
  };
});
jest.mock("heroui-native", () => {
  const stub = jest.requireActual("../support/heroUINativeStub");
  const { View, Text } = jest.requireActual("react-native");
  const Pass = ({ children }: { children: ReactNode }) => <View>{children}</View>;
  const Label = ({ children }: { children: ReactNode }) => <Text>{children}</Text>;
  const Sheet = ({ children, isOpen }: { children: ReactNode; isOpen: boolean }) => isOpen ? <View>{children}</View> : null;
  return { ...stub, BottomSheet: Object.assign(Sheet, { Portal: Pass, Overlay: () => null, Content: Pass, Title: Label, Description: Label }) };
});
jest.mock("@gorhom/bottom-sheet", () => ({ BottomSheetFlatList: jest.requireActual("react-native").FlatList }));
jest.mock("react-native-safe-area-context", () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));

const request = (id: string, status = "Resolved") => ({ id, title: `Repair ${id}`, status, category: "plumbing", urgency: "low", created_at: "2026-11-04", apartment_id: "apartment", image_urls: [] });
function state(historyCount = 5) {
  return {
    requests: { data: { active: [request("active", "In Progress")], history: Array.from({ length: historyCount }, (_, i) => request(String(i))), activeLimited: false, historyLimited: false }, isPending: false, isError: false },
    overview: { data: { activeCount: 1, unpaidFees: 1250.5, hasActiveTenancy: true }, isPending: false, isError: false },
    refresh: mockRefresh, identityError: null, identityLoading: false, accountKey: "account-a",
  };
}
beforeEach(() => { jest.clearAllMocks(); mockDashboard.mockReturnValue(state()); });

it("stacks Active Requests, Overview and History in that order with three history previews", () => {
  render(<MaintenanceHistory />);
  expect(screen.getAllByRole("header").map((node) => node.props.children)).toEqual(["Active maintenance requests", "Overview", "Maintenance request history"]);
  for (const id of ["active", "0", "1", "2"]) expect(screen.getByText(`Repair ${id}`)).toBeTruthy();
  expect(screen.queryByText("Repair 3")).toBeNull();
  expect(screen.getByText("₱1,250.50")).toBeTruthy();
  expect(screen.getByText("See more")).toBeTruthy();
});

it("places equal-width overview panels in one row without descriptions", () => {
  render(<MaintenanceHistory />);
  const rows = screen.UNSAFE_getAllByType(View).filter((node) => node.props.className === "flex-row items-stretch gap-3");
  expect(rows).toHaveLength(1);
  const row = rows[0];
  expect(row.props.children).toHaveLength(2);
  for (const panel of row.props.children) {
    expect(panel.props.className).toContain("flex-1");
    expect(panel.props.className).toContain("min-w-0");
  }
  expect(screen.queryByText("Active requests are pending or in progress.")).toBeNull();
  expect(screen.queryByText(/All outstanding fees for your current tenancy/)).toBeNull();
  expect(screen.queryByText(/No active tenancy/)).toBeNull();
  expect(screen.getByText("₱1,250.50").props.adjustsFontSizeToFit).toBe(true);
});

it("opens only older rows in the sheet, supports closing, and keeps details navigation", () => {
  render(<MaintenanceHistory />);
  fireEvent.press(screen.getByText("See more"));
  expect(screen.getByText("More maintenance history")).toBeTruthy();
  expect(screen.getByText("Repair 3")).toBeTruthy();
  expect(screen.getAllByText("Repair 0")).toHaveLength(1);
  fireEvent.press(screen.getByLabelText("Close maintenance history"));
  expect(screen.queryByText("Repair 3")).toBeNull();
  fireEvent.press(screen.getByLabelText("View details for Repair active"));
  expect(mockPush).toHaveBeenCalledWith({ pathname: "/tenant/maintenance-details", params: { requestId: "active", apartmentId: "apartment" } });
});

it.each([0, 1, 3])("hides See more with %i history rows", (count) => {
  mockDashboard.mockReturnValue(state(count));
  render(<MaintenanceHistory />);
  expect(screen.queryByText("See more")).toBeNull();
});

it("keeps failures separate from empty results and offers retry without false zero totals", () => {
  const value = state();
  mockDashboard.mockReturnValue({ ...value, requests: { ...value.requests, isError: true }, overview: { ...value.overview, isError: true } });
  render(<MaintenanceHistory />);
  expect(screen.getByText("Couldn't load maintenance requests.")).toBeTruthy();
  expect(screen.queryByText(/No active maintenance requests/)).toBeNull();
  expect(screen.queryByText("₱1,250.50")).toBeNull();
  expect(screen.queryByText("See more")).toBeNull();
  fireEvent.press(screen.getByText("Retry requests"));
  expect(mockRefresh).toHaveBeenCalled();
});

it("closes the old account's sheet on an account change", () => {
  const { rerender } = render(<MaintenanceHistory />);
  fireEvent.press(screen.getByText("See more"));
  mockDashboard.mockReturnValue({ ...state(), accountKey: "account-b" });
  rerender(<MaintenanceHistory />);
  expect(screen.queryByText("More maintenance history")).toBeNull();
  mockDashboard.mockReturnValue(state());
  rerender(<MaintenanceHistory />);
  expect(screen.queryByText("More maintenance history")).toBeNull();
});

it("shows honest empty states while keeping the overview available", () => {
  const value = state(0);
  mockDashboard.mockReturnValue({ ...value, requests: { ...value.requests, data: { ...value.requests.data, active: [] } } });
  render(<MaintenanceHistory />);
  expect(screen.getByText(/No active maintenance requests/)).toBeTruthy();
  expect(screen.getByText("No resolved or cancelled requests yet.")).toBeTruthy();
  expect(screen.getByText("₱1,250.50")).toBeTruthy();
});

it("does not show successful empty states or zero totals while initial reads are pending", () => {
  const value = state(0);
  mockDashboard.mockReturnValue({ ...value, requests: { isPending: true }, overview: { isPending: true } });
  render(<MaintenanceHistory />);
  expect(screen.queryByText(/No active maintenance requests/)).toBeNull();
  expect(screen.queryByText("No resolved or cancelled requests yet.")).toBeNull();
  expect(screen.queryByText("₱0.00")).toBeNull();
});
