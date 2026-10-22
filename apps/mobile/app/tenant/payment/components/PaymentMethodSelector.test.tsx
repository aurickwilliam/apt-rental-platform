import { fireEvent, render, screen } from "@testing-library/react-native";
import type { PaymentMethod, PaymentMethodPreference } from "@repo/utils";
import PaymentMethodSelector from "./PaymentMethodSelector";

jest.mock("heroui-native", () => jest.requireActual("../../../../tests/support/heroUINativeStub"));
jest.mock("@/hooks/useTheme", () => ({ useColors: () => ({ colors: { primary: "#376BF5" } }) }));
jest.mock("hooks/useTheme", () => ({ useColors: () => ({ colors: { primary: "#376BF5" } }) }));
jest.mock("@tabler/icons-react-native", () => ({ IconCash: () => null, IconSettings: () => null, IconCircleCheckFilled: () => null }));
jest.mock("./CashPaymentForm", () => () => null);

function props(preferences: PaymentMethodPreference = { savedMethods: [], defaultMethod: null }, selectedMethod: PaymentMethod | null = null) {
  return {
    preferences, selectedMethod, preferencesLoading: false, preferencesError: null as string | null,
    onRetryPreferences: jest.fn(), onManagePreferences: jest.fn(), onPaymentMethodChange: jest.fn(),
    cardInformation: { cardNumber: "", expiryDate: "", cardholderName: "", cvv: "", isPaymentSaved: false, isCardNumberValid: false },
    onCardInformationChange: jest.fn(), cashPaymentDate: null, onCashPaymentDateChange: jest.fn(),
  };
}

it("shows preferred types first, labels the default, and keeps all other types available", () => {
  const options = props({ savedMethods: ["GCash", "Maya"], defaultMethod: "Maya" }, "Maya");
  render(<PaymentMethodSelector {...options} />);
  expect(screen.getAllByRole("radio")).toHaveLength(5);
  expect(screen.getByText("Preferred payment")).toBeTruthy();
  expect(screen.getByText("Other payment methods")).toBeTruthy();
  expect(screen.getByLabelText("Maya, default").props.accessibilityState.selected).toBe(true);
  expect(screen.getByText("Default")).toBeTruthy();
  fireEvent.press(screen.getByLabelText("Cash"));
  expect(options.onPaymentMethodChange).toHaveBeenCalledWith("Cash");
  fireEvent.press(screen.getByText("Manage preferences"));
  expect(options.onManagePreferences).toHaveBeenCalledTimes(1);
});

it("allows manual checkout and retry when preferences fail to load", () => {
  const options = { ...props(), preferencesError: "Couldn't load your payment preferences. Please try again." };
  render(<PaymentMethodSelector {...options} />);
  expect(screen.getAllByRole("radio")).toHaveLength(5);
  fireEvent.press(screen.getByLabelText("GCash"));
  expect(options.onPaymentMethodChange).toHaveBeenCalledWith("GCash");
  fireEvent.press(screen.getByText("Retry preferences"));
  expect(options.onRetryPreferences).toHaveBeenCalledTimes(1);
});

it("still requires new card details when Card is the preferred default", () => {
  render(<PaymentMethodSelector {...props({ savedMethods: ["Debit/Credit-Card"], defaultMethod: "Debit/Credit-Card" }, "Debit/Credit-Card")} />);
  expect(screen.getByText("Card Details")).toBeTruthy();
  expect(screen.getByPlaceholderText("**** **** **** ****").props.value).toBe("");
  expect(screen.queryByText(/Visa ••/)).toBeNull();
  expect(screen.queryByText(/Mastercard ••/)).toBeNull();
});

it("does not duplicate methods when every type is preferred", () => {
  render(<PaymentMethodSelector {...props({ savedMethods: ["GCash", "Maya", "QRPh", "Debit/Credit-Card", "Cash"], defaultMethod: "Cash" }, "Cash")} />);
  expect(screen.getAllByRole("radio")).toHaveLength(5);
  expect(screen.queryByText("Other payment methods")).toBeNull();
});
