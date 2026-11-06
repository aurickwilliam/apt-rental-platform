import type { ReactNode } from "react";
import { Card, Chip } from "heroui-native";
import { STATUS_COLORS } from "@repo/constants";
import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import LeaseRenewalScreen from "@/components/renewals/LeaseRenewalScreen";
import LeaseRenewalEntry from "@/components/renewals/LeaseRenewalEntry";
import RenewalRequestsScreen from "@/app/lease-renewal";
import { context, proposal, renewalContext } from "./fixtures";

const mockRenewal = jest.fn();
const mockQuery = jest.fn();
const mockAct = jest.fn();
const mockView = jest.fn();
const mockPush = jest.fn();
const mockRefresh = jest.fn();
let mockIsDark = false;

jest.mock("@/hooks/tenancy/useLeaseRenewal", () => ({ useLeaseRenewal: () => mockRenewal() }));
jest.mock("@tanstack/react-query", () => ({ useQuery: () => mockQuery() }));
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush, back: jest.fn() }) }));
jest.mock("@/stores/usePortalStore", () => ({
  usePortalStore: (select: (state: { authUserId: string; portal: string }) => unknown) =>
    select({ authUserId: "account", portal: "landlord" }),
}));
jest.mock("@/service/tenancy/leaseRenewalService", () => ({ fetchRenewalRequests: jest.fn() }));
jest.mock("@/service/chat/chatService", () => ({ buildConversationKey: jest.fn() }));
jest.mock("@/components/renewals/RenewalProposalForm", () => () => null);
jest.mock("@/components/renewals/RenewalPayment", () => () => null);
jest.mock("@/components/display/AppDialog", () => function AppDialogStub({ isOpen, title, children, footer }: { isOpen: boolean; title: string; children: ReactNode; footer: ReactNode }) {
  const { Text, View } = jest.requireActual("react-native");
  return isOpen ? <View><Text>{title}</Text>{children}{footer}</View> : null;
});
jest.mock("@/components/display/EmptyState", () => () => null);
jest.mock("@tabler/icons-react-native", () => Object.fromEntries([
  "IconFileText", "IconCalendar", "IconCheck", "IconClock", "IconHistory", "IconRefresh", "IconRoute",
  "IconCoins", "IconInfoCircle", "IconX", "IconChevronDown", "IconChevronUp",
].map((name) => [name, () => null])));
jest.mock("@/hooks/useTheme", () => ({ useColors: () => ({ isDark: mockIsDark, colors: { primaryLightForeground: "#2F5FE0", secondaryForeground: "#FFFFFF", textPrimary: "#333333", textSecondary: "#626B73" } }) }));
jest.mock("heroui-native", () => {
  const stub = jest.requireActual("../support/heroUINativeStub");
  return { ...stub, TextArea: stub.Input };
});
jest.mock("@/components/layout/ScreenWrapper", () => ({
  __esModule: true,
  default: ({ header, children, className }: { header?: ReactNode; children: ReactNode; className?: string }) => {
    const { View } = jest.requireActual("react-native");
    return (
      <View>
        <View testID="fixed-header">{header}</View>
        <View testID="scrolling-content" className={className}>{children}</View>
      </View>
    );
  },
}));
jest.mock("@/components/layout/StandardHeader", () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => {
    const { Text } = jest.requireActual("react-native");
    return <Text>{title}</Text>;
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockIsDark = false;
  mockRenewal.mockReturnValue({ isLoading: true, isRefetching: false });
  mockQuery.mockReturnValue({ isLoading: true });
  mockAct.mockResolvedValue(true);
});

function loaded(data = context(), busy = false) {
  mockRenewal.mockReturnValue({ data, busy, act: mockAct, view: mockView, refetch: mockRefresh, isLocked: () => busy });
}

it.each(["loading", "error"])("keeps the renewal detail header outside padded scrolling content when %s", (state) => {
  if (state === "error") mockRenewal.mockReturnValue({ error: new Error("Renewal unavailable.") });
  render(<LeaseRenewalScreen tenancyId="tenancy" portal="tenant" />);
  expect(within(screen.getByTestId("fixed-header")).getByText("Lease renewal")).toBeTruthy();
  expect(within(screen.getByTestId("scrolling-content")).queryByText("Lease renewal")).toBeNull();
  expect(screen.getByTestId("scrolling-content").props.className).toBe("px-5 pt-4 pb-5");
});

