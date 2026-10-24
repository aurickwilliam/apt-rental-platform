import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";
import { useSubmitReview } from "./useSubmitReview";
import { usePortalStore } from "@/stores/usePortalStore";

const mockSingle = jest.fn();
jest.mock("@repo/supabase", () => ({ supabase: { from: () => ({ insert: () => ({ select: () => ({ single: mockSingle }) }) }) } }));
jest.mock("../auth/useProfile", () => ({ useProfile: () => ({ profile: { id: "tenant-a", user_id: "auth-a" } }) }));
jest.mock("expo-crypto", () => ({ randomUUID: () => "review-a" }));
jest.mock("expo-image-picker", () => ({}));
jest.mock("expo-file-system", () => ({ File: jest.fn() }));

it("invalidates exact review caches on success without touching another account", async () => {
  const client = new QueryClient();
  const invalidate = jest.spyOn(client, "invalidateQueries").mockResolvedValue();
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  usePortalStore.setState({ authUserId: "auth-a", portal: "tenant", loading: false });
  mockSingle.mockResolvedValue({ data: { id: "review-a", apartment_id: "apartment-a" }, error: null });
  const { result, unmount } = renderHook(useSubmitReview, { wrapper });
  await act(async () => {
    expect(await result.current.submitReview({ tenancyId: "stay-a", rating: 5, comment: "Good", stayedDate: "2026-10-24" })).toEqual({ success: true });
  });
  expect(invalidate.mock.calls.map(([options]) => options)).toEqual([
    { queryKey: ["apartment-reviews", "apartment-a"], exact: true },
    { queryKey: ["review-eligibility", "apartment-a", "tenant-a"], exact: true },
    { queryKey: ["review-unlock", "auth-a", "tenant-a"], exact: true },
  ]);
  invalidate.mockClear();
  let finish!: (result: unknown) => void;
  mockSingle.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  let pending!: ReturnType<typeof result.current.submitReview>;
  act(() => { pending = result.current.submitReview({ tenancyId: "stay-a", rating: 5, comment: "Good", stayedDate: "2026-10-24" }); });
  usePortalStore.setState({ authUserId: "auth-b" });
  await act(async () => { finish({ data: { id: "review-a", apartment_id: "apartment-a" }, error: null }); await pending; });
  expect(invalidate).not.toHaveBeenCalled();
  unmount(); client.clear();
});
