import { fireEvent, render, screen } from "@testing-library/react-native";
import MaintenanceSection from "@/app/(tabs)/components/rentals/MaintenanceSection";
import type { MaintenanceRequest } from "@/service/maintenance-requests/maintenanceService";

jest.mock("heroui-native", () => jest.requireActual("../support/heroUINativeStub"));
jest.mock("@tabler/icons-react-native", () => ({ IconPlus: () => null, IconTool: () => null }));
jest.mock("@/hooks/useTheme", () => ({ useColors: () => ({ colors: { primary: "#376BF5", secondaryForeground: "#FFFFFF" } }) }));
jest.mock("@/app/(tabs)/components/rentals/MaintenanceRequestCard", () => {
  const { Pressable, Text } = jest.requireActual("react-native");
  return { __esModule: true, default: function RequestCard({ request, onPress }: { request: MaintenanceRequest; onPress: () => void }) {
    return <Pressable onPress={onPress}><Text>{request.title}</Text></Pressable>;
  } };
});

function request(id: string, status: MaintenanceRequest["status"], created_at = "2026-11-04", resolved_at: string | null = null): MaintenanceRequest {
  return {
    id, title: `Repair ${id}`, status, created_at, resolved_at, category: "appliances", urgency: "low", message: "Issue",
    image_urls: [], resolution_notes: null, cancelled_at: null, tenant_id: "tenant", apartment_id: "apartment",
    landlord_id: "landlord", tenancy_id: "tenancy", fee_amount: null, fee_status: null,
  };
}
const onOpen = jest.fn();
const onViewAll = jest.fn();
const onRequest = jest.fn();
async function show(requests: MaintenanceRequest[]) {
  return await render(<MaintenanceSection requests={requests} onOpenRequest={onOpen} onViewAll={onViewAll} onRequestMaintenance={onRequest} />);
}
beforeEach(() => { jest.clearAllMocks(); });

it("shows only three active requests and keeps the request button available with multiple open repairs", async () => {
  const rows = [request("closed", "Resolved"), request("cancelled", "Cancelled"), ...Array.from({ length: 4 }, (_, i) => request(String(i), i === 0 ? "In Progress" : "Pending"))];
  await show(rows);
  for (const id of ["0", "1", "2"]) expect(screen.getByText(`Repair ${id}`)).toBeTruthy();
  for (const id of ["closed", "cancelled", "3"]) expect(screen.queryByText(`Repair ${id}`)).toBeNull();
  expect(screen.getByText("4 Active")).toBeTruthy();
  expect(screen.queryByText(/You can file a new request once/)).toBeNull();
  await fireEvent.press(screen.getByText("Request Maintenance"));
  expect(onRequest).toHaveBeenCalledTimes(1);
  await fireEvent.press(screen.getByText("Repair 0"));
  expect(onOpen).toHaveBeenCalledWith(rows[2]);
  await fireEvent.press(screen.getByText("View all"));
  expect(onViewAll).toHaveBeenCalledTimes(1);
});

it("shows just the latest resolution, not the latest submission or a cancelled request, when nothing is active", async () => {
  const rows = [
    request("cancelled", "Cancelled", "2026-11-05"),
    request("recent-submission", "Resolved", "2026-11-03", "2026-11-03T08:00:00Z"),
    request("latest-resolution", "Resolved", "2026-10-01", "2026-11-04T08:00:00Z"),
  ];
  await show(rows);
  expect(screen.getByText("Repair latest-resolution")).toBeTruthy();
  expect(screen.queryByText("Repair recent-submission")).toBeNull();
  expect(screen.queryByText("Repair cancelled")).toBeNull();
  expect(screen.getByText("0 Active")).toBeTruthy();
  expect(screen.getByText("Request Maintenance")).toBeTruthy();
  expect(rows.map((row) => row.id)).toEqual(["cancelled", "recent-submission", "latest-resolution"]);
});

it("falls back to the submission date for legacy resolved requests", async () => {
  await show([request("older", "Resolved", "2026-10-01"), request("newer", "Resolved", "2026-11-01")]);
  expect(screen.getByText("Repair newer")).toBeTruthy();
  expect(screen.queryByText("Repair older")).toBeNull();
});

it("shows an empty state when there are only cancelled requests but keeps history and new-request entry points", async () => {
  await show([request("cancelled", "Cancelled")]);
  expect(screen.getByText("No active maintenance requests")).toBeTruthy();
  expect(screen.queryByText("Repair cancelled")).toBeNull();
  expect(screen.getByText("View all")).toBeTruthy();
  await fireEvent.press(screen.getByText("Request Maintenance"));
  expect(onRequest).toHaveBeenCalledTimes(1);
});

it("allows the first maintenance request when no records exist", async () => {
  await show([]);
  expect(screen.getByText("No active maintenance requests")).toBeTruthy();
  await fireEvent.press(screen.getByText("Request Maintenance"));
  expect(onRequest).toHaveBeenCalledTimes(1);
});
