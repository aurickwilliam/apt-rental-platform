import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { formatPesoDisplay } from "@repo/utils";
import LandlordMaintenanceDetails from "@/app/landlord/maintenance-requests/[requestId]";
import TenantMaintenanceDetails from "@/app/tenant/maintenance-details";

const mockLandlord = jest.fn();
const mockTenant = jest.fn();
const mockWaive = jest.fn();

jest.mock("heroui-native", () => jest.requireActual("../support/heroUINativeStub"));
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ requestId: "request-1", apartmentId: "apartment-1" }),
  useRouter: () => ({ back: jest.fn() }),
}));
jest.mock("@tabler/icons-react-native", () => ({ IconHammer: () => null, IconTrash: () => null, IconCheck: () => null }));
jest.mock("react-native-image-viewing", () => () => null);
jest.mock("@/components/layout/ScreenWrapper", () => ({ __esModule: true, default: ({ children }: { children: ReactNode }) => children }));
jest.mock("@/components/layout/StandardHeader", () => () => null);
jest.mock("@/hooks/useTheme", () => ({ useColors: () => ({ isDark: false, colors: { primary: "#376BF5", danger: "#E50914" } }) }));
jest.mock("@/hooks/maintenance-requests/useMaintenanceFocusRefresh", () => ({ useMaintenanceFocusRefresh: jest.fn() }));
jest.mock("@/hooks/maintenance-requests", () => {
  const style = { textColor: "#111111", backgroundColor: "#FFFFFF", borderColor: "#CCCCCC" };
  return {
    useLandlordMaintenanceRequests: () => mockLandlord(),
    useMaintenanceRequest: () => mockTenant(),
    useMaintenanceRequests: () => ({ cancelRequest: jest.fn(), canCancel: () => false }),
    useMaintenanceRequestStatusStyles: () => ({ Pending: style, "In Progress": style, Resolved: style, Cancelled: style }),
    useMaintenanceRequestUrgencyStyles: () => ({ low: style, medium: style, high: style }),
  };
});

const REQUEST = {
  id: "request-1", apartment_id: "apartment-1", tenant_id: "tenant-1", tenancy_id: "tenancy-1",
  title: "Leak", issue_title: "Leak", description: "Leaking pipe", message: "Leaking pipe", category: "plumbing",
  apartment_name: "Apartment", apartment_address: "Malabon", tenant_name: "Demo Tenant", contact_number: "—",
  reported_at: "2026-10-21", created_at: "2026-10-21", resolved_at: "2026-10-21", resolution_notes: "Fixed",
  status: "Resolved", urgency: "low", photos: [], image_urls: [], fee_amount: 1250, fee_status: "pending",
};

beforeEach(() => {
  jest.clearAllMocks();
  mockWaive.mockResolvedValue(true);
  mockLandlord.mockReturnValue({ requests: [{ ...REQUEST }], loading: false, advanceStatus: jest.fn(), resolveRequest: jest.fn(),
    waiveFee: mockWaive, error: null, clearError: jest.fn(), actionLoading: false, getNextStatus: (status: string) => status });
  mockTenant.mockReturnValue({ request: { ...REQUEST }, loading: false, error: null });
});

it("shows the landlord's fee and confirms before waiving", async () => {
  render(<LandlordMaintenanceDetails />);
  expect(screen.getByText(formatPesoDisplay(1250))).toBeTruthy();
  expect(screen.getByText("Added to next rent")).toBeTruthy();
  fireEvent.press(screen.getByText("Waive fee"));
  expect(mockWaive).not.toHaveBeenCalled();
  expect(screen.getByText("Waive Maintenance Fee")).toBeTruthy();
  fireEvent.press(screen.getAllByText("Waive fee").at(-1)!);
  await waitFor(() => expect(mockWaive).toHaveBeenCalledWith("request-1"));
  await waitFor(() => expect(screen.queryByText("Waive Maintenance Fee")).toBeNull());
});

it.each(["paid", "waived"])("does not offer the landlord a waiver for a %s fee", (status) => {
  mockLandlord.mockReturnValue({ ...mockLandlord(), requests: [{ ...REQUEST, fee_status: status }] });
  render(<LandlordMaintenanceDetails />);
  expect(screen.queryByText("Waive fee")).toBeNull();
  expect(screen.getByText(status === "paid" ? "Paid" : "Waived")).toBeTruthy();
});

it.each([
  { status: "pending", label: "Added to next rent" },
  { status: "paid", label: "Paid" },
  { status: "waived", label: "Waived" },
])("shows the tenant's $status fee without landlord controls", ({ status, label }) => {
  mockTenant.mockReturnValue({ request: { ...REQUEST, fee_status: status }, loading: false, error: null });
  render(<TenantMaintenanceDetails />);
  expect(screen.getByText(formatPesoDisplay(1250))).toBeTruthy();
  expect(screen.getByText(label)).toBeTruthy();
  expect(screen.queryByText("Waive fee")).toBeNull();
});
