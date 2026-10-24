import { AppState } from "react-native";
import { act, fireEvent, render } from "@testing-library/react-native";
import ReviewUnlockGate from "./ReviewUnlockGate";

let mockPathname = "/rentals";
const mockPush = jest.fn();
const mockDismiss = jest.fn();
const originalIdle = globalThis.requestIdleCallback;
const originalCancelIdle = globalThis.cancelIdleCallback;
const mockOffer = { tenancyId: "stay-a", apartmentId: "apartment-a", apartmentName: "Cozy Cove" };
jest.mock("expo-router", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: mockPush }),
  useFocusEffect: (effect: () => (() => void)) => {
    const { useEffect } = jest.requireActual<typeof import("react")>("react");
    useEffect(effect, [effect]);
  },
}));
jest.mock("@/hooks/ratings/useReviewUnlock", () => ({
  useReviewUnlock: (_auth: string, _tenant: string, enabled: boolean) => ({ candidate: enabled ? mockOffer : null, dismiss: mockDismiss }),
}));
jest.mock("./ReviewUnlockDialog", () => {
  const { View, Pressable, Text } = jest.requireActual<typeof import("react-native")>("react-native");
  return { __esModule: true, default: function Dialog({ onDismiss, onReview }: { onDismiss: () => void; onReview: () => void }) {
    return <View><Pressable onPress={onDismiss}><Text>Close or Maybe later</Text></Pressable><Pressable onPress={onReview}><Text>Write a Review</Text></Pressable></View>;
  } };
});

beforeEach(() => {
  jest.clearAllMocks(); mockPathname = "/rentals"; mockDismiss.mockReturnValue(true);
  Object.defineProperty(AppState, "currentState", { configurable: true, value: "active", writable: true });
  Object.assign(globalThis, {
    requestIdleCallback: jest.fn((task: IdleRequestCallback) => {
      task({ didTimeout: false, timeRemaining: () => 50 });
      return 1;
    }),
    cancelIdleCallback: jest.fn(),
  });
});
afterEach(() => { jest.restoreAllMocks(); });
afterAll(() => { Object.assign(globalThis, { requestIdleCallback: originalIdle, cancelIdleCallback: originalCancelIdle }); });

it("dismisses before navigating to the existing review list and blocks stale navigation", () => {
  const screen = render(<ReviewUnlockGate authUserId="auth-a" tenantId="tenant-a" />);
  fireEvent.press(screen.getByText("Write a Review"));
  expect(mockDismiss).toHaveBeenCalledWith(mockOffer);
  expect(mockPush).toHaveBeenCalledWith({ pathname: "/apartment/[apartmentId]/ratings", params: { apartmentId: "apartment-a" } });
  expect(mockDismiss.mock.invocationCallOrder[0]).toBeLessThan(mockPush.mock.invocationCallOrder[0]);
  mockPush.mockClear(); mockDismiss.mockReturnValue(false);
  fireEvent.press(screen.getByText("Write a Review"));
  expect(mockPush).not.toHaveBeenCalled();
  fireEvent.press(screen.getByText("Close or Maybe later"));
  expect(mockDismiss).toHaveBeenCalledTimes(3);
});

it("never shows over other tabs, pushed review/payment routes, or the background", () => {
  const screen = render(<ReviewUnlockGate authUserId="auth-a" tenantId="tenant-a" />);
  for (const path of ["/search", "/apartment/apartment-a/ratings", "/tenant/payment"]) {
    mockPathname = path;
    screen.rerender(<ReviewUnlockGate authUserId="auth-a" tenantId="tenant-a" />);
    expect(screen.queryByText("Write a Review")).toBeNull();
  }
  mockPathname = "/rentals";
  screen.rerender(<ReviewUnlockGate authUserId="auth-a" tenantId="tenant-a" />);
  expect(screen.queryByText("Write a Review")).not.toBeNull();
  const subscribe = jest.spyOn(AppState, "addEventListener");
  screen.unmount();
  const second = render(<ReviewUnlockGate authUserId="auth-a" tenantId="tenant-a" />);
  const listener = subscribe.mock.calls.at(-1)![1];
  act(() => { Object.assign(AppState, { currentState: "background" }); listener("background"); });
  expect(second.queryByText("Write a Review")).toBeNull();
});
