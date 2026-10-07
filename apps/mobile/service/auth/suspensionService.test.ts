import {
  buildSuspendedMessage,
  getOAuthRedirectError,
  getSuspensionReason,
  isBannedAuthError,
  SUSPENDED_MESSAGE,
} from "./suspensionService";

const mockInvoke = jest.fn();

jest.mock("@repo/supabase", () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => mockInvoke(...args) } },
}));

describe("suspensionService", () => {
  beforeEach(() => jest.clearAllMocks());

  it("recognises banned auth errors by code or message", () => {
    expect(isBannedAuthError({ code: "user_banned" })).toBe(true);
    expect(isBannedAuthError({ message: "User is banned" })).toBe(true);
    expect(isBannedAuthError({ message: "Invalid login credentials" })).toBe(false);
    expect(isBannedAuthError(null)).toBe(false);
  });

  it("includes the reason when there is one", () => {
    expect(buildSuspendedMessage("  Fake listings ")).toContain("Reason: Fake listings");
    expect(buildSuspendedMessage(null)).toBe(SUSPENDED_MESSAGE);
    expect(buildSuspendedMessage("   ")).toBe(SUSPENDED_MESSAGE);
  });

  it("returns the reason only for a suspended account", async () => {
    mockInvoke.mockResolvedValueOnce({ data: { suspended: true, reason: "Spam" }, error: null });
    await expect(getSuspensionReason("a@example.test", "pw")).resolves.toBe("Spam");
    expect(mockInvoke).toHaveBeenCalledWith("suspension-notice", {
      body: { email: "a@example.test", password: "pw" },
    });

    mockInvoke.mockResolvedValueOnce({ data: { suspended: false }, error: null });
    await expect(getSuspensionReason("a@example.test", "pw")).resolves.toBeNull();

    mockInvoke.mockResolvedValueOnce({ data: null, error: new Error("network") });
    await expect(getSuspensionReason("a@example.test", "pw")).resolves.toBeNull();
  });

  it("reads OAuth redirect errors from the query or the hash", () => {
    expect(getOAuthRedirectError("apt://auth/callback?error_code=user_banned&error_description=User+is+banned")).toEqual({
      code: "user_banned",
      description: "User is banned",
    });
    expect(getOAuthRedirectError("apt://auth/callback#error_code=user_banned")).toEqual({
      code: "user_banned",
      description: null,
    });
    expect(getOAuthRedirectError("apt://auth/callback")).toEqual({ code: null, description: null });
  });
});
