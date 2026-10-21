import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { getLandlordMaintenanceRequestsQueryKey, useLandlordMaintenanceRequests } from "./useLandlordMaintenanceRequests";
import type { LandlordMaintenanceRequest } from "@/service/landlord/landlordService";

const mockProfile = jest.fn();
const mockFetch = jest.fn();
const mockUpdate = jest.fn();
const mockWaive = jest.fn();

jest.mock("@/hooks/auth", () => ({ useProfile: () => mockProfile() }));
jest.mock("expo-router", () => ({
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = jest.requireActual<typeof import("react")>("react");
    useEffect(callback, [callback]);
  },
}));
jest.mock("@/hooks/tenancy/useTenancy", () => ({ getTenancyQueryKey: (id: string) => ["tenancy", id] }));
jest.mock("@/hooks/tenancy/useLandlordTenancy", () => ({ getLandlordTenancyQueryKey: (id: string) => ["landlord-tenancy", id] }));
jest.mock("./useMaintenanceRequestHistory", () => ({ getMaintenanceRequestHistoryQueryKey: (id: string) => ["maintenance-request-history", id] }));
jest.mock("./useMaintenanceRequests", () => ({ getLatestMaintenanceRequestQueryKey: (id: string) => ["maintenance-request-latest", id] }));
jest.mock("@/service/landlord/landlordService", () => ({
  fetchLandlordMaintenanceRequests: (...args: unknown[]) => mockFetch(...args),
  updateLandlordMaintenanceStatus: (...args: unknown[]) => mockUpdate(...args),
  waiveMaintenanceFee: (...args: unknown[]) => mockWaive(...args),
}));

const REQUEST: LandlordMaintenanceRequest = {
  id: "request-1", apartment_id: "apartment-1", tenant_id: "tenant-1", tenancy_id: "tenancy-1",
  issue_title: "Leak", description: "Pipe is leaking", apartment_name: "Apartment", apartment_city: "Malabon",
  apartment_address: "Malabon", tenant_name: "Demo Tenant", tenant_avatar_url: null, contact_number: "—",
  reported_at: "2026-10-21", status: "In Progress", urgency: "low", photos: [],
  fee_amount: null, fee_status: null, resolution_notes: null,
};
let serverRows: LandlordMaintenanceRequest[];

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false, gcTime: 0 } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, wrapper };
}

beforeEach(() => {
  jest.clearAllMocks();
  serverRows = [{ ...REQUEST }];
  mockProfile.mockReturnValue({ profile: { id: "landlord-1", roles: ["landlord"] }, loading: false });
  mockFetch.mockImplementation(async (id: string) => id === "landlord-1" ? serverRows : []);
  mockUpdate.mockImplementation(async (_id: string, _owner: string, nextStatus: LandlordMaintenanceRequest["status"], notes?: string, feeAmount?: number) => {
    serverRows = serverRows.map((row) => ({ ...row, status: nextStatus, resolution_notes: notes,
      ...(feeAmount === undefined ? {} : { fee_amount: feeAmount, fee_status: "pending" as const }) }));
    return { success: true };
  });
  mockWaive.mockImplementation(async () => {
    serverRows = serverRows.map((row) => ({ ...row, fee_status: "waived" }));
    return { success: true };
  });
});

it("resolves with a fee and refreshes only the affected request and bill keys", async () => {
  const { client, wrapper } = setup();
  const invalidate = jest.spyOn(client, "invalidateQueries");
  const { result, unmount } = renderHook(() => useLandlordMaintenanceRequests(), { wrapper });
  await waitFor(() => expect(result.current.requests).toHaveLength(1));
  invalidate.mockClear();
  await act(async () => { expect(await result.current.resolveRequest("request-1", "Fixed", 500)).toBe(true); });
  expect(mockUpdate).toHaveBeenCalledWith("request-1", "landlord-1", "Resolved", "Fixed", 500);
  await waitFor(() => expect(result.current.requests[0]).toMatchObject({ status: "Resolved", fee_amount: 500, fee_status: "pending" }));
  for (const key of [["landlord-maintenance", "landlord-1"], ["maintenance-request-history", "apartment-1"], ["maintenance-request-latest", "apartment-1"], ["tenancy", "tenant-1"]]) {
    expect(invalidate).toHaveBeenCalledWith({ queryKey: key, exact: true });
  }
  unmount(); client.clear();
});

