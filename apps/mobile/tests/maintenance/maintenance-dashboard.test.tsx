import type { ReactNode } from "react";
import { FlatList, View } from "react-native";
import { Button } from "heroui-native";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import MaintenanceHistory from "@/app/tenant/maintenance-history";
import MaintenanceHistoryList from "@/app/tenant/maintenance-history-list";

const mockDashboard = jest.fn();
const mockPush = jest.fn();
const mockRefresh = jest.fn();
jest.mock("@/hooks/maintenance-requests/useMaintenanceDashboard", () => ({ useMaintenanceDashboard: () => mockDashboard() }));
jest.mock("expo-router", () => ({ useLocalSearchParams: () => ({ apartmentId: "apartment" }), useRouter: () => ({ push: mockPush }) }));
jest.mock("@/components/layout/ScreenWrapper", () => ({ __esModule: true, default: ({ children, header }: { children: ReactNode; header?: ReactNode }) => <>{header}{children}</> }));
jest.mock("@/components/layout/StandardHeader", () => ({ __esModule: true, default: ({ rightComponent }: { rightComponent?: ReactNode }) => rightComponent ?? null }));
jest.mock("@/components/display/PullToRefresh", () => ({ PullToRefreshControl: () => null, PullToRefreshIndicator: () => null }));
jest.mock("@/hooks/useTheme", () => ({ useColors: () => ({ colors: { primary: "#376BF5", primaryLightForeground: "#2F5FE0", textSecondary: "#6C757D" } }) }));
jest.mock("@tabler/icons-react-native", () => Object.fromEntries(["IconFilter2", "IconChartBar", "IconHistory", "IconTool", "IconCalendarEvent", "IconChevronRight", "IconStack", "IconReceipt"].map((key) => [key, () => null])));
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
  return { ...stub, PressableFeedback: Object.assign(stub.Button, { Highlight: () => null }), BottomSheet: Object.assign(Sheet, { Portal: Pass, Overlay: () => null, Content: Pass, Title: Label, Description: Label }) };
});
jest.mock("@gorhom/bottom-sheet", () => ({ BottomSheetScrollView: jest.requireActual("react-native").ScrollView }));
jest.mock("react-native-safe-area-context", () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));

const request = (id: string, status = "Resolved") => ({ id, title: `Repair ${id}`, status, category: "plumbing", urgency: "low", created_at: "2026-11-04", apartment_id: "apartment", image_urls: [] });
function state(historyCount = 5) {
  return {
    requests: { data: { active: [request("active", "In Progress")], history: Array.from({ length: historyCount }, (_, i) => request(String(i))), activeLimited: false, historyLimited: false }, isPending: false, isError: false },
    overview: { data: { activeCount: 1, unpaidFees: 1250.5, hasActiveTenancy: true }, isPending: false, isError: false },
    refresh: mockRefresh, identityError: null, identityLoading: false, accountKey: "account-a",
  };
}
beforeEach(() => { jest.useFakeTimers(); jest.clearAllMocks(); mockDashboard.mockReturnValue(state()); });
afterEach(() => { act(() => { jest.runOnlyPendingTimers(); }); jest.useRealTimers(); });

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
    const heading = panel.props.children[0];
    expect(heading.props.className).toContain("flex-row");
    expect(heading.props.children[1].props.className).toContain("flex-1");
    expect(heading.props.children[1].props.numberOfLines).toBeUndefined();
  }
  expect(screen.queryByText("Active requests are pending or in progress.")).toBeNull();
  expect(screen.queryByText(/All outstanding fees for your current tenancy/)).toBeNull();
  expect(screen.queryByText(/No active tenancy/)).toBeNull();
  expect(screen.getByText("₱1,250.50").props.adjustsFontSizeToFit).toBe(true);
  expect(screen.getByText("₱1,250.50").props.className).not.toContain("bg-primary-light");
});

