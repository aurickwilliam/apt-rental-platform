import {
  ADD_ROLE_FALLBACK_MESSAGE,
  getAddRoleErrorMessage,
  grantRole,
  INCOMPLETE_PROFILE_DB_MESSAGE,
  INCOMPLETE_PROFILE_MESSAGE,
} from "./roleAccessService";

const mockRpc = jest.fn();

jest.mock("@repo/supabase", () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

describe("roleAccessService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("asks the database to grant the role and returns the new roles", async () => {
    mockRpc.mockResolvedValueOnce({ data: ["tenant", "landlord"], error: null });
    await expect(grantRole("landlord")).resolves.toEqual(["tenant", "landlord"]);
    expect(mockRpc).toHaveBeenCalledWith("grant_user_role", { new_role: "landlord" });
  });

  it("explains an incomplete profile", async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { code: "P0001", message: INCOMPLETE_PROFILE_DB_MESSAGE } });
    await expect(grantRole("tenant")).rejects.toThrow(INCOMPLETE_PROFILE_MESSAGE);
  });

  it("never shows database internals", async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { code: "23514", message: 'violates check constraint "x"' } });
    await expect(grantRole("tenant")).rejects.toThrow(ADD_ROLE_FALLBACK_MESSAGE);
    expect(getAddRoleErrorMessage(null)).toBe(ADD_ROLE_FALLBACK_MESSAGE);
  });
});
