import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import LandlordSignedLeaseCard from "./LandlordSignedLeaseCard";

const mockPick = jest.fn();
const mockUpload = jest.fn();
const mockView = jest.fn();
const mockToast = jest.fn();
let mockCurrent = true;
let mockSize = 1024;

jest.mock("expo-document-picker", () => ({ getDocumentAsync: () => mockPick() }));
jest.mock("expo-file-system", () => ({ File: class { get size() { return mockSize; } } }));
jest.mock("@/hooks/useTheme", () => ({ useColors: () => ({ colors: { primary: "blue", textPrimary: "black" }, isDark: false }) }));
jest.mock("@/service/tenancy/signedLeaseService", () => ({
  signedLeaseOperationGuard: () => () => mockCurrent,
  uploadSignedLease: (...args: unknown[]) => mockUpload(...args),
  viewSignedLease: (...args: unknown[]) => mockView(...args),
}));
jest.mock("heroui-native", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { Text, View, Pressable } = jest.requireActual<typeof import("react-native")>("react-native");
  type MockChildren = { children?: React.ReactNode };
  const Box = ({ children }: MockChildren) => React.createElement(View, null, children);
  const Label = ({ children }: MockChildren) => React.createElement(Text, null, children);
  const Button = Object.assign(({ children, onPress, isDisabled, accessibilityLabel }: MockChildren & {
    onPress?: () => void; isDisabled?: boolean; accessibilityLabel?: string;
  }) => React.createElement(Pressable, { onPress, disabled: isDisabled, accessibilityLabel }, children), { Label });
  const Dialog = Object.assign(({ children, isOpen, onOpenChange }: MockChildren & {
    isOpen: boolean; onOpenChange: (open: boolean) => void;
  }) => isOpen ? React.createElement(View, null, children,
    React.createElement(Pressable, { accessibilityLabel: "Dismiss dialog", onPress: () => onOpenChange(false) })) : null,
  { Portal: Box, Overlay: Box, Content: Box, Title: Label });
  return { Button, Dialog, Card: Object.assign(Box, { Body: Box }),
    Chip: Object.assign(Box, { Label }), Spinner: Box, useToast: () => ({ toast: { show: mockToast } }) };
});

const props = {
  tenancyId: "tenancy-1", path: null as string | null, uploadedAt: null as string | null,
  acknowledgedAt: null as string | null, onSaved: jest.fn(),
};
const picked = { canceled: false, assets: [{ uri: "file:///lease.pdf", name: "lease.pdf", mimeType: "application/pdf" }] };

async function selectFile() {
  fireEvent.press(screen.getByLabelText("Choose a signed lease file"));
  await waitFor(() => expect(screen.getByText("lease.pdf")).toBeTruthy());
}

beforeEach(() => {
  jest.clearAllMocks();
  mockCurrent = true;
  mockSize = 1024;
  mockPick.mockResolvedValue(picked);
  mockUpload.mockResolvedValue(undefined);
  mockView.mockResolvedValue(undefined);
  props.onSaved.mockResolvedValue(undefined);
});

it("renders missing/pending/confirmed states and views the saved contract", async () => {
  const { rerender } = render(<LandlordSignedLeaseCard {...props} />);
  expect(screen.getByText("Not uploaded")).toBeTruthy();
  fireEvent.press(screen.getByText("View"));
  expect(mockView).not.toHaveBeenCalled();
  rerender(<LandlordSignedLeaseCard {...props} path="tenancy-1/lease.pdf" uploadedAt="2026-11-01" />);
  expect(screen.getByText("Awaiting tenant")).toBeTruthy();
  fireEvent.press(screen.getByText("View"));
  await waitFor(() => expect(mockView).toHaveBeenCalledWith("tenancy-1/lease.pdf", expect.any(Function)));
  rerender(<LandlordSignedLeaseCard {...props} path="tenancy-1/lease.pdf" acknowledgedAt="2026-11-02" />);
  expect(screen.getByText("Confirmed")).toBeTruthy();
  expect(screen.getByText(/Confirmed by the tenant/)).toBeTruthy();
});

