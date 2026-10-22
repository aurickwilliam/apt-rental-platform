import type { ReactNode } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import type { PaymentMethodPreference } from "@repo/utils";
import PaymentPreferencesForm from "./PaymentPreferencesForm";

const mockGuard = jest.fn();
jest.mock("expo-router/react-navigation", () => ({ usePreventRemove: (busy: boolean) => mockGuard(busy) }));
jest.mock("heroui-native", () => jest.requireActual("../../tests/support/heroUINativeStub"));
jest.mock("@/components/layout/StandardHeader", () => () => null);
jest.mock("@/components/layout/ScreenWrapper", () => {
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");
  return { __esModule: true, default: ({ header, children, footer }: { header?: ReactNode; children: ReactNode; footer?: ReactNode }) => <View>{header}{children}{footer}</View> };
});

const EMPTY: PaymentMethodPreference = { savedMethods: [], defaultMethod: null };
const CASH: PaymentMethodPreference = { savedMethods: ["Cash"], defaultMethod: "Cash" };
function props(initialPreferences = EMPTY) {
  return { initialPreferences, onSave: jest.fn(async (next: PaymentMethodPreference) => next), onCancel: jest.fn(), isSaving: false, loadError: null, onRetry: jest.fn() };
}

it("offers all five preferred types and a default without collecting credentials", async () => {
  const options = props();
  render(<PaymentPreferencesForm {...options} />);
  expect(screen.getAllByRole("checkbox")).toHaveLength(5);
  expect(screen.queryAllByRole("radio")).toHaveLength(0);
  fireEvent.press(screen.getByLabelText("Prefer Debit/Credit Card"));
  expect(screen.getByLabelText("Default Debit/Credit Card").props.accessibilityState.checked).toBe(true);
  expect(screen.queryAllByRole("textbox")).toHaveLength(0);
  fireEvent.press(screen.getByText("Save preferences"));
  await waitFor(() => expect(options.onSave).toHaveBeenCalledWith({ savedMethods: ["Debit/Credit-Card"], defaultMethod: "Debit/Credit-Card" }));
});

it("supports changing the default, removing it, and clearing every preference", async () => {
  const options = props({ savedMethods: ["Cash", "GCash"], defaultMethod: "Cash" });
  render(<PaymentPreferencesForm {...options} />);
  fireEvent.press(screen.getByLabelText("Default GCash"));
  expect(screen.getByLabelText("Default GCash").props.accessibilityState.checked).toBe(true);
  fireEvent.press(screen.getByLabelText("Prefer GCash"));
  expect(screen.getByLabelText("Default Cash").props.accessibilityState.checked).toBe(true);
  fireEvent.press(screen.getByLabelText("Prefer Cash"));
  expect(screen.queryAllByRole("radio")).toHaveLength(0);
  fireEvent.press(screen.getByText("Save preferences"));
  await waitFor(() => expect(options.onSave).toHaveBeenCalledWith(EMPTY));
});

it("does not overwrite an edited draft during background refresh", () => {
  const options = props(CASH);
  const { rerender } = render(<PaymentPreferencesForm {...options} />);
  fireEvent.press(screen.getByLabelText("Prefer Maya"));
  rerender(<PaymentPreferencesForm {...options} initialPreferences={{ savedMethods: ["GCash"], defaultMethod: "GCash" }} />);
  expect(screen.getByLabelText("Prefer Maya").props.accessibilityState.checked).toBe(true);
  expect(screen.getByLabelText("Prefer Cash").props.accessibilityState.checked).toBe(true);
});

it("retains the draft on a failed save and lets the user retry", async () => {
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  const options = props();
  options.onSave.mockRejectedValueOnce(new Error("Network error"));
  render(<PaymentPreferencesForm {...options} />);
  fireEvent.press(screen.getByLabelText("Prefer Maya"));
  fireEvent.press(screen.getByText("Save preferences"));
  await waitFor(() => expect(screen.getByText("Couldn't save your payment preferences. Please try again.")).toBeTruthy());
  expect(screen.getByLabelText("Prefer Maya").props.accessibilityState.checked).toBe(true);
  fireEvent.press(screen.getByText("Save preferences"));
  await waitFor(() => expect(options.onSave).toHaveBeenCalledTimes(2));
  log.mockRestore();
});

it("blocks duplicate saves, edits and dismissal while saving", async () => {
  let finish!: (value: PaymentMethodPreference) => void;
  const options = props();
  options.onSave.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
  render(<PaymentPreferencesForm {...options} />);
  fireEvent.press(screen.getByLabelText("Prefer Cash"));
  fireEvent.press(screen.getByText("Save preferences"));
  expect(screen.getByLabelText("Prefer Cash").props.accessibilityState.disabled).toBe(true);
  expect(mockGuard).toHaveBeenLastCalledWith(true);
  fireEvent.press(screen.getByText("Cancel"));
  expect(options.onCancel).not.toHaveBeenCalled();
  expect(options.onSave).toHaveBeenCalledTimes(1);
  await act(async () => { finish(CASH); });
  await waitFor(() => expect(options.onCancel).toHaveBeenCalledTimes(1));
  expect(mockGuard).toHaveBeenLastCalledWith(false);
});

it("cancels without persisting unsaved changes", () => {
  const options = props();
  render(<PaymentPreferencesForm {...options} />);
  fireEvent.press(screen.getByLabelText("Prefer Cash"));
  fireEvent.press(screen.getByText("Cancel"));
  expect(options.onSave).not.toHaveBeenCalled();
  expect(options.onCancel).toHaveBeenCalledTimes(1);
});
