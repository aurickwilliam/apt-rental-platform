import type { ReactNode } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";
import { useLandlordTenancyRefresh } from "./useLandlordTenancyRefresh";

const mockFocus = jest.fn();
let mockPortal = "landlord";
jest.mock("expo-router", () => ({ useFocusEffect: (callback: () => void) => mockFocus(callback) }));
jest.mock("@/stores/usePortalStore", () => ({ usePortalStore: { getState: () => ({ portal: mockPortal }) } }));
jest.mock("./useLandlordTenancy", () => ({ getLandlordTenancyQueryKey: (id: string) => ["landlord-tenancy", id] }));

it("refreshes the exact tenancy on focus and foreground, removing the listener on blur", async () => {
  mockPortal = "landlord";
  const client = new QueryClient();
  const invalidate = jest.spyOn(client, "invalidateQueries");
  const remove = jest.fn();
  let onChange!: (state: AppStateStatus) => void;
  const subscription = jest.spyOn(AppState, "addEventListener").mockImplementation((_event, callback) => {
    onChange = callback;
    return { remove };
  });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const { unmount } = await renderHook(() => useLandlordTenancyRefresh("apartment-1"), { wrapper });
  let blur!: () => void;
  await act(() => { blur = mockFocus.mock.calls.at(-1)[0](); });
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ["landlord-tenancy", "apartment-1"], exact: true }, { cancelRefetch: false });
  await act(() => onChange("background"));
  expect(invalidate).toHaveBeenCalledTimes(1);
  await act(() => onChange("active"));
  expect(invalidate).toHaveBeenCalledTimes(2);
  mockPortal = "tenant";
  await act(() => onChange("active"));
  expect(invalidate).toHaveBeenCalledTimes(2);
  await act(blur);
  expect(remove).toHaveBeenCalledTimes(1);
  await unmount();
  client.clear();
  subscription.mockRestore();
});

it("does not refresh when the property is unidentified", async () => {
  mockPortal = "landlord";
  const client = new QueryClient();
  const invalidate = jest.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const { unmount } = await renderHook(() => useLandlordTenancyRefresh(undefined), { wrapper });
  await act(() => { mockFocus.mock.calls.at(-1)[0](); });
  expect(invalidate).not.toHaveBeenCalled();
  await unmount();
  client.clear();
});
