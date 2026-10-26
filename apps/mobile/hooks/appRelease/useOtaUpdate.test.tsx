import { AppState } from "react-native";
import * as Updates from "expo-updates";
import { act, renderHook } from "@testing-library/react-native";
import { useOtaUpdate } from "./useOtaUpdate";

const mockUpdates = Updates as unknown as {
  isEnabled: boolean;
  useUpdates: jest.Mock;
  checkForUpdateAsync: jest.Mock;
  fetchUpdateAsync: jest.Mock;
  reloadAsync: jest.Mock;
};

let appStateListener: (state: string) => void;

beforeEach(() => {
  jest.clearAllMocks();
  mockUpdates.isEnabled = true;
  mockUpdates.useUpdates.mockReturnValue({ isUpdatePending: false });
  mockUpdates.checkForUpdateAsync.mockResolvedValue({ isAvailable: true });
  mockUpdates.fetchUpdateAsync.mockResolvedValue({});
  mockUpdates.reloadAsync.mockResolvedValue(undefined);
  jest.spyOn(AppState, "addEventListener").mockImplementation((_type, listener) => {
    appStateListener = listener as (state: string) => void;
    return { remove: jest.fn() };
  });
});
afterEach(() => { jest.restoreAllMocks(); mockUpdates.isEnabled = false; });

it("is quiet until an update has been downloaded", () => {
  expect(renderHook(() => useOtaUpdate()).result.current.isReady).toBe(false);
});

it("offers a restart once an update is pending, and Later hides it", () => {
  mockUpdates.useUpdates.mockReturnValue({ isUpdatePending: true });
  const { result } = renderHook(() => useOtaUpdate());
  expect(result.current.isReady).toBe(true);
  act(() => { result.current.defer(); });
  expect(result.current.isReady).toBe(false);
});

it("restarts the app to apply the update", () => {
  const { result } = renderHook(() => useOtaUpdate());
  act(() => { result.current.restart(); });
  expect(mockUpdates.reloadAsync).toHaveBeenCalledTimes(1);
});

it("downloads an available update when the app returns to the foreground, at most every 15 minutes", async () => {
  renderHook(() => useOtaUpdate());
  await act(async () => { appStateListener("active"); });
  expect(mockUpdates.fetchUpdateAsync).toHaveBeenCalledTimes(1);
  await act(async () => { appStateListener("active"); });
  expect(mockUpdates.checkForUpdateAsync).toHaveBeenCalledTimes(1);
});

it("logs and carries on when the check fails", async () => {
  const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
  mockUpdates.checkForUpdateAsync.mockRejectedValue(new Error("offline"));
  renderHook(() => useOtaUpdate());
  await act(async () => { appStateListener("active"); });
  expect(warn).toHaveBeenCalled();
  expect(mockUpdates.fetchUpdateAsync).not.toHaveBeenCalled();
});

it("does nothing where updates are disabled (development builds)", () => {
  mockUpdates.isEnabled = false;
  mockUpdates.useUpdates.mockReturnValue({ isUpdatePending: true });
  const { result } = renderHook(() => useOtaUpdate());
  expect(result.current.isReady).toBe(false);
  expect(AppState.addEventListener).not.toHaveBeenCalled();
});