it("groups the current lease, progress, request actions and history with readable dates and the deposit warning", () => {
  loaded();
  render(<LeaseRenewalScreen tenancyId="tenancy" portal="tenant" />);
  expect(screen.getAllByRole("header").map((node) => node.props.children)).toEqual([
    "Current agreed lease", "Renewal progress", "Would you like to renew?", "Renewal history",
  ]);
  expect(screen.getByText("Dec 1, 2025 – Nov 30, 2026")).toBeTruthy();
  expect(screen.getByText(/not a verified remaining balance/)).toBeTruthy();
  const cards = screen.UNSAFE_getAllByType(Card).filter((node) => node.props.className === "rounded-3xl border border-border bg-surface p-4 shadow-none");
  expect(cards).toHaveLength(4);
  for (const card of cards) expect(card.props.children.props.className).toBe("gap-4");
  fireEvent.press(screen.getByText("View original agreement"));
  expect(mockView).toHaveBeenCalledWith("original.pdf", "signed-leases");
  fireEvent.press(screen.getByText("Request Lease Renewal"));
  expect(mockAct).toHaveBeenCalledWith("request", { durationMonths: 12 });
});

it("keeps out-of-window requests unavailable and does not label an unknown rent as zero", () => {
  loaded(context({ today: "2026-10-01", monthlyRent: null }));
  render(<LeaseRenewalScreen tenancyId="tenancy" portal="tenant" />);
  expect(screen.queryByText("Request Lease Renewal")).toBeNull();
  expect(screen.getByText("Not recorded")).toBeTruthy();
  expect(screen.queryByText("₱0.00")).toBeNull();
});

it("shows server-provided proposal charges, the active stage, and the existing acceptance action", () => {
  loaded(renewalContext("awaiting_tenant_confirmation"));
  render(<LeaseRenewalScreen tenancyId="tenancy" portal="tenant" />);
  expect(screen.getByLabelText("Terms: current step")).toBeTruthy();
  expect(screen.getByText("Total renewal payment")).toBeTruthy();
  expect(screen.getByText("₱ 22,000")).toBeTruthy();
  expect(screen.getByText("Verified applicable credit (deducted)")).toBeTruthy();
  expect(screen.getByText(/not independently verified by APT/)).toBeTruthy();
  fireEvent.press(screen.getByText("Accept Renewal Terms"));
  expect(mockAct).toHaveBeenCalledWith("accept", { proposalId: proposal.id });
});

it.each(["declined", "not_renewing", "requires_review"] as const)("does not show successful completed stages for %s", (status) => {
  loaded(renewalContext(status));
  render(<LeaseRenewalScreen tenancyId="tenancy" portal="tenant" />);
  expect(screen.queryByLabelText("Renewal stages")).toBeNull();
  expect(screen.queryByText("Accept Renewal Terms")).toBeNull();
});

it("keeps landlord approval and decline inside the decision card", async () => {
  loaded(renewalContext("pending_landlord_review"));
  render(<LeaseRenewalScreen tenancyId="tenancy" portal="landlord" />);
  expect(screen.getByText("Renewal decision")).toBeTruthy();
  fireEvent.press(screen.getByText("Approve request"));
  expect(mockAct).toHaveBeenCalledWith("approve");
  fireEvent.press(screen.getByText("Decline Renewal"));
  fireEvent.changeText(screen.getByLabelText("Reason for declining"), "Unable to extend");
  await act(async () => { fireEvent.press(screen.getByText("Confirm decision")); });
  expect(mockAct).toHaveBeenCalledWith("decline", { reason: "Unable to extend", durationMonths: 12 });
});

it("keeps confirmation saved and disabled while allowing the agreement to be viewed", () => {
  loaded({ ...renewalContext("awaiting_agreement_confirmation"), agreement: { path: "agreement.pdf", tenant_confirmed_at: "2026-11-06", landlord_confirmed_at: null } });
  render(<LeaseRenewalScreen tenancyId="tenancy" portal="tenant" />);
  expect(screen.getByRole("button", { name: "Confirmation saved" })).toBeDisabled();
  fireEvent.press(screen.getByText("View renewal agreement"));
  expect(mockView).toHaveBeenCalledWith("agreement.pdf");
});

