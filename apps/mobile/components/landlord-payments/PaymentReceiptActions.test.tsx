import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Share } from "react-native";

import PaymentReceiptActions from "./PaymentReceiptActions";

jest.mock("@tabler/icons-react-native", () => ({ IconShare2: () => null, IconDownload: () => null, IconCheck: () => null }));
jest.mock("@/service/payments/paymentService", () => ({
  formatReferenceId: (reference: string | null) => reference ?? "—",
  methodLabel: (method: string | null) => (method === "cash" ? "Cash" : method ?? "—"),
}));
jest.mock("heroui-native", () => {
  const { Pressable, Text } = jest.requireActual("react-native");
  const Button = Object.assign(
    ({ children, onPress, isDisabled, variant }: { children?: React.ReactNode; onPress?: () => void; isDisabled?: boolean; variant?: string }) => (
      <Pressable accessibilityRole="button" accessibilityHint={variant} disabled={isDisabled} onPress={onPress}>{children}</Pressable>
    ),
    { Label: ({ children, className }: { children?: React.ReactNode; className?: string }) => <Text className={className}>{children}</Text> },
  );
  return { Button };
});

const payment = (change: Record<string, unknown> = {}) => ({
  id: "pay-1", created_at: "2026-03-05T02:00:00Z", date: "2026-03-05", amount: 6000, status: "pending", method: "cash",
  reference_id: "APT-ABCD1234", period_start: "2026-03-01", due_date: "2026-03-05", apartment_name: "Unit A", tenant_name: "Ryan", billing_kind: null, ...change,
});

const setup = (change: Record<string, unknown> = {}, extra: Partial<React.ComponentProps<typeof PaymentReceiptActions>> = {}) => {
  const props = { isBusy: false, error: null, onConfirm: jest.fn(), onDecline: jest.fn(), onClearError: jest.fn(), onSavePhoto: jest.fn().mockResolvedValue("saved"), ...extra };
  render(<PaymentReceiptActions payment={payment(change) as never} {...props} />);
  return props;
};

afterEach(() => jest.restoreAllMocks());

