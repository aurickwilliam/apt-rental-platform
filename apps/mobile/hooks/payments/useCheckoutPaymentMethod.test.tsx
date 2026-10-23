import { act, renderHook } from "@testing-library/react-native";
import type { PaymentMethod } from "@repo/utils";
import { useCheckoutPaymentMethod } from "./useCheckoutPaymentMethod";

it("selects a default arriving after checkout loads", () => {
  const { result, rerender } = renderHook(({ method }: { method: PaymentMethod | null }) => useCheckoutPaymentMethod("user-1", method), { initialProps: { method: null } });
  expect(result.current.method).toBeNull();
  rerender({ method: "GCash" });
  expect(result.current.method).toBe("GCash");
});

it("never overwrites the user's checkout choice with a late or changed default", () => {
  const { result, rerender } = renderHook(({ method }: { method: PaymentMethod | null }) => useCheckoutPaymentMethod("user-1", method), { initialProps: { method: null } });
  act(() => result.current.selectMethod("Cash"));
  rerender({ method: "GCash" });
  expect(result.current.method).toBe("Cash");
  rerender({ method: "Maya" });
  expect(result.current.method).toBe("Cash");
});

it("clears checkout selection on account change and on a new visit", () => {
  const { result, rerender, unmount } = renderHook(({ userId }: { userId: string }) => useCheckoutPaymentMethod(userId, "GCash"), { initialProps: { userId: "user-1" } });
  act(() => result.current.selectMethod("Cash"));
  rerender({ userId: "user-2" });
  expect(result.current.method).toBe("GCash");
  unmount();
  const next = renderHook(() => useCheckoutPaymentMethod("user-1", "Maya"));
  expect(next.result.current.method).toBe("Maya");
});
