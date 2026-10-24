import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";

import { getAllLandlordPaymentsQueryKey } from "./useAllLandlordPayments";
import { getLandlordPaymentsQueryKey, useLandlordPaymentConfirmation, useLandlordPaymentDecline } from "./useLandlordPayments";

const mockUpdate = jest.fn();
jest.mock("@/service/landlord/landlordService", () => ({
  fetchLandlordPayments: jest.fn(),
  fetchAllLandlordPayments: jest.fn(),
  updateLandlordPaymentStatus: (...args: unknown[]) => mockUpdate(...args),
}));
jest.mock("@/hooks/auth", () => ({ useCurrentUser: () => ({ data: { id: "landlord-1" } }) }));
jest.mock("@/hooks/tenancy", () => ({ getLandlordTenancyQueryKey: (id: string | undefined) => ["landlord-tenancy", id] }));

const pending = { id: "cash", status: "pending", method: "cash", apartment_id: "unit-a" };
const other = { id: "other", status: "pending", method: "cash", apartment_id: "unit-b" };

const clients: QueryClient[] = [];

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: 0 } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  clients.push(client);
  client.setQueryData(getLandlordPaymentsQueryKey("unit-a"), [pending]);
  client.setQueryData(getAllLandlordPaymentsQueryKey("landlord-1"), { units: [], payments: [pending, other] });
  return { client, wrapper };
}

const statuses = (client: QueryClient) =>
  (client.getQueryData(getAllLandlordPaymentsQueryKey("landlord-1")) as { payments: { id: string; status: string }[] }).payments.map(
    (payment) => `${payment.id}:${payment.status}`,
  );

beforeEach(() => { mockUpdate.mockReset(); });
afterEach(() => { clients.splice(0).forEach((client) => client.clear()); });

it("flips the payment in the unit list and the all-units list together, leaving others alone, and marks both stale", async () => {
  mockUpdate.mockResolvedValue({ success: true });
  const { client, wrapper } = setup();
  const { result } = renderHook(() => useLandlordPaymentConfirmation("unit-a"), { wrapper });

  await act(async () => { result.current.mutate("cash"); });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(statuses(client)).toEqual(["cash:paid", "other:pending"]);
  expect((client.getQueryData(getLandlordPaymentsQueryKey("unit-a")) as { status: string }[])[0].status).toBe("paid");
  expect(client.getQueryState(getAllLandlordPaymentsQueryKey("landlord-1"))?.isInvalidated).toBe(true);
});

it("restores the all-units list when the confirmation fails", async () => {
  mockUpdate.mockResolvedValue({ success: false, error: "Could not update payment status." });
  const { client, wrapper } = setup();
  const { result } = renderHook(() => useLandlordPaymentConfirmation("unit-a"), { wrapper });

  await act(async () => { result.current.mutate("cash"); });
  await waitFor(() => expect(result.current.isError || result.current.isSuccess).toBe(true));

  expect(statuses(client)).toEqual(["cash:pending", "other:pending"]);
});

it("sends the decision to the service: paid to confirm, rejected to decline", async () => {
  mockUpdate.mockResolvedValue({ success: true });
  const { wrapper } = setup();
  const confirm = renderHook(() => useLandlordPaymentConfirmation("unit-a"), { wrapper });
  await act(async () => { confirm.result.current.mutate("cash"); });
  await waitFor(() => expect(confirm.result.current.isSuccess).toBe(true));
  expect(mockUpdate).toHaveBeenLastCalledWith("cash", "paid");

  const decline = renderHook(() => useLandlordPaymentDecline("unit-a"), { wrapper });
  await act(async () => { decline.result.current.mutate("cash"); });
  await waitFor(() => expect(decline.result.current.isSuccess).toBe(true));
  expect(mockUpdate).toHaveBeenLastCalledWith("cash", "rejected");
});

it("shows a declined payment as rejected in the unit list and the all-units list, and restores both on failure", async () => {
  mockUpdate.mockResolvedValueOnce({ success: true });
  const { client, wrapper } = setup();
  const { result } = renderHook(() => useLandlordPaymentDecline("unit-a"), { wrapper });
  await act(async () => { result.current.mutate("cash"); });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(statuses(client)).toEqual(["cash:rejected", "other:pending"]);
  expect((client.getQueryData(getLandlordPaymentsQueryKey("unit-a")) as { status: string }[])[0].status).toBe("rejected");

  const failing = setup();
  mockUpdate.mockResolvedValueOnce({ success: false, error: "Could not update payment status." });
  const again = renderHook(() => useLandlordPaymentDecline("unit-a"), { wrapper: failing.wrapper });
  await act(async () => { again.result.current.mutate("cash"); });
  await waitFor(() => expect(again.result.current.isError).toBe(true));
  expect(statuses(failing.client)).toEqual(["cash:pending", "other:pending"]);
});