it("uploads only after selection, refreshes, and clears drafts on reopening", async () => {
  render(<LandlordSignedLeaseCard {...props} />);
  fireEvent.press(screen.getByText("Upload"));
  fireEvent.press(screen.getByText("Upload file"));
  expect(mockUpload).not.toHaveBeenCalled();
  await selectFile();
  fireEvent.press(screen.getByText("Upload file"));
  await waitFor(() => expect(mockToast).toHaveBeenCalledWith({ variant: "success", label: "Signed lease saved" }));
  expect(mockUpload).toHaveBeenCalledWith(expect.objectContaining({ tenancyId: "tenancy-1", previousPath: null, asset: expect.objectContaining(picked.assets[0]) }));
  expect(props.onSaved).toHaveBeenCalledTimes(1);
  fireEvent.press(screen.getByText("Upload"));
  expect(screen.queryByText("lease.pdf")).toBeNull();
});

it("shows the replacement warning and preserves the selection after a refused save", async () => {
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  mockUpload.mockRejectedValue(new Error("Only the landlord can save a signed lease."));
  render(<LandlordSignedLeaseCard {...props} path="tenancy-1/old.pdf" />);
  fireEvent.press(screen.getByText("Replace"));
  expect(screen.getByText(/asks the tenant to confirm the new one/)).toBeTruthy();
  await selectFile();
  fireEvent.press(screen.getByText("Replace file"));
  await waitFor(() => expect(screen.getByText("Only the landlord can save a signed lease.")).toBeTruthy());
  expect(screen.getByText("lease.pdf")).toBeTruthy();
  expect(props.onSaved).not.toHaveBeenCalled();
  log.mockRestore();
});

it("blocks dismissal and duplicate submissions while saving", async () => {
  let finish!: () => void;
  mockUpload.mockReturnValue(new Promise<void>((resolve) => { finish = resolve; }));
  render(<LandlordSignedLeaseCard {...props} />);
  fireEvent.press(screen.getByText("Upload"));
  await selectFile();
  fireEvent.press(screen.getByText("Upload file"));
  fireEvent.press(screen.getByText("Upload file"));
  fireEvent.press(screen.getByText("Cancel"));
  fireEvent.press(screen.getByLabelText("Dismiss dialog"));
  expect(screen.getByText("Upload Signed Lease")).toBeTruthy();
  expect(mockUpload).toHaveBeenCalledTimes(1);
  await act(async () => finish());
  expect(screen.queryByText("Upload Signed Lease")).toBeNull();
});

it("treats picker cancellation as a no-op and invalid replacements clear the selection", async () => {
  render(<LandlordSignedLeaseCard {...props} />);
  fireEvent.press(screen.getByText("Upload"));
  await selectFile();
  mockPick.mockResolvedValueOnce({ canceled: true });
  fireEvent.press(screen.getByLabelText("Choose a signed lease file"));
  await waitFor(() => expect(mockPick).toHaveBeenCalledTimes(2));
  expect(screen.getByText("lease.pdf")).toBeTruthy();
  await act(async () => {});
  mockSize = 11 * 1024 * 1024;
  fireEvent.press(screen.getByLabelText("Choose a signed lease file"));
  await waitFor(() => expect(screen.getByText("Files must be 10 MB or smaller.")).toBeTruthy());
  expect(screen.queryByText("lease.pdf")).toBeNull();
  fireEvent.press(screen.getByText("Upload file"));
  expect(mockUpload).not.toHaveBeenCalled();
});

it("retries only refresh when the file saved but reconciliation failed", async () => {
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  props.onSaved.mockRejectedValueOnce(new Error("offline"));
  render(<LandlordSignedLeaseCard {...props} />);
  fireEvent.press(screen.getByText("Upload"));
  await selectFile();
  fireEvent.press(screen.getByText("Upload file"));
  await waitFor(() => expect(screen.getByText(/The signed lease was saved/)).toBeTruthy());
  fireEvent.press(screen.getByText("Retry refresh"));
  await waitFor(() => expect(mockToast).toHaveBeenCalled());
  expect(mockUpload).toHaveBeenCalledTimes(1);
  expect(props.onSaved).toHaveBeenCalledTimes(2);
  log.mockRestore();
});

it("rejects late account callbacks and never refreshes or toasts for them", async () => {
  let finish!: () => void;
  mockUpload.mockReturnValue(new Promise<void>((resolve) => { finish = resolve; }));
  const { unmount } = render(<LandlordSignedLeaseCard {...props} />);
  fireEvent.press(screen.getByText("Upload"));
  await selectFile();
  fireEvent.press(screen.getByText("Upload file"));
  mockCurrent = false;
  unmount();
  await act(async () => finish());
  expect(props.onSaved).not.toHaveBeenCalled();
  expect(mockToast).not.toHaveBeenCalled();
});
