import type { ComponentProps, ReactNode } from "react";
import { Linking } from "react-native";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import RenewalProposalForm from "@/components/renewals/RenewalProposalForm";
import RenewalPayment from "@/components/renewals/RenewalPayment";
import type PaymentMethodSelector from "@/app/tenant/payment/components/PaymentMethodSelector";
import { proposal, renewalContext } from "./fixtures";

const mockMethods = jest.fn();
const mockSelector = jest.fn();
const mockPick = jest.fn();
const mockCheck = jest.fn();
const mockCancel = jest.fn();
const mockCash = jest.fn();
const mockCheckout = jest.fn();
const mockOpenURL = jest.fn();

jest.mock("@/hooks/payments/useAcceptedPaymentMethods", () => ({ useAcceptedPaymentMethods: () => mockMethods() }));
jest.mock("@/stores/usePortalStore", () => ({
  usePortalStore: Object.assign((select: (state: { authUserId: string; portal: string }) => unknown) => select({ authUserId: "account", portal: "tenant" }), {
    getState: () => ({ authUserId: "account", portal: "tenant" }),
  }),
}));
jest.mock("@/service/tenancy/leaseRenewalService", () => ({ pickRenewalFile: () => mockPick() }));
jest.mock("@/service/payments/paymentService", () => ({ createCashPayment: (...args: unknown[]) => mockCash(...args) }));
jest.mock("@/service/payments/paymongoService", () => ({
  createCheckoutSession: (...args: unknown[]) => mockCheckout(...args),
  getCheckoutSessionStatus: (...args: unknown[]) => mockCheck(...args), cancelCheckoutSession: (...args: unknown[]) => mockCancel(...args),
}));
jest.mock("expo-linking", () => ({ createURL: () => "mobile://verify" }));
jest.mock("@/app/tenant/payment/components/PaymentMethodSelector", () => ({ __esModule: true, default: (props: ComponentProps<typeof PaymentMethodSelector>) => { mockSelector(props); return null; } }));
jest.mock("@/components/inputs/DropdownField", () => ({ __esModule: true, default: ({ label, value }: { label: string; value: string }) => {
  const { Text } = jest.requireActual("react-native");
  return <Text>{label}: {value}</Text>;
} }));
jest.mock("@/hooks/useTheme", () => ({ useColors: () => ({ colors: { primaryLightForeground: "#2F5FE0", textPrimary: "#333333" } }) }));
jest.mock("@tabler/icons-react-native", () => Object.fromEntries(["IconFileText", "IconFileUpload", "IconInfoCircle", "IconCreditCard"].map((name) => [name, () => null])));
jest.mock("heroui-native", () => {
  const stub = jest.requireActual("../support/heroUINativeStub");
  return { ...stub, TextArea: stub.Input, TextField: ({ children }: { children: ReactNode }) => <>{children}</> };
});

beforeEach(() => {
  jest.clearAllMocks();
  mockMethods.mockReturnValue({ acceptedMethods: ["GCash", "Cash"], loading: false, error: null, refetch: jest.fn() });
  mockCheckout.mockResolvedValue({ checkoutUrl: "https://checkout.example.test" });
  jest.spyOn(Linking, "openURL").mockImplementation(mockOpenURL);
});
afterEach(() => { jest.restoreAllMocks(); });

it("groups the landlord draft and never guesses a retained deposit", () => {
  const onSubmit = jest.fn();
  render(<RenewalProposalForm context={renewalContext("awaiting_payment_configuration")} busy={false} onSubmit={onSubmit} />);
  for (const label of ["Lease details", "Deposit treatment", "Advance rent", "Supporting document"]) expect(screen.getByText(label)).toBeTruthy();
  expect(screen.getByLabelText("Declared retained deposit").props.value).toBe("");
  fireEvent.changeText(screen.getByLabelText("Declared retained deposit"), "30000");
  fireEvent.changeText(screen.getByLabelText("Monthly rent"), "17000");
  fireEvent.press(screen.getByText("Send proposal for review"));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ retainedDeposit: "30000", monthlyRent: "17000" }), null);
});