it("preserves the full document labels and their original file targets", () => {
  loaded({ ...renewalContext("awaiting_agreement_confirmation"), agreement: { path: "agreement.pdf", tenant_confirmed_at: null, landlord_confirmed_at: null } });
  render(<LeaseRenewalScreen tenancyId="tenancy" portal="tenant" />);
  fireEvent.press(screen.getByRole("button", { name: "View original agreement" }));
  expect(mockView).toHaveBeenLastCalledWith("original.pdf", "signed-leases");
  fireEvent.press(screen.getByRole("button", { name: "View supporting document" }));
  expect(mockView).toHaveBeenLastCalledWith("evidence.pdf");
  fireEvent.press(screen.getByRole("button", { name: "View renewal agreement" }));
  expect(mockView).toHaveBeenLastCalledWith("agreement.pdf");
  fireEvent.press(screen.getByLabelText("View saved proposal 1"));
  fireEvent.press(screen.getByRole("button", { name: "View preserved agreement" }));
  expect(mockView).toHaveBeenLastCalledWith("saved.pdf");
});

it("disables renewal writes while saving and keeps saved proposals collapsed until requested", () => {
  loaded(renewalContext("awaiting_tenant_confirmation"), true);
  render(<LeaseRenewalScreen tenancyId="tenancy" portal="tenant" />);
  expect(screen.getByRole("button", { name: "Accept Renewal Terms" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Decline Renewal" })).toBeDisabled();
  expect(screen.queryByText("View preserved agreement")).toBeNull();
  fireEvent.press(screen.getByLabelText("View saved proposal 1"));
  expect(screen.getByRole("button", { name: "View preserved agreement" })).toBeDisabled();
});

it("renders request cards with status and preserves navigation", () => {
  mockQuery.mockReturnValue({ data: [{ id: "renewal", tenancy_id: "tenancy", apartment_name: "Navotas apartment", tenant_name: "Test Tenant", status: "pending_landlord_review" }] });
  render(<RenewalRequestsScreen />);
  expect(screen.getByText("Pending landlord review")).toBeTruthy();
  fireEvent.press(screen.getByText("Review renewal"));
  expect(mockPush).toHaveBeenCalledWith({ pathname: "/lease-renewal/[tenancyId]", params: { tenancyId: "tenancy" } });
});

it.each([false, true])("uses the existing status palette with dark mode = %s", (dark) => {
  mockIsDark = dark;
  loaded(renewalContext("renewed"));
  render(<LeaseRenewalScreen tenancyId="tenancy" portal="tenant" />);
  const palette = STATUS_COLORS[dark ? "dark" : "light"].success;
  const chips = screen.UNSAFE_getAllByType(Chip).filter((node) => node.props.style);
  expect(chips).toHaveLength(1);
  expect(chips[0].props.style).toEqual({ backgroundColor: palette.backgroundColor, borderColor: palette.borderColor, borderWidth: 1 });
  expect(screen.getByLabelText("Payment: completed")).toBeTruthy();
  expect(screen.getByText("Renewed — scheduled")).toBeTruthy();
});

it("keeps the dashboard entry aligned with renewal details and preserves its destination", () => {
  loaded();
  render(<LeaseRenewalEntry tenancyId="tenancy" portal="tenant" />);
  expect(screen.getByText("Current lease ends Nov 30, 2026")).toBeTruthy();
  fireEvent.press(screen.getByText("Review renewal options"));
  expect(mockPush).toHaveBeenCalledWith({ pathname: "/lease-renewal/[tenancyId]", params: { tenancyId: "tenancy" } });
});

it.each(["loading", "error", "empty"])("keeps the renewal list header outside padded scrolling content when %s", (state) => {
  mockQuery.mockReturnValue({ isLoading: state === "loading", error: state === "error", data: [] });
  render(<RenewalRequestsScreen />);
  expect(within(screen.getByTestId("fixed-header")).getByText("Lease renewals")).toBeTruthy();
  expect(within(screen.getByTestId("scrolling-content")).queryByText("Lease renewals")).toBeNull();
  expect(screen.getByTestId("scrolling-content").props.className).toBe("px-5 pt-4 pb-5");
});
