import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import CheckPaymentDialog from "./CheckPaymentDialog";

jest.mock("heroui-native", () => ({ ...jest.requireActual("../../../../tests/support/heroUINativeStub"), Spinner: () => null }));
jest.mock("@/components/display/AppDialog", () => {
  const { Text, View } = jest.requireActual("react-native");
  return {
    __esModule: true,
    default: ({ isOpen, title, children, footer }: { isOpen: boolean; title: string; children: ReactNode; footer?: ReactNode }) =>
      isOpen ? <View><Text>{title}</Text>{children}{footer}</View> : null,
  };
});

const mockCancel = jest.fn();
const mockDetails = jest.fn();
jest.mock("@/service/payments/paymongoService", () => ({
  cancelCheckoutSession: (...args: unknown[]) => mockCancel(...args),
  getCheckoutSessionDetails: (...args: unknown[]) => mockDetails(...args),
  NETWORK_ERROR_CODE: "network_error",
  PaymongoError: class PaymongoError extends Error { reason = ""; code: string | null = null },
}));

const onOpenChange = jest.fn();
const onPaid = jest.fn();

function renderDialog() {
  const client = new QueryClient();
  const invalidate = jest.spyOn(client, "invalidateQueries");
  render(
    <QueryClientProvider client={client}>
      <CheckPaymentDialog referenceId="APT-ABCD1234" isOpen onOpenChange={onOpenChange} onPaid={onPaid} />
    </QueryClientProvider>,
  );
  return invalidate;
}

const invalidatedKeys = (spy: jest.SpyInstance) => spy.mock.calls.map(([filters]) => (filters as { queryKey: unknown[] }).queryKey[0]);

beforeEach(() => jest.clearAllMocks());

it("shows the still-open checkout with its actions", async () => {
  mockDetails.mockResolvedValue({ status: "pending", checkoutUrl: "https://checkout.example/abc" });
  renderDialog();
  expect(await screen.findByText("Payment not completed yet")).toBeTruthy();
  expect(mockDetails).toHaveBeenCalledWith("APT-ABCD1234");
  expect(screen.getByText("Continue checkout")).toBeTruthy();
  expect(screen.getByText("Check again")).toBeTruthy();
  expect(screen.getByText("Cancel payment")).toBeTruthy();
});

it("closes and opens the receipt when PayMongo says the payment is paid", async () => {
  mockDetails.mockResolvedValue({ status: "paid", checkoutUrl: null });
  renderDialog();
  await waitFor(() => expect(onPaid).toHaveBeenCalledWith("APT-ABCD1234"));
  expect(onOpenChange).toHaveBeenCalledWith(false);
});

it("cancels an open checkout, refreshes the lists and reports it cancelled", async () => {
  mockDetails.mockResolvedValue({ status: "pending", checkoutUrl: null });
  mockCancel.mockResolvedValue("failed");
  const invalidate = renderDialog();
  fireEvent.press(await screen.findByText("Cancel payment"));
  expect(await screen.findByText("Payment cancelled")).toBeTruthy();
  expect(mockCancel).toHaveBeenCalledWith("APT-ABCD1234");
  expect(invalidatedKeys(invalidate)).toEqual(expect.arrayContaining(["payments", "tenancy"]));
  fireEvent.press(screen.getByText("Close"));
  expect(onOpenChange).toHaveBeenCalledWith(false);
});

it("says a closed attempt was not charged and refreshes the lists", async () => {
  mockDetails.mockResolvedValue({ status: "expired", checkoutUrl: null });
  const invalidate = renderDialog();
  expect(await screen.findByText("Payment expired")).toBeTruthy();
  expect(invalidatedKeys(invalidate)).toEqual(expect.arrayContaining(["payments", "tenancy"]));
});

it("offers a retry when the check fails", async () => {
  mockDetails.mockRejectedValueOnce(new Error("boom")).mockResolvedValueOnce({ status: "pending", checkoutUrl: null });
  renderDialog();
  expect(await screen.findByText("Could not check your payment")).toBeTruthy();
  fireEvent.press(screen.getByText("Try again"));
  expect(await screen.findByText("Payment not completed yet")).toBeTruthy();
});

it("checks once per open even when the parent re-renders with new callbacks", async () => {
  mockDetails.mockResolvedValue({ status: "pending", checkoutUrl: null });
  const client = new QueryClient();
  const tree = (open: () => void) => (
    <QueryClientProvider client={client}>
      <CheckPaymentDialog referenceId="APT-ABCD1234" isOpen onOpenChange={open} onPaid={() => undefined} />
    </QueryClientProvider>
  );
  const view = render(tree(() => undefined));
  expect(await screen.findByText("Payment not completed yet")).toBeTruthy();
  view.rerender(tree(() => undefined));
  view.rerender(tree(() => undefined));
  expect(screen.getByText("Payment not completed yet")).toBeTruthy();
  expect(mockDetails).toHaveBeenCalledTimes(1);
});
