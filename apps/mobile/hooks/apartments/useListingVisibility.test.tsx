import type { PropsWithChildren } from "react";
import { act, renderHook } from "@testing-library/react-native";
import { notifyManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePortalStore } from "@/stores/usePortalStore";
import { useCurrentUser } from "@/hooks/auth/useCurrentUser";
import { changeListingVisibility } from "@/service/apartments/listingVisibilityService";
import { useListingVisibility } from "./useListingVisibility";

const mockToast = jest.fn();
jest.mock("heroui-native", () => ({ useToast: () => ({ toast: { show: mockToast } }) }));
jest.mock("@/hooks/auth/useCurrentUser", () => ({ useCurrentUser: jest.fn() }));
jest.mock("@/service/apartments/listingVisibilityService", () => ({ changeListingVisibility: jest.fn() }));
jest.mock("./useApartmentDetails", () => ({ getApartmentDetailsQueryKey: (id: string) => ["apartment-details", id] }));
jest.mock("./useLandlordUnits", () => ({ getLandlordUnitsQueryKey: (id: string) => ["landlord-units", id] }));
jest.mock("@/stores/usePortalStore", () => {
  const { create } = jest.requireActual<typeof import("zustand")>("zustand");
  return { usePortalStore: create(() => ({ portal: "landlord", authUserId: "auth", loading: false })) };
});

const write = changeListingVisibility as jest.Mock;
const user = useCurrentUser as jest.Mock;
const options = { apartmentId: "unit", ownerId: "owner", status: "available", hasActiveTenancy: false, tenancyReady: true };
const clients: QueryClient[] = [];
beforeAll(() => notifyManager.setNotifyFunction(callback => { act(callback); }));
afterAll(() => notifyManager.setNotifyFunction(callback => callback()));
beforeEach(() => {
  jest.clearAllMocks();
  usePortalStore.setState({ portal: "landlord", authUserId: "auth", loading: false });
  user.mockReturnValue({ data: { id: "owner", user_id: "auth", roles: ["landlord"], account_status: "verified" } });
  write.mockResolvedValue("under_maintenance");
});
afterEach(() => { act(() => { for (const client of clients.splice(0)) client.clear(); }); });

function setup(overrides: Partial<typeof options> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  clients.push(client);
  client.setQueryData(["apartment-details", "unit"], { id: "unit", status: "available", landlord: { id: "owner" } });
  client.setQueryData(["landlord-units", "owner"], { monthlyProfit: 500, apartments: [
    { id: "unit", status: "available", isHiddenByAdmin: true }, { id: "other", status: "occupied" },
  ] });
  client.setQueryData(["searchSections", "CAMANAVA", "", null], []);
  client.setQueryData(["payment-history", "owner"], []);
  const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const hook = renderHook((props: typeof options) => useListingVisibility(props), { wrapper, initialProps: { ...options, ...overrides } });
  return { ...hook, client };
}

it("does not write until confirmed, then updates both caches while preserving moderation and other units", async () => {
  const { result, client } = setup();
  act(() => result.current.open());
  expect(result.current.isOpen).toBe(true);
  expect(write).not.toHaveBeenCalled();
  await act(async () => { await result.current.confirm(); });
  expect(write).toHaveBeenCalledTimes(1);
  expect(client.getQueryData(["apartment-details", "unit"])).toMatchObject({ status: "under_maintenance" });
  expect(client.getQueryData(["landlord-units", "owner"])).toMatchObject({ monthlyProfit: 500, apartments: [
    { id: "unit", status: "under_maintenance", isHiddenByAdmin: true }, { id: "other", status: "occupied" },
  ] });
  expect(client.getQueryState(["searchSections", "CAMANAVA", "", null])?.isInvalidated).toBe(true);
  expect(client.getQueryState(["payment-history", "owner"])?.isInvalidated).toBe(false);
  expect(result.current.isOpen).toBe(false);
  expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ label: "Listing hidden" }));
});

it("shows the inverse action while hidden and cancels without writing", () => {
  const { result } = setup({ status: "under_maintenance" });
  expect(result.current.label).toBe("Show Listing");
  act(() => result.current.open());
  act(() => result.current.close());
  expect(result.current.isOpen).toBe(false);
  expect(write).not.toHaveBeenCalled();
});

it.each([{ status: "occupied" }, { hasActiveTenancy: true }, { tenancyReady: false }, { ownerId: "another-owner" }, { status: "unverified" }])("fails closed for %j", overrides => {
  const { result } = setup(overrides);
  expect(result.current.allowed).toBe(false);
  act(() => result.current.open());
  expect(result.current.isOpen).toBe(false);
});

it("never offers the action to the tenant portal or a non-verified landlord", () => {
  usePortalStore.setState({ portal: "tenant" });
  const tenant = setup();
  expect(tenant.result.current.allowed).toBe(false);
  tenant.unmount();
  usePortalStore.setState({ portal: "landlord" });
  user.mockReturnValue({ data: { id: "owner", user_id: "auth", roles: ["landlord"], account_status: "pending" } });
  expect(setup().result.current.allowed).toBe(false);
});

it("holds the dialog open and blocks duplicate confirmation and dismissal while saving", async () => {
  let resolve!: (value: string) => void;
  write.mockReturnValue(new Promise<string>(yes => { resolve = yes; }));
  const { result } = setup();
  act(() => result.current.open());
  let pending!: Promise<void>;
  await act(async () => { pending = result.current.confirm(); });
  act(() => { result.current.close(); void result.current.confirm(); });
  expect(result.current.busy).toBe(true);
  expect(result.current.isOpen).toBe(true);
  expect(write).toHaveBeenCalledTimes(1);
  await act(async () => { resolve("under_maintenance"); await pending; });
  expect(result.current.busy).toBe(false);
});

it("keeps database errors inline without changing data or reporting success", async () => {
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  write.mockRejectedValue({ message: "This property has an active tenancy." });
  const { result, client } = setup();
  act(() => result.current.open());
  await act(async () => { await result.current.confirm(); });
  expect(result.current.error).toBe("This property has an active tenancy.");
  expect(result.current.isOpen).toBe(true);
  expect(result.current.busy).toBe(false);
  expect(client.getQueryData(["apartment-details", "unit"])).toMatchObject({ status: "available" });
  expect(mockToast).not.toHaveBeenCalled();
  log.mockRestore();
});

it.each(["unmount", "account", "portal"])("retires a late response after %s changes", async change => {
  let resolve!: (value: string) => void;
  write.mockReturnValue(new Promise<string>(yes => { resolve = yes; }));
  const { result, client, unmount } = setup();
  act(() => result.current.open());
  let pending!: Promise<void>;
  await act(async () => { pending = result.current.confirm(); });
  act(() => {
    if (change === "unmount") unmount();
    else usePortalStore.setState(change === "account" ? { authUserId: "other-auth" } : { portal: "tenant" });
  });
  await act(async () => { resolve("under_maintenance"); await pending; });
  expect(client.getQueryData(["apartment-details", "unit"])).toMatchObject({ status: "available" });
  expect(mockToast).not.toHaveBeenCalled();
});
