import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react-native";
import { View } from "react-native";
import TenantSignedLeaseCard from "./TenantSignedLeaseCard";

const mockAcknowledge = jest.fn();
const mockView = jest.fn();
const mockToast = jest.fn();
let mockCurrent = true;
let mockFocused = true;

jest.mock("expo-router", () => ({ useFocusEffect: (callback: () => void) => {
  const React = jest.requireActual<typeof import("react")>("react");
  React.useEffect(() => { if (mockFocused) return callback(); }, [callback]);
} }));
jest.mock("@/hooks/useTheme", () => ({ useColors: () => ({ colors: { primary: "blue" }, isDark: false }) }));
jest.mock("@/service/tenancy/signedLeaseService", () => ({
  signedLeaseOperationGuard: () => () => mockCurrent,
  acknowledgeSignedLease: (...args: unknown[]) => mockAcknowledge(...args),
  viewSignedLease: (...args: unknown[]) => mockView(...args),
}));
jest.mock("heroui-native", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { Text, View, Pressable } = jest.requireActual<typeof import("react-native")>("react-native");
  type MockChildren = { children?: React.ReactNode };
  const Box = ({ children }: MockChildren) => React.createElement(View, null, children);
  const Label = ({ children }: MockChildren) => React.createElement(Text, null, children);
  const Button = Object.assign(({ children, onPress, isDisabled }: MockChildren & {
    onPress?: () => void; isDisabled?: boolean;
  }) => React.createElement(Pressable, { onPress, disabled: isDisabled }, children), { Label });
  return { Button, Card: Object.assign(Box, { Body: Box }), Chip: Object.assign(Box, { Label }),
    Spinner: Box, useToast: () => ({ toast: { show: mockToast } }) };
});

const props = {
  tenancyId: "tenancy-1", path: "tenancy-1/lease.pdf", uploadedAt: "2026-11-01", acknowledgedAt: null,
  onAcknowledged: jest.fn<Promise<boolean>, []>(),
};
const confirmLabel = "I've reviewed this lease";
beforeEach(() => {
  jest.clearAllMocks();
  mockCurrent = true;
  mockFocused = true;
  mockAcknowledge.mockResolvedValue(undefined);
  mockView.mockResolvedValue(undefined);
  props.onAcknowledged.mockResolvedValue(true);
});

it("shows not uploaded with no confirmation action or enabled viewer", () => {
  render(<TenantSignedLeaseCard {...props} path={null} />);
  expect(screen.getByText("Not uploaded")).toBeTruthy();
  expect(screen.getByText(/once your landlord uploads it/)).toBeTruthy();
  expect(screen.queryByText(confirmLabel)).toBeNull();
  fireEvent.press(screen.getByText("View document"));
  expect(mockView).not.toHaveBeenCalled();
  expect(mockToast).not.toHaveBeenCalled();
});

it("shows pending, privately views, and reminds once for the focused document", async () => {
  const { rerender } = render(<TenantSignedLeaseCard {...props} />);
  expect(screen.getByText("Needs your confirmation")).toBeTruthy();
  expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ label: "Signed lease ready for review" }));
  fireEvent.press(screen.getByText("View document"));
  await waitFor(() => expect(mockView).toHaveBeenCalledWith(props.path, expect.any(Function)));
  rerender(<TenantSignedLeaseCard {...props} />);
  expect(mockToast).toHaveBeenCalledTimes(1);
});

it("places viewing and confirmation in the same action row", () => {
  render(<TenantSignedLeaseCard {...props} />);
  const row = screen.UNSAFE_getAllByType(View).find((view) => view.props.className === "flex-row items-stretch gap-2");
  if (!row) throw new Error("Expected one horizontal lease action row");
  expect(within(row).getByText("View document")).toBeTruthy();
  expect(within(row).getByText(confirmLabel)).toBeTruthy();
});

it("does not nudge inactive or already-confirmed rentals and keeps confirmed viewing available", async () => {
  mockFocused = false;
  const { rerender } = render(<TenantSignedLeaseCard {...props} />);
  expect(mockToast).not.toHaveBeenCalled();
  mockFocused = true;
  rerender(<TenantSignedLeaseCard {...props} acknowledgedAt="2026-11-02" />);
  expect(screen.getByText("Confirmed")).toBeTruthy();
  expect(screen.getByText(/You confirmed this lease on/)).toBeTruthy();
  expect(screen.queryByText(confirmLabel)).toBeNull();
  expect(mockToast).not.toHaveBeenCalled();
  fireEvent.press(screen.getByText("View document"));
  await waitFor(() => expect(mockView).toHaveBeenCalledTimes(1));
});