it("groups request titles and chips in the top row, with category and date together below", () => {
  render(<MaintenanceHistory />);
  const views = screen.UNSAFE_getAllByType(View);
  const topRows = views.filter((node) => node.props.className === "flex-row items-start justify-between gap-2");
  expect(topRows.length).toBeGreaterThan(0);
  for (const topRow of topRows) {
    const [title, badges] = topRow.props.children;
    expect(title.props.className).toContain("items-center");
    expect(title.props.children[0].props.className).not.toContain("mt-1");
    expect(title.props.children[1].props.children).toMatch(/^Repair /);
    expect(badges.props.children).toHaveLength(2);
    expect(badges.props.className).toContain("flex-wrap");
  }
  const metadataRows = views.filter((node) => node.props.className === "flex-row items-start gap-3"
    && node.props.children[0]?.props.className === "min-w-0 flex-1 flex-row items-start gap-2");
  expect(metadataRows).toHaveLength(topRows.length);
  for (const row of metadataRows) {
    expect(row.props.children).toHaveLength(2);
    for (const column of row.props.children) expect(column.props.className).toContain("flex-1");
  }
});

it("opens the dedicated history page and keeps active details navigation", () => {
  render(<MaintenanceHistory />);
  fireEvent.press(screen.getByText("See more"));
  expect(mockPush).toHaveBeenLastCalledWith({ pathname: "/tenant/maintenance-history-list", params: { apartmentId: "apartment" } });
  expect(screen.queryByText("Repair 3")).toBeNull();
  fireEvent.press(screen.getByLabelText("View details for Repair active"));
  expect(mockPush).toHaveBeenCalledWith({ pathname: "/tenant/maintenance-details", params: { requestId: "active", apartmentId: "apartment" } });
});

it("makes preview history cards tappable while retaining the active request's details button", () => {
  render(<MaintenanceHistory />);
  expect(screen.getAllByText("View details")).toHaveLength(1);
  fireEvent.press(screen.getByRole("button", { name: "View details for Repair 0" }));
  expect(mockPush).toHaveBeenLastCalledWith({ pathname: "/tenant/maintenance-details", params: { requestId: "0", apartmentId: "apartment" } });
});

