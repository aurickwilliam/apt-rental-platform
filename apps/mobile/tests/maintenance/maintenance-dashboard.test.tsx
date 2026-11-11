import type { ReactNode } from "react";
import { FlatList, ScrollView, View } from "react-native";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import MaintenanceHistory from "@/app/tenant/maintenance-history";
import { findAllInTree } from "../support/testTraversal";
import { spyOnClassComponent } from "../support/classComponentProps";
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
  // stub* props expose the composite props the tests assert on (RNTL v14 sees host nodes only).
  const Sheet = ({ children, isOpen, onOpenChange }: { children: ReactNode; isOpen: boolean; onOpenChange?: (open: boolean) => void }) =>
    <View {...({ stubOnOpenChange: onOpenChange } as object)}>{isOpen ? children : null}</View>;
  const SheetContent = ({ children, enableContentPanningGesture }: { children: ReactNode; enableContentPanningGesture?: boolean }) =>
    <View {...({ stubPanning: enableContentPanningGesture } as object)}>{children}</View>;
  return { ...stub, Select: jest.requireActual("../support/maintenanceSelectStub").default, PressableFeedback: Object.assign(stub.Button, { Highlight: () => null }), BottomSheet: Object.assign(Sheet, { Portal: Pass, Overlay: () => null, Content: SheetContent, Title: Label, Description: Label }) };
});
jest.mock("@gorhom/bottom-sheet", () => ({ BottomSheetScrollView: jest.requireActual("react-native").ScrollView }));
jest.mock("react-native-gesture-handler", () => ({ ScrollView: jest.requireActual("react-native").ScrollView }));
jest.mock("react-native-safe-area-context", () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));

const request = (id: string, status = "Resolved") => ({ id, title: `Repair ${id}`, status, category: "plumbing", urgency: "low", created_at: "2026-11-04", apartment_id: "apartment", image_urls: [] });
function state(historyCount = 5) {
  return {
    requests: { data: { active: [request("active", "In Progress")], history: Array.from({ length: historyCount }, (_, i) => request(String(i))), activeLimited: false, historyLimited: false }, isPending: false, isError: false },
    overview: { data: { activeCount: 1, unpaidFees: 1250.5, hasActiveTenancy: true }, isPending: false, isError: false },
    refresh: mockRefresh, identityError: null, identityLoading: false, accountKey: "account-a",
  };
}
let flatList: ReturnType<typeof spyOnClassComponent>;
beforeEach(() => { jest.useFakeTimers(); jest.clearAllMocks(); mockDashboard.mockReturnValue(state()); flatList = spyOnClassComponent(FlatList); });
afterEach(async () => { flatList.restore(); await act(() => { jest.runOnlyPendingTimers(); }); jest.useRealTimers(); });

it("stacks Active Requests, Overview and History in that order with three history previews", async () => {
  await render(<MaintenanceHistory />);
  expect(screen.getAllByRole("header").map((node) => node.props.children)).toEqual(["Active maintenance requests", "Overview", "Maintenance request history"]);
  for (const id of ["active", "0", "1", "2"]) expect(screen.getByText(`Repair ${id}`)).toBeTruthy();
  expect(screen.queryByText("Repair 3")).toBeNull();
  expect(screen.getByText("₱1,250.50")).toBeTruthy();
  expect(screen.getByText("See more")).toBeTruthy();
});

