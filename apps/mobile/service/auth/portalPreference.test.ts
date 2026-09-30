import AsyncStorage from "@react-native-async-storage/async-storage";

import { authorizedPortal, choosePortal, resolvePortal, selectPortal } from "./portalPreference";
import { usePortalStore } from "@/stores/usePortalStore";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const getItem = AsyncStorage.getItem as jest.Mock;
const setItem = AsyncStorage.setItem as jest.Mock;
const removeItem = AsyncStorage.removeItem as jest.Mock;

describe("account-scoped portal preference", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePortalStore.getState().reset();
    getItem.mockResolvedValue(null);
    setItem.mockResolvedValue(undefined);
  });

  it("prefers a saved authorized portal over the sign-in tab", async () => {
    getItem.mockResolvedValue("tenant");
    expect(await resolvePortal("account-a", ["tenant", "landlord"], "landlord")).toBe("tenant");
    expect(getItem).toHaveBeenCalledWith("apt-portal:account-a");
    expect(setItem).not.toHaveBeenCalled();
  });

  it("remembers tenant, then landlord, across sign-out and sign-in", async () => {
    const stored = new Map<string, string>();
    getItem.mockImplementation(async (key: string) => stored.get(key) ?? null);
    setItem.mockImplementation(async (key: string, value: string) => { stored.set(key, value); });

    expect(await usePortalStore.getState().restore("account-a", ["tenant", "landlord"], "tenant")).toBe("tenant");
    usePortalStore.getState().reset();
    expect(await usePortalStore.getState().restore("account-a", ["tenant", "landlord"], "landlord")).toBe("tenant");

    await usePortalStore.getState().switchTo("account-a", ["tenant", "landlord"], "landlord");
    usePortalStore.getState().reset();
    expect(await usePortalStore.getState().restore("account-a", ["tenant", "landlord"], "tenant")).toBe("landlord");
  });

  it("does not transfer a portal preference to another account", async () => {
    getItem.mockImplementation(async (key: string) => key === "apt-portal:account-a" ? "landlord" : null);
    expect(await resolvePortal("account-a", ["tenant", "landlord"])).toBe("landlord");
    expect(await resolvePortal("account-b", ["tenant", "landlord"], "tenant")).toBe("tenant");
    expect(setItem).toHaveBeenCalledWith("apt-portal:account-b", "tenant");
  });

  it("does not activate a stale restore after signing out", async () => {
    let finishRead: (value: string) => void = () => {};
    getItem.mockImplementation(() => new Promise<string>((resolve) => { finishRead = resolve; }));
    const restore = usePortalStore.getState().restore("account-a", ["tenant", "landlord"]);
    usePortalStore.getState().reset();
    finishRead("landlord");
    expect(await restore).toBeNull();
    expect(usePortalStore.getState().portal).toBeNull();
    expect(usePortalStore.getState().authUserId).toBeNull();
  });

  it("falls back when a saved role was revoked or the account is single-role", async () => {
    getItem.mockResolvedValue("landlord");
    expect(await resolvePortal("account-a", ["tenant"], "landlord")).toBe("tenant");
    expect(setItem).toHaveBeenCalledWith("apt-portal:account-a", "tenant");
  });

  it("ignores an unavailable sign-in tab when no saved preference exists", async () => {
    expect(await resolvePortal("account-a", ["landlord"], "tenant")).toBe("landlord");
    expect(setItem).toHaveBeenCalledWith("apt-portal:account-a", "landlord");
  });

  it("rejects unauthorized switching and admin-only accounts", async () => {
    await expect(selectPortal("account-a", "landlord", ["tenant"])).rejects.toThrow("does not have access");
    expect(setItem).not.toHaveBeenCalled();
    expect(choosePortal(["admin"], "landlord")).toBeNull();
    expect(choosePortal(["admin", "tenant"], "tenant")).toBeNull();
  });

  it("authorizes only a held non-admin portal", () => {
    expect(authorizedPortal(["tenant", "landlord"], "landlord")).toBe("landlord");
    expect(authorizedPortal(["tenant"], "landlord")).toBeNull();
    expect(authorizedPortal(["tenant"], "owner")).toBeNull();
    expect(authorizedPortal([], "tenant")).toBeNull();
    expect(authorizedPortal(["admin", "tenant"], "tenant")).toBeNull();
  });

  it("returns null when no supported portal is held", () => {
    expect(choosePortal([], null)).toBeNull();
    expect(choosePortal([], "tenant")).toBeNull();
    expect(choosePortal(["admin"], null)).toBeNull();
  });

  it("ignores a saved value that is not a portal", async () => {
    getItem.mockResolvedValue("owner");
    expect(await resolvePortal("account-a", ["tenant", "landlord"])).toBe("tenant");
    expect(setItem).toHaveBeenCalledWith("apt-portal:account-a", "tenant");
  });

  it("clears a stale saved preference when no portal is available", async () => {
    getItem.mockResolvedValue("tenant");
    expect(await resolvePortal("account-a", ["admin"])).toBeNull();
    expect(removeItem).toHaveBeenCalledWith("apt-portal:account-a");
  });
});