it("confirms through the RPC without inventing a mandatory view-first step", async () => {
  render(<TenantSignedLeaseCard {...props} />);
  fireEvent.press(screen.getByText(confirmLabel));
  await waitFor(() => expect(props.onAcknowledged).toHaveBeenCalledTimes(1));
  expect(mockAcknowledge).toHaveBeenCalledWith("tenancy-1", expect.any(Function));
  expect(mockView).not.toHaveBeenCalled();
  expect(screen.getByText("Confirmed")).toBeTruthy();
  expect(screen.queryByText(confirmLabel)).toBeNull();
});

it("locks duplicate confirmations through reconciliation and leaves the rest of the rental mounted", async () => {
  let finish!: (ok: boolean) => void;
  props.onAcknowledged.mockReturnValueOnce(new Promise<boolean>((resolve) => { finish = resolve; }));
  render(<TenantSignedLeaseCard {...props} />);
  fireEvent.press(screen.getByText(confirmLabel));
  fireEvent.press(screen.getByText(confirmLabel));
  await waitFor(() => expect(props.onAcknowledged).toHaveBeenCalledTimes(1));
  expect(mockAcknowledge).toHaveBeenCalledTimes(1);
  expect(screen.getByText("Your confirmation was saved.")).toBeTruthy();
  await act(async () => finish(true));
  expect(screen.getByText("Confirmed")).toBeTruthy();
});

it("retains confirmation after a failed refresh and retries only the read", async () => {
  props.onAcknowledged.mockResolvedValueOnce(false);
  render(<TenantSignedLeaseCard {...props} />);
  await act(async () => { fireEvent.press(screen.getByText(confirmLabel)); });
  await waitFor(() => expect(screen.getByText(/Your confirmation was saved, but/)).toBeTruthy());
  expect(screen.getByText("Confirmed")).toBeTruthy();
  fireEvent.press(screen.getByText("Refresh lease details"));
  await waitFor(() => expect(screen.queryByText("Refresh lease details")).toBeNull());
  expect(mockAcknowledge).toHaveBeenCalledTimes(1);
  expect(props.onAcknowledged).toHaveBeenCalledTimes(2);
});

it("shows database refusal messages inline and allows retry", async () => {
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  mockAcknowledge.mockRejectedValueOnce({ message: "There is no signed lease to confirm yet." });
  render(<TenantSignedLeaseCard {...props} />);
  fireEvent.press(screen.getByText(confirmLabel));
  await waitFor(() => expect(screen.getByText("There is no signed lease to confirm yet.")).toBeTruthy());
  expect(screen.getByText("Needs your confirmation")).toBeTruthy();
  fireEvent.press(screen.getByText(confirmLabel));
  await waitFor(() => expect(screen.getByText("Confirmed")).toBeTruthy());
  log.mockRestore();
});

it("resets a saved confirmation when the landlord replaces the file", async () => {
  const { rerender } = render(<View><TenantSignedLeaseCard key="account:tenancy:lease.pdf" {...props} /></View>);
  fireEvent.press(screen.getByText(confirmLabel));
  await waitFor(() => expect(screen.getByText("Confirmed")).toBeTruthy());
  rerender(<View><TenantSignedLeaseCard key="account:tenancy:new.pdf" {...props} path="tenancy-1/new.pdf" /></View>);
  expect(screen.getByText("Needs your confirmation")).toBeTruthy();
  expect(screen.getByText(confirmLabel)).toBeTruthy();
  expect(mockToast).toHaveBeenCalledTimes(2);
});

it("retires late confirmation callbacks after account or document changes", async () => {
  let finish!: () => void;
  mockAcknowledge.mockReturnValueOnce(new Promise<void>((resolve) => { finish = resolve; }));
  const { rerender } = render(<View><TenantSignedLeaseCard key="account:old" {...props} /></View>);
  fireEvent.press(screen.getByText(confirmLabel));
  rerender(<View><TenantSignedLeaseCard key="account:new" {...props} path="tenancy-1/new.pdf" /></View>);
  await act(async () => finish());
  expect(props.onAcknowledged).not.toHaveBeenCalled();
  expect(screen.getByText("Needs your confirmation")).toBeTruthy();
  mockCurrent = false;
  fireEvent.press(screen.getByText(confirmLabel));
  expect(mockAcknowledge).toHaveBeenCalledTimes(1);
});

it("shows failed views as an error without falsely confirming the lease", async () => {
  mockView.mockRejectedValueOnce(new Error("Could not open the signed lease. Please try again."));
  render(<TenantSignedLeaseCard {...props} />);
  fireEvent.press(screen.getByText("View document"));
  await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: "danger" })));
  expect(mockAcknowledge).not.toHaveBeenCalled();
  expect(screen.getByText("Needs your confirmation")).toBeTruthy();
});
