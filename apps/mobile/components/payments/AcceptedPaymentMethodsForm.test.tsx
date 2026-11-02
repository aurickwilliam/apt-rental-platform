import type { ReactNode } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import type { PaymentMethod } from "@repo/utils";
import AcceptedPaymentMethodsForm from "./AcceptedPaymentMethodsForm";

const mockToastShow = jest.fn();
jest.mock("heroui-native", () => ({
  ...jest.requireActual("../../tests/support/heroUINativeStub"),
  useToast: () => ({ toast: { show: mockToastShow } }),
}));
jest.mock("@/components/layout/StandardHeader", () => () => null);
jest.mock("@/components/layout/ScreenWrapper", () => {
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");
  return { __esModule: true, default: ({ header, children, footer }: { header?: ReactNode; children: ReactNode; footer?: ReactNode }) => <View>{header}{children}{footer}</View> };
});

const ALL: PaymentMethod[] = ["GCash", "Maya", "QRPh", "Bank Transfer", "Debit/Credit-Card", "Cash"];
function props(initialMethods: PaymentMethod[] = ALL) {
  return { initialMethods, onSave: jest.fn(async (next: PaymentMethod[]) => next), onCancel: jest.fn(), isSaving: false, loadError: null, onRetry: jest.fn() };
}

beforeEach(() => mockToastShow.mockClear());

it("lists every method, all on when the landlord has not limited them", () => {
  render(<AcceptedPaymentMethodsForm {...props()} />);
  const boxes = screen.getAllByRole("checkbox");
  expect(boxes).toHaveLength(6);
  expect(boxes.every((box) => box.props.accessibilityState.checked)).toBe(true);
  expect(screen.getByLabelText("Accept Bank Transfer")).toBeTruthy();
});

it("saves only the methods left on, as method names", async () => {
  const options = props();
  render(<AcceptedPaymentMethodsForm {...options} />);
  fireEvent.press(screen.getByLabelText("Accept GCash"));
  fireEvent.press(screen.getByLabelText("Accept QRPh"));
  await act(async () => { fireEvent.press(screen.getByText("Save methods")); });
  expect(options.onSave).toHaveBeenCalledWith(["Maya", "Bank Transfer", "Debit/Credit-Card", "Cash"]);
  expect(options.onCancel).toHaveBeenCalledTimes(1);
});

it("will not save an empty list and explains why", () => {
  const options = props(["Cash"]);
  render(<AcceptedPaymentMethodsForm {...options} />);
  fireEvent.press(screen.getByLabelText("Accept Cash"));
  expect(screen.getByText("Keep at least one payment method on.")).toBeTruthy();
  fireEvent.press(screen.getByText("Save methods"));
  expect(options.onSave).not.toHaveBeenCalled();
});

it("keeps the draft and shows the error when saving fails", async () => {
  const options = { ...props(), onSave: jest.fn(async () => { throw new Error("Verify your account to use landlord features."); }) };
  render(<AcceptedPaymentMethodsForm {...options} />);
  fireEvent.press(screen.getByLabelText("Accept Cash"));
  await act(async () => { fireEvent.press(screen.getByText("Save methods")); });
  expect(screen.getByText("Verify your account to use landlord features.")).toBeTruthy();
  expect(screen.getByLabelText("Accept Cash").props.accessibilityState.checked).toBe(false);
  expect(options.onCancel).not.toHaveBeenCalled();
});
