import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PaymentVerify from "./verify";

const mockReplace = jest.fn();
let mockParams: Record<string, string> = {};
jest.mock("expo-router", () => ({ useRouter: () => ({ replace: mockReplace, push: jest.fn() }), useLocalSearchParams: () => mockParams }));
jest.mock("react-native-safe-area-context", () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock("heroui-native", () => ({ ...jest.requireActual("../../../tests/support/heroUINativeStub"), Spinner: () => null }));
jest.mock("@/components/display/ErrorDialog", () => () => null);

const mockCancel = jest.fn();
const mockDetails = jest.fn();
jest.mock("@/service/payments/paymongoService", () => ({
  cancelCheckoutSession: (...args: unknown[]) => mockCancel(...args),
  getCheckoutSessionDetails: (...args: unknown[]) => mockDetails(...args),
  NETWORK_ERROR_CODE: "network_error",
  PaymongoError: class PaymongoError extends Error { reason = ""; code: string | null = null },
}));

async function renderVerify() {
  const client = new QueryClient();
  const invalidate = jest.spyOn(client, "invalidateQueries");
  await render(<QueryClientProvider client={client}><PaymentVerify /></QueryClientProvider>);
  return invalidate;
}

const invalidatedKeys = (spy: jest.SpyInstance) => spy.mock.calls.map(([filters]) => (filters as { queryKey: unknown[] }).queryKey[0]);

beforeEach(() => { jest.clearAllMocks(); mockParams = {}; });

it("refreshes the cached payments and tenancy after a cancelled checkout, so no stale banner stays", async () => {
  mockParams = { sessionId: "APT-ABCD1234", cancelled: "1" };
  mockCancel.mockResolvedValue("failed");
  const invalidate = await renderVerify();
  expect(await screen.findByText("Payment cancelled")).toBeTruthy();
  expect(mockCancel).toHaveBeenCalledWith("APT-ABCD1234");
  expect(invalidatedKeys(invalidate)).toEqual(expect.arrayContaining(["payments", "tenancy"]));
  await fireEvent.press(screen.getByText("Back to payment"));
  expect(mockReplace).toHaveBeenCalledWith("/tenant/payment");
});

it("also refreshes after a plain status check that finds the payment unpaid", async () => {
  mockParams = { sessionId: "APT-ABCD1234" };
  mockDetails.mockResolvedValue({ status: "failed", checkoutUrl: null });
  const invalidate = await renderVerify();
  await waitFor(() => expect(invalidatedKeys(invalidate)).toEqual(expect.arrayContaining(["payments", "tenancy"])));
  expect(mockCancel).not.toHaveBeenCalled();
});