describe("PaymentReceiptActions", () => {
  it("offers Decline and Mark as paid for cash waiting for the landlord, and writes nothing yet", () => {
    const props = setup();
    expect(screen.getByText("Decline")).toBeTruthy();
    expect(screen.getByText("Mark as paid")).toBeTruthy();
    fireEvent.press(screen.getByText("Mark as paid"));
    expect(props.onClearError).toHaveBeenCalled();
    expect(props.onConfirm).not.toHaveBeenCalled();
    expect(screen.getByText(/Confirm you received ₱\s?6,000 in cash from Ryan\? They will be notified\./)).toBeTruthy();
  });

  it("confirms only after the question, and Back returns to the first step", () => {
    const props = setup();
    fireEvent.press(screen.getByText("Mark as paid"));
    expect(screen.queryByText("Mark as paid")).toBeNull();
    fireEvent.press(screen.getByText("Back"));
    expect(screen.getByText("Mark as paid")).toBeTruthy();
    fireEvent.press(screen.getByText("Mark as paid"));
    fireEvent.press(screen.getByText("Yes, I received it"));
    expect(props.onConfirm).toHaveBeenCalledTimes(1);
    expect(props.onDecline).not.toHaveBeenCalled();
  });

  it("declines through its own question and tells the tenant they can try again", () => {
    const props = setup();
    fireEvent.press(screen.getByText("Decline"));
    expect(screen.getByText(/Ryan can submit another request/)).toBeTruthy();
    fireEvent.press(screen.getByText("Yes, decline"));
    expect(props.onDecline).toHaveBeenCalledTimes(1);
    expect(props.onConfirm).not.toHaveBeenCalled();
  });

  it("disables every button while saving and shows a failed write's message", () => {
    setup({}, { isBusy: true, error: "Could not update payment status." });
    expect(screen.getByText("Could not update payment status.")).toBeTruthy();
    for (const button of screen.getAllByRole("button")) expect(button.props.accessibilityState?.disabled ?? button.props.disabled).toBeTruthy();
  });

  it.each([
    [{ status: "paid" }, "recorded in your income"],
    [{ status: "pending", method: "gcash" }, "payment provider"],
    [{ status: "rejected" }, "No money was recorded"],
  ])("shows a note and no cash actions for %j", (change, note) => {
    setup(change);
    expect(screen.getByText(new RegExp(note))).toBeTruthy();
    expect(screen.queryByText("Decline")).toBeNull();
    expect(screen.queryByText("Mark as paid")).toBeNull();
    expect(screen.getByText("Share")).toBeTruthy();
  });

  it("shares the receipt as text through the system share sheet", async () => {
    const share = jest.spyOn(Share, "share").mockResolvedValue({ action: "sharedAction" } as never);
    setup({ status: "paid" });
    fireEvent.press(screen.getByText("Share"));
    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    const message = (share.mock.calls[0][0] as { message: string }).message;
    expect(message).toContain("Payment received");
    expect(message).toContain("Tenant: Ryan");
    expect(message).toContain("Apartment: Unit A");
    expect(message).toContain("Method: Cash");
    expect(message).toContain("Reference No.: APT-ABCD1234");
    expect(message).toContain("Paid on: Thursday, March 5, 2026");
  });

  it("reports a share that fails", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(Share, "share").mockRejectedValue(new Error("nope"));
    setup({ status: "paid" });
    fireEvent.press(screen.getByText("Share"));
    expect(await screen.findByText(/couldn't be shared/)).toBeTruthy();
  });

  it("puts Save as photo beside Share, both as ghost buttons", () => {
    setup({ status: "paid" });
    const ghost = screen.getAllByRole("button").filter((button) => button.props.accessibilityHint === "ghost");
    expect(ghost).toHaveLength(2);
    expect(screen.getByText("Save as photo")).toBeTruthy();
    expect(screen.getByText("Share")).toBeTruthy();
  });

  it("draws the ghost buttons' text in the brand blue, not the default light text that vanishes on white paper", () => {
    setup({ status: "paid" });
    expect(screen.getByText("Save as photo").props.className).toContain("text-primary");
    expect(screen.getByText("Share").props.className).toContain("text-primary");
  });

  it("saves the receipt to photos and says so", async () => {
    const props = setup({ status: "paid" });
    fireEvent.press(screen.getByText("Save as photo"));
    expect(await screen.findByText("Saved")).toBeTruthy();
    expect(props.onSavePhoto).toHaveBeenCalledTimes(1);
  });

  it("explains how to allow photo access when it was refused, and does not claim a save", async () => {
    setup({ status: "paid" }, { onSavePhoto: jest.fn().mockResolvedValue("denied") });
    fireEvent.press(screen.getByText("Save as photo"));
    expect(await screen.findByText(/Allow photo access/)).toBeTruthy();
    expect(screen.queryByText("Saved")).toBeNull();
    expect(screen.getByText("Save as photo")).toBeTruthy();
  });

  it("says so, instead of failing, when this build has no photo module", async () => {
    setup({ status: "paid" }, { onSavePhoto: jest.fn().mockResolvedValue("unavailable") });
    fireEvent.press(screen.getByText("Save as photo"));
    expect(await screen.findByText(/isn't available in this version of the app/)).toBeTruthy();
    expect(screen.queryByText("Saved")).toBeNull();
  });

  it("reports a save that fails and lets the landlord try again", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    setup({ status: "paid" }, { onSavePhoto: jest.fn().mockRejectedValue(new Error("disk")) });
    fireEvent.press(screen.getByText("Save as photo"));
    expect(await screen.findByText(/couldn't be saved/)).toBeTruthy();
    expect(screen.getByText("Save as photo")).toBeTruthy();
  });
});