it("places equal-width overview panels in one row without descriptions", async () => {
  await render(<MaintenanceHistory />);
  const rows = findAllInTree(screen.root!, (n) => String(n.type) === "View").filter((node) => node.props.className === "flex-row items-stretch gap-3");
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

it("groups request titles and chips in the top row, with category and date together below", async () => {
  await render(<MaintenanceHistory />);
  const views = findAllInTree(screen.root!, (n) => String(n.type) === "View");
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

it("opens the dedicated history page and keeps active details navigation", async () => {
  await render(<MaintenanceHistory />);
  await fireEvent.press(screen.getByText("See more"));
  expect(mockPush).toHaveBeenLastCalledWith({ pathname: "/tenant/maintenance-history-list", params: { apartmentId: "apartment" } });
  expect(screen.queryByText("Repair 3")).toBeNull();
  await fireEvent.press(screen.getByLabelText("View details for Repair active"));
  expect(mockPush).toHaveBeenCalledWith({ pathname: "/tenant/maintenance-details", params: { requestId: "active", apartmentId: "apartment" } });
});

it.each(["Pending", "In Progress"])("makes %s and preview history cards tappable without separate details buttons", async (status) => {
  const value = state();
  value.requests.data.active[0].status = status;
  mockDashboard.mockReturnValue(value);
  await render(<MaintenanceHistory />);
  expect(screen.queryByText("View details")).toBeNull();
  await fireEvent.press(screen.getByRole("button", { name: "View details for Repair active" }));
  expect(mockPush).toHaveBeenLastCalledWith({ pathname: "/tenant/maintenance-details", params: { requestId: "active", apartmentId: "apartment" } });
  await fireEvent.press(screen.getByRole("button", { name: "View details for Repair 0" }));
  expect(mockPush).toHaveBeenLastCalledWith({ pathname: "/tenant/maintenance-details", params: { requestId: "0", apartmentId: "apartment" } });
});

it("uses compact preview history gaps without changing active list spacing", async () => {
  await render(<MaintenanceHistory />);
  const preview = findAllInTree(screen.root!, (n) => String(n.type) === "View").filter((node) => node.props.className === "gap-2"
    && Array.isArray(node.props.children) && node.props.children[0]?.props.request?.id === "0");
  expect(preview).toHaveLength(1);
  expect(preview[0].props.children).toHaveLength(3);
  const active = flatList.latestPropsPerInstance().find((props) => props.data[0]?.id === "active");
  expect(active?.contentContainerStyle.gap).toBe(12);
});

it.each([0, 1, 3])("hides See more with %i history rows", async (count) => {
  mockDashboard.mockReturnValue(state(count));
  await render(<MaintenanceHistory />);
  expect(screen.queryByText("See more")).toBeNull();
});

it("keeps failures separate from empty results and offers retry without false zero totals", async () => {
  const value = state();
  mockDashboard.mockReturnValue({ ...value, requests: { ...value.requests, isError: true }, overview: { ...value.overview, isError: true } });
  await render(<MaintenanceHistory />);
  expect(screen.getByText("Couldn't load maintenance requests.")).toBeTruthy();
  expect(screen.queryByText(/No active maintenance requests/)).toBeNull();
  expect(screen.queryByText("₱1,250.50")).toBeNull();
  expect(screen.queryByText("See more")).toBeNull();
  await fireEvent.press(screen.getByText("Retry requests"));
  expect(mockRefresh).toHaveBeenCalled();
});

it("shows honest empty states while keeping the overview available", async () => {
  const value = state(0);
  mockDashboard.mockReturnValue({ ...value, requests: { ...value.requests, data: { ...value.requests.data, active: [] } } });
  await render(<MaintenanceHistory />);
  expect(screen.getByText(/No active maintenance requests/)).toBeTruthy();
  expect(screen.getByText("No resolved or cancelled requests yet.")).toBeTruthy();
  expect(screen.getByText("₱1,250.50")).toBeTruthy();
});

it("does not show successful empty states or zero totals while initial reads are pending", async () => {
  const value = state(0);
  mockDashboard.mockReturnValue({ ...value, requests: { isPending: true }, overview: { isPending: true } });
  await render(<MaintenanceHistory />);
  expect(screen.queryByText(/No active maintenance requests/)).toBeNull();
  expect(screen.queryByText("No resolved or cancelled requests yet.")).toBeNull();
  expect(screen.queryByText("₱0.00")).toBeNull();
});

it("shows the complete loaded history on its own page with compact tappable cards", async () => {
  await render(<MaintenanceHistoryList />);
  for (const id of ["0", "1", "2", "3", "4"]) expect(screen.getByText(`Repair ${id}`)).toBeTruthy();
  expect(screen.queryByText("Repair active")).toBeNull();
  expect(screen.queryByText("View details")).toBeNull();
  expect(flatList.latestPropsPerInstance()[0].contentContainerStyle.gap).toBe(8);
  await fireEvent.press(screen.getByRole("button", { name: "View details for Repair 4" }));
  expect(mockPush).toHaveBeenLastCalledWith({ pathname: "/tenant/maintenance-details", params: { requestId: "4", apartmentId: "apartment" } });
});

it("applies filter drafts only on Apply, preserves selections on reopen, and resets them", async () => {
  const value = state();
  value.requests.data.history[1].status = "Cancelled";
  mockDashboard.mockReturnValue(value);
  await render(<MaintenanceHistoryList />);
  await fireEvent.press(screen.getByLabelText("Filter maintenance history"));
  await fireEvent.press(screen.getByLabelText("Status: Cancelled"));
  expect(screen.getByText("Repair 0")).toBeTruthy();
  await fireEvent.press(screen.getByText("Apply filters"));
  expect(screen.queryByText("Repair 0")).toBeNull();
  expect(screen.getByText("Repair 1")).toBeTruthy();
  expect(screen.getByText("1 request matching your filters")).toBeTruthy();
  await fireEvent.press(screen.getByLabelText("Filter maintenance history, 1 filter applied"));
  await fireEvent.press(screen.getByLabelText("Urgency: High"));
  expect(screen.queryByText("Close filters")).toBeNull();
  await act(() => { screen.container.queryAll((n) => n.props.stubOnOpenChange)[0].props.stubOnOpenChange(false); });
  expect(screen.getByText("Repair 1")).toBeTruthy();
  await fireEvent.press(screen.getByLabelText("Filter maintenance history, 1 filter applied"));
  await fireEvent.press(screen.getByText("Reset"));
  await fireEvent.press(screen.getByText("Apply filters"));
  expect(screen.getByText("5 requests")).toBeTruthy();
});

it("uses a single-select date dropdown with a full This year label", async () => {
  await render(<MaintenanceHistoryList />);
  await fireEvent.press(screen.getByLabelText("Filter maintenance history"));
  expect(screen.queryByText("This year")).toBeNull();
  await fireEvent.press(screen.getByLabelText("Reported date"));
  expect(screen.getByText("This year")).toBeTruthy();
  expect(screen.getAllByRole("radio")).toHaveLength(4);
  await fireEvent.press(screen.getByLabelText("Reported date: This year"));
  expect(screen.queryByLabelText("Reported date: This year")).toBeNull();
  expect(screen.getByText("This year")).toBeTruthy();
  await fireEvent.press(screen.getByText("Apply filters"));
  expect(screen.getByLabelText("Filter maintenance history, 1 filter applied")).toBeTruthy();
});

it("shows a filtered empty state and clears filters without a new request", async () => {
  await render(<MaintenanceHistoryList />);
  await fireEvent.press(screen.getByLabelText("Filter maintenance history"));
  await fireEvent.press(screen.getByLabelText("Category"));
  await fireEvent.press(screen.getByLabelText("Category: Appliances"));
  await fireEvent.press(screen.getByLabelText("Dismiss dropdown"));
  await fireEvent.press(screen.getByText("Apply filters"));
  expect(screen.getByText("No requests match your filters.")).toBeTruthy();
  await fireEvent.press(screen.getByText("Clear filters"));
  expect(screen.getByText("Repair 0")).toBeTruthy();
  expect(mockRefresh).not.toHaveBeenCalled();
});

it("keeps Category multi-select and resets both dropdowns with the rest of the draft", async () => {
  await render(<MaintenanceHistoryList />);
  await fireEvent.press(screen.getByLabelText("Filter maintenance history"));
  await fireEvent.press(screen.getByLabelText("Category"));
  await fireEvent.press(screen.getByLabelText("Category: Appliances"));
  await fireEvent.press(screen.getByLabelText("Category: Electrical & Lighting"));
  expect(screen.getByLabelText("Category: Appliances").props.accessibilityState.checked).toBe(true);
  expect(screen.getByLabelText("Category: Electrical & Lighting").props.accessibilityState.checked).toBe(true);
  await fireEvent.press(screen.getByLabelText("Dismiss dropdown"));
  await fireEvent.press(screen.getByLabelText("Reported date"));
  await fireEvent.press(screen.getByLabelText("Reported date: Last 7 days"));
  await fireEvent.press(screen.getByText("Reset"));
  expect(screen.getByText("All categories")).toBeTruthy();
  expect(screen.getByText("Any time")).toBeTruthy();
  await fireEvent.press(screen.getByText("Apply filters"));
  expect(screen.getByLabelText("Filter maintenance history")).toBeTruthy();
});

it("dismisses any open dropdown with the filter sheet and reseeds the next opening", async () => {
  await render(<MaintenanceHistoryList />);
  await fireEvent.press(screen.getByLabelText("Filter maintenance history"));
  await fireEvent.press(screen.getByLabelText("Category"));
  await fireEvent.press(screen.getByLabelText("Category: Appliances"));
  await act(() => { screen.container.queryAll((n) => n.props.stubOnOpenChange)[0].props.stubOnOpenChange(false); });
  await fireEvent.press(screen.getByLabelText("Filter maintenance history"));
  expect(screen.queryByLabelText("Category: Appliances")).toBeNull();
  expect(screen.getByText("All categories")).toBeTruthy();
});

it("lets the Category menu own scrolling and restores sheet scrolling after dismissal", async () => {
  await render(<MaintenanceHistoryList />);
  await fireEvent.press(screen.getByLabelText("Filter maintenance history"));
  await fireEvent.press(screen.getByLabelText("Category"));
  const scrolls = screen.container.queryAll((n) => String(n.type) === "RCTScrollView");
  const menu = scrolls.find((node) => node.props.style?.maxHeight === 260);
  expect(menu).toBeDefined();
  expect(menu?.props.style.maxHeight).toBe(260);
  expect(scrolls.some((node) => node.props.scrollEnabled === false)).toBe(true);
  expect(screen.container.queryAll((n) => n.props.stubPanning !== undefined)[0].props.stubPanning).toBe(false);
  await fireEvent.press(screen.getByLabelText("Category: Safety & Security"));
  expect(screen.getByLabelText("Category: Safety & Security").props.accessibilityState.checked).toBe(true);
  await fireEvent.press(screen.getByLabelText("Dismiss dropdown"));
  expect(screen.container.queryAll((n) => n.props.stubPanning !== undefined)[0].props.stubPanning).toBe(true);
  expect(screen.container.queryAll((n) => String(n.type) === "RCTScrollView").some((node) => node.props.scrollEnabled === false)).toBe(false);
});

it("retires filter drafts and applied filters when the account changes", async () => {
  const { rerender } = await render(<MaintenanceHistoryList />);
  await fireEvent.press(screen.getByLabelText("Filter maintenance history"));
  await fireEvent.press(screen.getByLabelText("Status: Cancelled"));
  await fireEvent.press(screen.getByText("Apply filters"));
  await fireEvent.press(screen.getByLabelText("Filter maintenance history, 1 filter applied"));
  mockDashboard.mockReturnValue({ ...state(), accountKey: "account-b" });
  await rerender(<MaintenanceHistoryList />);
  expect(screen.queryByText("Filter maintenance history", { exact: true })).toBeNull();
  expect(screen.getByText("5 requests")).toBeTruthy();
  expect(screen.getByLabelText("Filter maintenance history")).toBeTruthy();
});

it("keeps unavailable history distinct from empty results and discloses the loaded cap", async () => {
  const value = state();
  value.requests.data.historyLimited = true;
  mockDashboard.mockReturnValue(value);
  const { rerender } = await render(<MaintenanceHistoryList />);
  expect(screen.getByText(/History is limited to the latest 200 requests/)).toBeTruthy();
  mockDashboard.mockReturnValue({ ...value, requests: { ...value.requests, isError: true } });
  await rerender(<MaintenanceHistoryList />);
  expect(screen.getByText("Couldn't load maintenance history.")).toBeTruthy();
  expect(screen.queryByText("No resolved or cancelled requests yet.")).toBeNull();
  await fireEvent.press(screen.getByText("Retry history"));
  expect(mockRefresh).toHaveBeenCalled();
});
