import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { ScrollView } from "react-native";
import { formatPesoDisplay } from "@repo/utils";
import ResolveRequestDialog from "./ResolveRequestDialog";

jest.mock("heroui-native", () => jest.requireActual("../../../../tests/support/heroUINativeStub"));

function enterNotes() {
  fireEvent.changeText(screen.getByLabelText("Resolution notes"), " Repaired the pipe ");
}

it("keeps the complete form and confirmation in a non-scrolling dialog", () => {
  const view = render(<ResolveRequestDialog isOpen onOpenChange={jest.fn()} onConfirm={jest.fn()} tenantName="Demo Tenant" />);
  enterNotes();
  fireEvent.press(screen.getByLabelText("Charge a maintenance fee"));
  expect(screen.getByLabelText("Resolution notes")).toBeTruthy();
  expect(screen.getByLabelText("Maintenance fee amount")).toBeTruthy();
  expect(screen.getByText("Cancel")).toBeTruthy();
  expect(screen.getByText("Mark as Resolved")).toBeTruthy();
  expect(view.UNSAFE_queryAllByType(ScrollView)).toHaveLength(0);

  fireEvent.changeText(screen.getByLabelText("Maintenance fee amount"), "500");
  fireEvent.press(screen.getByText("Mark as Resolved"));
  expect(screen.getByText("Confirm Resolve")).toBeTruthy();
  expect(screen.getByText("Back")).toBeTruthy();
  expect(view.UNSAFE_queryAllByType(ScrollView)).toHaveLength(0);
});

it("resolves with trimmed notes and no fee when the option is off", async () => {
  const confirm = jest.fn().mockResolvedValue(true);
  const close = jest.fn();
  render(<ResolveRequestDialog isOpen onOpenChange={close} onConfirm={confirm} tenantName="Demo Tenant" />);
  enterNotes();
  fireEvent.press(screen.getByText("Mark as Resolved"));
  await waitFor(() => expect(confirm).toHaveBeenCalledWith("Repaired the pipe", undefined));
  expect(close).toHaveBeenCalledWith(false);
});

it.each(["", "0", "-1", "Infinity", "NaN"])("rejects invalid charged amount '%s' before confirmation", async (amount) => {
  const confirm = jest.fn();
  render(<ResolveRequestDialog isOpen onOpenChange={jest.fn()} onConfirm={confirm} tenantName="Demo Tenant" />);
  enterNotes();
  fireEvent.press(screen.getByLabelText("Charge a maintenance fee"));
  fireEvent.changeText(screen.getByLabelText("Maintenance fee amount"), amount);
  fireEvent.press(screen.getByText("Mark as Resolved"));
  expect(screen.getByText("Fee amount must be greater than ₱0.")).toBeTruthy();
  expect(confirm).not.toHaveBeenCalled();
});

it("requires notes before submitting", () => {
  const confirm = jest.fn();
  render(<ResolveRequestDialog isOpen onOpenChange={jest.fn()} onConfirm={confirm} tenantName="Demo Tenant" />);
  fireEvent.press(screen.getByText("Mark as Resolved"));
  expect(screen.getByText("Please enter resolution notes.")).toBeTruthy();
  expect(confirm).not.toHaveBeenCalled();
});

it("requires a second confirmation and lets the landlord go back without losing the draft", async () => {
  const confirm = jest.fn().mockResolvedValue(true);
  render(<ResolveRequestDialog isOpen onOpenChange={jest.fn()} onConfirm={confirm} tenantName="Demo Tenant" />);
  enterNotes();
  fireEvent.press(screen.getByLabelText("Charge a maintenance fee"));
  fireEvent.changeText(screen.getByLabelText("Maintenance fee amount"), "1250.50");
  fireEvent.press(screen.getByText("Mark as Resolved"));
  expect(confirm).not.toHaveBeenCalled();
  expect(screen.getByText(formatPesoDisplay(1250.50))).toBeTruthy();
  expect(screen.getByText("Charged to: Demo Tenant")).toBeTruthy();
  fireEvent.press(screen.getByText("Back"));
  expect(screen.getByLabelText("Maintenance fee amount").props.value).toBe("1250.50");
  fireEvent.press(screen.getByText("Mark as Resolved"));
  fireEvent.press(screen.getByText("Confirm Resolve"));
  await waitFor(() => expect(confirm).toHaveBeenCalledWith("Repaired the pipe", 1250.50));
});

it("retains the draft and displays backend errors on failure", async () => {
  const close = jest.fn();
  const confirm = jest.fn().mockResolvedValue(false);
  render(<ResolveRequestDialog isOpen onOpenChange={close} onConfirm={confirm} tenantName="Demo Tenant" errorMessage="This request can no longer be resolved." />);
  enterNotes();
  fireEvent.press(screen.getByText("Mark as Resolved"));
  await waitFor(() => expect(confirm).toHaveBeenCalled());
  expect(close).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Resolution notes").props.value).toBe(" Repaired the pipe ");
  expect(screen.getByText("This request can no longer be resolved.")).toBeTruthy();
});

it("clears the draft when closed and reopened", () => {
  const props = { onOpenChange: jest.fn(), onConfirm: jest.fn(), tenantName: "Demo Tenant" };
  const { rerender } = render(<ResolveRequestDialog {...props} isOpen />);
  enterNotes();
  fireEvent.press(screen.getByLabelText("Charge a maintenance fee"));
  fireEvent.changeText(screen.getByLabelText("Maintenance fee amount"), "500");
  rerender(<ResolveRequestDialog {...props} isOpen={false} />);
  rerender(<ResolveRequestDialog {...props} isOpen />);
  expect(screen.getByLabelText("Resolution notes").props.value).toBe("");
  expect(screen.queryByLabelText("Maintenance fee amount")).toBeNull();
});

it("blocks duplicate submits and cancellation until the save completes", async () => {
  let finish!: (value: boolean) => void;
  const confirm = jest.fn(() => new Promise<boolean>((resolve) => { finish = resolve; }));
  const close = jest.fn();
  render(<ResolveRequestDialog isOpen onOpenChange={close} onConfirm={confirm} tenantName="Demo Tenant" />);
  enterNotes();
  fireEvent.press(screen.getByText("Mark as Resolved"));
  fireEvent.press(screen.getByText("Cancel"));
  expect(confirm).toHaveBeenCalledTimes(1);
  expect(close).not.toHaveBeenCalled();
  await act(async () => { finish(true); });
  expect(close).toHaveBeenCalledWith(false);
});
