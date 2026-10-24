import AsyncStorage from "@react-native-async-storage/async-storage";
import { markReviewUnlockSeen, readReviewUnlockDismissals, reviewUnlockDismissalKey } from "./reviewUnlockStorage";
import { installReviewUnlockTesting } from "./reviewUnlockTesting";

beforeEach(async () => { await AsyncStorage.clear(); jest.clearAllMocks(); });

it("persists dismissal per Auth account and tenancy without touching other storage", async () => {
  await AsyncStorage.setItem("auth-session", "keep");
  await markReviewUnlockSeen("account-a", "stay-a");
  expect(await readReviewUnlockDismissals("account-a", ["stay-a", "stay-b"])).toEqual(new Set(["stay-a"]));
  expect(await readReviewUnlockDismissals("account-b", ["stay-a"])).toEqual(new Set());
  expect(await AsyncStorage.getItem("auth-session")).toBe("keep");
  expect(AsyncStorage.multiGet).toHaveBeenCalledWith([
    reviewUnlockDismissalKey("account-a", "stay-a"), reviewUnlockDismissalKey("account-a", "stay-b"),
  ]);
});

it("does not make a storage request for an empty list and propagates read failures", async () => {
  expect(await readReviewUnlockDismissals("account-a", [])).toEqual(new Set());
  expect(AsyncStorage.multiGet).not.toHaveBeenCalled();
  jest.mocked(AsyncStorage.multiGet).mockRejectedValueOnce(new Error("unavailable"));
  await expect(readReviewUnlockDismissals("account-a", ["stay-a"])).rejects.toThrow("unavailable");
});

it("offers a development-only targeted reset, preserving other accounts and login", async () => {
  installReviewUnlockTesting();
  const reset = (globalThis as typeof globalThis & { aptResetReviewUnlock: (account: string, stay: string) => Promise<void> }).aptResetReviewUnlock;
  await markReviewUnlockSeen("account-a", "stay-a");
  await markReviewUnlockSeen("account-a", "stay-b");
  await markReviewUnlockSeen("account-b", "stay-a");
  await AsyncStorage.setItem("auth-session", "keep");
  await reset("account-a", "stay-a");
  expect(await readReviewUnlockDismissals("account-a", ["stay-a", "stay-b"])).toEqual(new Set(["stay-b"]));
  expect(await readReviewUnlockDismissals("account-b", ["stay-a"])).toEqual(new Set(["stay-a"]));
  expect(await AsyncStorage.getItem("auth-session")).toBe("keep");
  const original = __DEV__;
  try {
    Object.assign(globalThis, { __DEV__: false });
    await expect(reset("account-a", "stay-b")).rejects.toThrow("development-only");
    delete (globalThis as { aptResetReviewUnlock?: unknown }).aptResetReviewUnlock;
    installReviewUnlockTesting();
    expect("aptResetReviewUnlock" in globalThis).toBe(false);
  } finally { Object.assign(globalThis, { __DEV__: original }); }
});
