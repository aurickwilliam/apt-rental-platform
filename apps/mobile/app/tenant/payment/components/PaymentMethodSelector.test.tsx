import { fireEvent, render, screen } from "@testing-library/react-native";
import type { BankCode } from "@repo/constants";
import type { PaymentMethod } from "@repo/utils";
import PaymentMethodSelector from "./PaymentMethodSelector";

jest.mock("heroui-native", () => jest.requireActual("../../../../tests/support/heroUINativeStub"));
jest.mock("@/hooks/useTheme", () => ({ useColors: () => ({ colors: { primary: "#376BF5" } }) }));
jest.mock("hooks/useTheme", () => ({ useColors: () => ({ colors: { primary: "#376BF5" } }) }));
jest.mock("@tabler/icons-react-native", () => ({ IconBuildingBank: () => null, IconCash: () => null, IconCircleCheckFilled: () => null }));
jest.mock("./CashPaymentForm", () => () => null);

const ALL_METHODS: PaymentMethod[] = ["GCash", "Maya", "QRPh", "Bank Transfer", "Debit/Credit-Card", "Cash"];

function props(selectedMethod: PaymentMethod | null = null) {
  return {
    selectedMethod, acceptedMethods: ALL_METHODS, methodsLoading: false, methodsError: null as string | null,
    onRetryMethods: jest.fn(), amount: 15000, selectedBank: null as BankCode | null, onBankChange: jest.fn(),
    onPaymentMethodChange: jest.fn(),
    cashPaymentDate: null, onCashPaymentDateChange: jest.fn(),
  };
}

it("lists every method the landlord accepts as one choice list with nothing preselected", async () => {
  const options = props();
  await render(<PaymentMethodSelector {...options} />);
  const radios = screen.getAllByRole("radio");
  expect(radios).toHaveLength(6);
  expect(radios.every((radio) => !radio.props.accessibilityState.selected)).toBe(true);
  await fireEvent.press(screen.getByLabelText("Cash"));
  expect(options.onPaymentMethodChange).toHaveBeenCalledWith("Cash");
  // Preferences are gone: no preferred section, default badge or manage button.
  expect(screen.queryByText("Manage preferences")).toBeNull();
  expect(screen.queryByText("Preferred payment")).toBeNull();
  expect(screen.queryByText("Default")).toBeNull();
});

it("marks the method the tenant chose", async () => {
  await render(<PaymentMethodSelector {...props("Maya")} />);
  expect(screen.getByLabelText("Maya").props.accessibilityState.selected).toBe(true);
  expect(screen.getByLabelText("GCash").props.accessibilityState.selected).toBe(false);
});

it("offers only the methods the landlord accepts", async () => {
  await render(<PaymentMethodSelector {...props()} acceptedMethods={["Maya", "Cash"]} />);
  expect(screen.getAllByRole("radio")).toHaveLength(2);
  expect(screen.queryByLabelText("GCash")).toBeNull();
  expect(screen.getByLabelText("Maya")).toBeTruthy();
  expect(screen.getByLabelText("Cash")).toBeTruthy();
});

it("offers nothing while the accepted methods load, instead of guessing", async () => {
  await render(<PaymentMethodSelector {...props()} acceptedMethods={[]} methodsLoading />);
  expect(screen.queryAllByRole("radio")).toHaveLength(0);
  expect(screen.getByText("Loading payment methods…")).toBeTruthy();
});

it("offers nothing when the accepted methods fail to load and lets the tenant retry", async () => {
  const options = { ...props(), acceptedMethods: [] as PaymentMethod[], methodsError: "Couldn't load the payment methods your landlord accepts. Please try again." };
  await render(<PaymentMethodSelector {...options} />);
  expect(screen.queryAllByRole("radio")).toHaveLength(0);
  expect(screen.getByText(options.methodsError)).toBeTruthy();
  await fireEvent.press(screen.getByText("Retry"));
  expect(options.onRetryMethods).toHaveBeenCalledTimes(1);
});

it("has no in-app card form: card is entered on PayMongo's hosted page", async () => {
  await render(<PaymentMethodSelector {...props("Debit/Credit-Card")} />);
  expect(screen.getByLabelText("Debit/Credit Card").props.accessibilityState.selected).toBe(true);
  expect(screen.queryByText("Card Details")).toBeNull();
  expect(screen.queryByPlaceholderText("**** **** **** ****")).toBeNull();
});

it("shows the banks for Bank Transfer and disables one over its limit with the reason", async () => {
  const options = { ...props("Bank Transfer"), amount: 80000 };
  await render(<PaymentMethodSelector {...options} />);
  expect(screen.getByText("Choose your bank")).toBeTruthy();
  expect(screen.getByLabelText("BPI, unavailable. BPI allows up to ₱50,000 per payment.").props.accessibilityState.disabled).toBe(true);
  expect(screen.getByLabelText("UnionBank").props.accessibilityState.disabled).toBe(false);
  await fireEvent.press(screen.getByLabelText("UnionBank"));
  expect(options.onBankChange).toHaveBeenCalledWith("ubp");
});