it("uses compact preview history gaps without changing active list spacing", () => {
  render(<MaintenanceHistory />);
  const preview = screen.UNSAFE_getAllByType(View).filter((node) => node.props.className === "gap-2"
    && Array.isArray(node.props.children) && node.props.children[0]?.props.request?.id === "0");
  expect(preview).toHaveLength(1);
  expect(preview[0].props.children).toHaveLength(3);
  const lists = screen.UNSAFE_getAllByType(FlatList);
  const active = lists.find((node) => node.props.data[0]?.id === "active");
  expect(active?.props.contentContainerStyle.gap).toBe(12);
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

it("shows the complete loaded history on its own page with compact tappable cards", () => {
  render(<MaintenanceHistoryList />);
  for (const id of ["0", "1", "2", "3", "4"]) expect(screen.getByText(`Repair ${id}`)).toBeTruthy();
  expect(screen.queryByText("Repair active")).toBeNull();
  expect(screen.queryByText("View details")).toBeNull();
  expect(screen.UNSAFE_getAllByType(FlatList)[0].props.contentContainerStyle.gap).toBe(8);
  fireEvent.press(screen.getByRole("button", { name: "View details for Repair 4" }));
  expect(mockPush).toHaveBeenLastCalledWith({ pathname: "/tenant/maintenance-details", params: { requestId: "4", apartmentId: "apartment" } });
});

it("applies filter drafts only on Apply, preserves selections on reopen, and resets them", () => {
  const value = state();
  value.requests.data.history[1].status = "Cancelled";
  mockDashboard.mockReturnValue(value);
  render(<MaintenanceHistoryList />);
  fireEvent.press(screen.getByLabelText("Filter maintenance history"));
  fireEvent.press(screen.getByLabelText("Status: Cancelled"));
  expect(screen.getByText("Repair 0")).toBeTruthy();
  fireEvent.press(screen.getByText("Apply filters"));
  expect(screen.queryByText("Repair 0")).toBeNull();
  expect(screen.getByText("Repair 1")).toBeTruthy();
  expect(screen.getByText("1 request matching your filters")).toBeTruthy();
  fireEvent.press(screen.getByLabelText("Filter maintenance history, 1 filter applied"));
  fireEvent.press(screen.getByLabelText("Urgency: High"));
  fireEvent.press(screen.getByText("Close filters"));
  expect(screen.getByText("Repair 1")).toBeTruthy();
  fireEvent.press(screen.getByLabelText("Filter maintenance history, 1 filter applied"));
  fireEvent.press(screen.getByText("Reset"));
  fireEvent.press(screen.getByText("Apply filters"));
  expect(screen.getByText("5 requests")).toBeTruthy();
});

it("keeps date pills at their natural size in two explicit rows and applies This year", () => {
  render(<MaintenanceHistoryList />);
  fireEvent.press(screen.getByLabelText("Filter maintenance history"));
  expect(screen.getByText("This year")).toBeTruthy();
  const dateButtons = screen.UNSAFE_getAllByType(Button).filter((node) => node.props.accessibilityRole === "radio");
  expect(dateButtons).toHaveLength(4);
  const dateRows = screen.UNSAFE_getAllByType(View).filter((node) => node.props.style?.flexDirection === "row" && node.props.style?.gap === 8);
  expect(dateRows).toHaveLength(2);
  for (const row of dateRows) expect(row.props.children).toHaveLength(2);
  for (const button of dateButtons) {
    expect(button.props.style).toMatchObject({ flexShrink: 0, alignSelf: "flex-start" });
    expect(button.props.size).toBe("sm");
    expect(button.props.className).toContain("min-h-11");
    expect(button.props.className).toContain("py-3");
    expect(button.props.className).not.toContain("grow");
    expect(button.props.className).toContain("h-auto");
    expect(button.props.children.props.numberOfLines).toBe(1);
    expect(button.props.children.props.style.flexShrink).toBe(0);
    expect(button.props.children.props.className).toContain("text-center");
  }
  fireEvent.press(screen.getByLabelText("Reported date: This year"));
  fireEvent.press(screen.getByText("Apply filters"));
  expect(screen.getByLabelText("Filter maintenance history, 1 filter applied")).toBeTruthy();
});

it("shows a filtered empty state and clears filters without a new request", () => {
  render(<MaintenanceHistoryList />);
  fireEvent.press(screen.getByLabelText("Filter maintenance history"));
  fireEvent.press(screen.getByLabelText("Category: Appliances"));
  fireEvent.press(screen.getByText("Apply filters"));
  expect(screen.getByText("No requests match your filters.")).toBeTruthy();
  fireEvent.press(screen.getByText("Clear filters"));
  expect(screen.getByText("Repair 0")).toBeTruthy();
  expect(mockRefresh).not.toHaveBeenCalled();
});

it("retires filter drafts and applied filters when the account changes", () => {
  const { rerender } = render(<MaintenanceHistoryList />);
  fireEvent.press(screen.getByLabelText("Filter maintenance history"));
  fireEvent.press(screen.getByLabelText("Status: Cancelled"));
  fireEvent.press(screen.getByText("Apply filters"));
  fireEvent.press(screen.getByLabelText("Filter maintenance history, 1 filter applied"));
  mockDashboard.mockReturnValue({ ...state(), accountKey: "account-b" });
  rerender(<MaintenanceHistoryList />);
  expect(screen.queryByText("Filter maintenance history", { exact: true })).toBeNull();
  expect(screen.getByText("5 requests")).toBeTruthy();
  expect(screen.getByLabelText("Filter maintenance history")).toBeTruthy();
});

it("keeps unavailable history distinct from empty results and discloses the loaded cap", () => {
  const value = state();
  value.requests.data.historyLimited = true;
  mockDashboard.mockReturnValue(value);
  const { rerender } = render(<MaintenanceHistoryList />);
  expect(screen.getByText(/History is limited to the latest 200 requests/)).toBeTruthy();
  mockDashboard.mockReturnValue({ ...value, requests: { ...value.requests, isError: true } });
  rerender(<MaintenanceHistoryList />);
  expect(screen.getByText("Couldn't load maintenance history.")).toBeTruthy();
  expect(screen.queryByText("No resolved or cancelled requests yet.")).toBeNull();
  fireEvent.press(screen.getByText("Retry history"));
  expect(mockRefresh).toHaveBeenCalled();
});
