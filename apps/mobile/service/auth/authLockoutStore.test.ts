import AsyncStorage from "@react-native-async-storage/async-storage";

import { clearDeviceLockout, readDeviceLockoutSeconds, saveServerLockout } from "./authLockoutStore";

const NOW = 1_000_000;

describe("lockout reminder store", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("remembers a lock the server reported and counts it down", async () => {
    await saveServerLockout("signin", "Ana@Example.com", 420, NOW);

    // A new session (new read) still sees it, whatever the email's case.
    expect(await readDeviceLockoutSeconds("signin", " ana@example.com ", NOW)).toBe(420);
    expect(await readDeviceLockoutSeconds("signin", "ana@example.com", NOW + 100_000)).toBe(320);
    expect(await readDeviceLockoutSeconds("signin", "ana@example.com", NOW + 420_000)).toBe(0);
  });

  it("keeps one email's reminder from another's and one flow's from another's", async () => {
    await saveServerLockout("signin", "ana@example.com", 600, NOW);
    expect(await readDeviceLockoutSeconds("signin", "bo@example.com", NOW)).toBe(0);
    expect(await readDeviceLockoutSeconds("signup_otp", "ana@example.com", NOW)).toBe(0);
  });

  it("forgets the reminder after a success", async () => {
    await saveServerLockout("recovery_otp", "ana@example.com", 600, NOW);
    await clearDeviceLockout("recovery_otp", "ana@example.com");
    expect(await readDeviceLockoutSeconds("recovery_otp", "ana@example.com", NOW)).toBe(0);
  });

  it("stores no plain-text email and ignores an empty one", async () => {
    await saveServerLockout("signin", "ana@example.com", 60, NOW);
    const keys = await AsyncStorage.getAllKeys();
    expect(keys).toHaveLength(1);
    expect(keys[0]).not.toContain("ana");

    await saveServerLockout("signin", "  ", 60, NOW);
    expect(await AsyncStorage.getAllKeys()).toHaveLength(1);
  });

  it("treats an unreadable or old-format value as no lock", async () => {
    await saveServerLockout("signin", "ana@example.com", 60, NOW);
    const [key] = await AsyncStorage.getAllKeys();

    await AsyncStorage.setItem(key, "{oops");
    expect(await readDeviceLockoutSeconds("signin", "ana@example.com", NOW)).toBe(0);

    await AsyncStorage.setItem(key, JSON.stringify({ failures: 5, windowStartedAt: NOW }));
    expect(await readDeviceLockoutSeconds("signin", "ana@example.com", NOW)).toBe(0);
  });
});
