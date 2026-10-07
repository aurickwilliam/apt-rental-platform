import {
  buildSuspendedMessage,
  getMySuspensionStatus,
  getOAuthRedirectError,
  SUSPENDED_MESSAGE,
} from "./suspensionService";

const mockRpc = jest.fn();

jest.mock("@repo/supabase", () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

describe("suspensionService", () => {
  beforeEach(() => jest.clearAllMocks());

  it("includes the reason when there is one", () => {
    expect(buildSuspendedMessage("  Fake listings ")).toContain("Reason: Fake listings");
    expect(buildSuspendedMessage(null)).toBe(SUSPENDED_MESSAGE);
    expect(buildSuspendedMessage("   ")).toBe(SUSPENDED_MESSAGE);
  });

  it("reads the caller's own suspension status", async () => {
    mockRpc.mockResolvedValueOnce({ data: { suspended: true, reason: "Spam" }, error: null });
    await expect(getMySuspensionStatus()).resolves.toEqual({ suspended: true, reason: "Spam" });
    expect(mockRpc).toHaveBeenCalledWith("get_my_suspension_status");

    mockRpc.mockResolvedValueOnce({ data: null, error: new Error("offline") });
    await expect(getMySuspensionStatus()).resolves.toEqual({ suspended: false, reason: null });
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