it("retains a draft on re-render and locks editing and submission while saving", () => {
  const data = renewalContext("awaiting_payment_configuration");
  const onSubmit = jest.fn();
  const view = render(<RenewalProposalForm context={data} busy={false} onSubmit={onSubmit} />);
  fireEvent.changeText(screen.getByLabelText("Declared retained deposit"), "25000");
  view.rerender(<RenewalProposalForm context={{ ...data }} busy onSubmit={onSubmit} />);
  expect(screen.getByLabelText("Declared retained deposit").props.value).toBe("25000");
  expect(screen.getByLabelText("Declared retained deposit").props.editable).toBe(false);
  expect(screen.getByRole("button", { name: "Send proposal for review" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Add document" })).toBeDisabled();
});

it.each(["loading", "error"])("keeps payment closed while accepted methods are %s", (state) => {
  mockMethods.mockReturnValue({ acceptedMethods: [], loading: state === "loading", error: state === "error" ? "Unavailable" : null });
  render(<RenewalPayment context={renewalContext("awaiting_payment")} busy={false} run={jest.fn()} />);
  expect(screen.getByRole("button", { name: "Pay renewal" })).toBeDisabled();
  expect(mockSelector.mock.calls[0][0]).toEqual(expect.objectContaining({ description: "Choose how to pay the renewal charges shown above.", selectedMethod: null, acceptedMethods: [], methodsLoading: state === "loading" }));
});

it("preserves online checkout and the server-provided renewal total after an explicit method choice", async () => {
  const run = jest.fn(async (operation: (isCurrent: () => boolean) => Promise<unknown>) => { await operation(() => true); return true; });
  render(<RenewalPayment context={renewalContext("awaiting_payment")} busy={false} run={run} />);
  expect(screen.getByText("₱ 22,000")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Pay renewal" })).toBeDisabled();
  act(() => { mockSelector.mock.calls[0][0].onPaymentMethodChange("GCash"); });
  await act(async () => { fireEvent.press(screen.getByText("Pay renewal")); });
  expect(mockCheckout).toHaveBeenCalledWith(expect.objectContaining({ renewalProposalId: proposal.id, amount: 22000, method: "gcash" }));
  expect(mockOpenURL).toHaveBeenCalledWith("https://checkout.example.test");
});

it("shows pending online verification controls instead of offering another payment", async () => {
  const data = { ...renewalContext("payment_verification_pending"), payment: { id: "payment", status: "pending", referenceId: "APT-12345678", sessionId: "session" } };
  const run = jest.fn(async (operation: (isCurrent: () => boolean) => Promise<unknown>) => { await operation(() => true); return true; });
  render(<RenewalPayment context={data} busy={false} run={run} />);
  expect(screen.queryByText("Pay renewal")).toBeNull();
  expect(mockSelector).not.toHaveBeenCalled();
  await act(async () => { fireEvent.press(screen.getByText("Check payment")); });
  expect(mockCheck).toHaveBeenCalledWith("session");
  await act(async () => { fireEvent.press(screen.getByText("Cancel online payment")); });
  expect(mockCancel).toHaveBeenCalledWith("session");
});

it("keeps pending cash read-only while waiting for landlord confirmation", () => {
  const data = { ...renewalContext("payment_verification_pending"), payment: { id: "cash", status: "pending", referenceId: null, sessionId: null } };
  render(<RenewalPayment context={data} busy={false} run={jest.fn()} />);
  expect(screen.getByText(/Cash awaits landlord confirmation/)).toBeTruthy();
  expect(screen.queryByText("Pay renewal")).toBeNull();
  expect(screen.queryByText("Cancel online payment")).toBeNull();
});
