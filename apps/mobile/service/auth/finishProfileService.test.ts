import { finishProfile } from "./finishProfileService";

const mockGetUser = jest.fn();
const mockUpdateUser = jest.fn();
const mockRpc = jest.fn();
const mockMaybeSingle = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockUpdateEq = jest.fn();

jest.mock("@repo/supabase", () => ({
  supabase: {
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
      updateUser: (...args: unknown[]) => mockUpdateUser(...args),
    },
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: () => mockMaybeSingle() }) }),
      insert: (...args: unknown[]) => mockInsert(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    }),
  },
}));

const details = {
  first_name: "Ana",
  last_name: "Lim",
  middle_name: null,
  suffix: "Jr.",
  gender: "Female",
  birth_date: "1990-01-05",
  mobile_number: "09171234567",
  province: "Metro Manila",
  city: "Caloocan",
  barangay: "Barangay 1",
  postal_code: 1400,
  street_address: "1 Main St",
};

describe("finishProfile", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: "auth-1", email: "a@example.test" } }, error: null });
    mockUpdateUser.mockResolvedValue({ error: null });
    mockInsert.mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue({ eq: mockUpdateEq });
    mockUpdateEq.mockResolvedValue({ error: null });
    mockRpc.mockResolvedValue({ error: null });
  });

  it("refuses a role that is not a portal before touching the account", async () => {
    await expect(finishProfile({ details, role: "tenant", requestedRole: "admin" }))
      .rejects.toThrow("Invalid account type.");
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("requires a signed-in user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(finishProfile({ details, role: "tenant", requestedRole: undefined }))
      .rejects.toThrow("No authenticated user found.");
  });

  it("saves the Auth display name with the suffix and no trailing space", async () => {
    mockMaybeSingle.mockResolvedValue({ data: { roles: ["tenant"] }, error: null });

    await finishProfile({ details, role: "tenant", requestedRole: undefined });
    expect(mockUpdateUser).toHaveBeenCalledWith({ data: { full_name: "Ana Lim Jr." } });

    mockUpdateUser.mockClear();
    await finishProfile({ details: { ...details, suffix: null }, role: "tenant", requestedRole: undefined });
    expect(mockUpdateUser).toHaveBeenCalledWith({ data: { full_name: "Ana Lim" } });
  });

  it("creates the profile row for a confirmed account that has none", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    await expect(finishProfile({ details, role: "landlord", requestedRole: "landlord" })).resolves.toBe("auth-1");

    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "auth-1",
      email: "a@example.test",
      roles: ["landlord"],
      ...details,
    });
    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("updates an existing profile that already holds the chosen role", async () => {
    mockMaybeSingle.mockResolvedValue({ data: { roles: ["tenant", "landlord"] }, error: null });

    await expect(finishProfile({ details, role: "landlord", requestedRole: undefined })).resolves.toBe("auth-1");

    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledWith(details);
    expect(mockUpdateEq).toHaveBeenCalledWith("user_id", "auth-1");
  });

  it("applies the onboarding role through the RPC before updating", async () => {
    mockMaybeSingle.mockResolvedValue({ data: { roles: ["tenant"] }, error: null });

    await finishProfile({ details, role: "landlord", requestedRole: undefined });

    expect(mockRpc).toHaveBeenCalledWith("set_onboarding_role", { requested_role: "landlord" });
    expect(mockUpdate).toHaveBeenCalledWith(details);
  });

  it("will not switch the role of an account that holds several", async () => {
    mockMaybeSingle.mockResolvedValue({ data: { roles: ["tenant", "admin"] }, error: null });

    await expect(finishProfile({ details, role: "landlord", requestedRole: undefined }))
      .rejects.toThrow("Cannot change the role of this account during onboarding.");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("keeps admin-only accounts out of the mobile app", async () => {
    mockMaybeSingle.mockResolvedValue({ data: { roles: ["admin"] }, error: null });

    await expect(finishProfile({ details, role: "tenant", requestedRole: undefined }))
      .rejects.toThrow("Admin accounts are available on the web portal only.");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("stops when the profile update is refused", async () => {
    mockMaybeSingle.mockResolvedValue({ data: { roles: ["tenant"] }, error: null });
    mockUpdateEq.mockResolvedValue({ error: new Error("violates check") });

    await expect(finishProfile({ details, role: "tenant", requestedRole: undefined }))
      .rejects.toThrow("violates check");
  });
});