it("waives pending fees and keeps the amount in history", async () => {
  serverRows = [{ ...REQUEST, status: "Resolved", fee_amount: 500, fee_status: "pending" }];
  const { client, wrapper } = setup();
  const { result, unmount } = renderHook(() => useLandlordMaintenanceRequests(), { wrapper });
  await waitFor(() => expect(result.current.requests).toHaveLength(1));
  await act(async () => { expect(await result.current.waiveFee("request-1")).toBe(true); });
  await waitFor(() => expect(result.current.requests[0]).toMatchObject({ fee_amount: 500, fee_status: "waived" }));
  expect(mockWaive).toHaveBeenCalledWith("request-1");
  unmount(); client.clear();
});

it("rolls back a reserved fee refusal and exposes the database message", async () => {
  serverRows = [{ ...REQUEST, status: "Resolved", fee_amount: 500, fee_status: "pending" }];
  mockWaive.mockResolvedValue({ success: false, error: "This fee is reserved by a pending payment." });
  const { client, wrapper } = setup();
  const { result, unmount } = renderHook(() => useLandlordMaintenanceRequests(), { wrapper });
  await waitFor(() => expect(result.current.requests).toHaveLength(1));
  await act(async () => { expect(await result.current.waiveFee("request-1")).toBe(false); });
  await waitFor(() => expect(result.current.error).toBe("This fee is reserved by a pending payment."));
  expect(result.current.requests[0].fee_status).toBe("pending");
  unmount(); client.clear();
});

it.each(["paid", "waived"] as const)("does not send a waiver for an already %s fee", async (feeStatus) => {
  serverRows = [{ ...REQUEST, fee_amount: 500, fee_status: feeStatus }];
  const { client, wrapper } = setup();
  const { result, unmount } = renderHook(() => useLandlordMaintenanceRequests(), { wrapper });
  await waitFor(() => expect(result.current.requests).toHaveLength(1));
  await act(async () => { expect(await result.current.waiveFee("request-1")).toBe(false); });
  expect(mockWaive).not.toHaveBeenCalled();
  unmount(); client.clear();
});

it("blocks duplicate actions while saving and restores status after transport failure", async () => {
  let reject!: (error: Error) => void;
  mockUpdate.mockImplementation(() => new Promise((_resolve, rejectPromise) => { reject = rejectPromise; }));
  const { client, wrapper } = setup();
  const { result, unmount } = renderHook(() => useLandlordMaintenanceRequests(), { wrapper });
  await waitFor(() => expect(result.current.requests).toHaveLength(1));
  let first!: Promise<boolean>;
  await act(async () => { first = result.current.resolveRequest("request-1", "Fixed", 500); });
  await waitFor(() => expect(result.current.actionLoading).toBe(true));
  await act(async () => { expect(await result.current.resolveRequest("request-1", "Fixed", 500)).toBe(false); });
  expect(mockUpdate).toHaveBeenCalledTimes(1);
  await act(async () => { reject(new Error("Network unavailable")); expect(await first).toBe(false); });
  await waitFor(() => expect(result.current.requests[0].status).toBe("In Progress"));
  expect(result.current.error).toBe("Network unavailable");
  unmount(); client.clear();
});

it("does not restore retired-account rows after a late failure", async () => {
  let reject!: (error: Error) => void;
  mockUpdate.mockImplementation(() => new Promise((_resolve, rejectPromise) => { reject = rejectPromise; }));
  const { client, wrapper } = setup();
  const { result, rerender, unmount } = renderHook(() => useLandlordMaintenanceRequests(), { wrapper });
  await waitFor(() => expect(result.current.requests).toHaveLength(1));
  let pending!: Promise<boolean>;
  await act(async () => { pending = result.current.resolveRequest("request-1", "Fixed", 500); });
  await waitFor(() => expect(mockUpdate).toHaveBeenCalled());
  mockProfile.mockReturnValue({ profile: { id: "landlord-2", roles: ["landlord"] }, loading: false });
  rerender({});
  client.removeQueries({ queryKey: getLandlordMaintenanceRequestsQueryKey("landlord-1"), exact: true });
  await act(async () => { reject(new Error("Network unavailable")); await pending; });
  expect(client.getQueryData(getLandlordMaintenanceRequestsQueryKey("landlord-1"))).toBeUndefined();
  expect(result.current.requests).toEqual([]);
  unmount(); client.clear();
});

it("does not fetch or mutate for a tenant-only profile", async () => {
  mockProfile.mockReturnValue({ profile: { id: "tenant-1", roles: ["tenant"] }, loading: false });
  const { client, wrapper } = setup();
  const { result, unmount } = renderHook(() => useLandlordMaintenanceRequests(), { wrapper });
  await act(async () => { expect(await result.current.resolveRequest("request-1", "Fixed", 500)).toBe(false); });
  expect(mockFetch).not.toHaveBeenCalled();
  expect(mockUpdate).not.toHaveBeenCalled();
  unmount(); client.clear();
});
