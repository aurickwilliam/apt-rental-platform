import { finishProfile } from "./finishProfileService";
import { emptyRegistrationAcceptance } from "./registrationAcceptance";

const mockGetUser = jest.fn();
const mockUpdateUser = jest.fn();
const mockRpc = jest.fn();
const mockFrom = jest.fn();

jest.mock("@repo/supabase", () => ({
  supabase: {
    auth: { getUser: () => mockGetUser(), updateUser: (...args: unknown[]) => mockUpdateUser(...args) },
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

const details = {
  first_name: "Ana", last_name: "Lim", middle_name: null, suffix: "Jr.", gender: "Female",
  birth_date: "1990-01-05", mobile_number: "09171234567", province: "Metro Manila", city: "Caloocan",
  barangay: "Barangay 1", postal_code: 1400, street_address: "1 Main St",
};
const acceptance = { ...emptyRegistrationAcceptance(), termsAccepted: true, privacyAccepted: true };
const params = { details, role: "tenant" as const, requestedRole: undefined, acceptance };

describe("finishProfile", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: "auth-1", email: "a@example.test" } }, error: null });
    mockUpdateUser.mockResolvedValue({ error: null });
    mockRpc.mockResolvedValue({ data: "internal-1", error: null });
  });

  it("refuses an invalid requested role before touching the account", async () => {
    await expect(finishProfile({ ...params, requestedRole: "admin" })).rejects.toThrow("Invalid account type.");
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("requires explicit acceptance before Auth or database changes", async () => {
    await expect(finishProfile({ ...params, acceptance: emptyRegistrationAcceptance() })).rejects.toThrow("Please read and accept");
    expect(mockGetUser).not.toHaveBeenCalled();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("requires a signed-in user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(finishProfile(params)).rejects.toThrow("No authenticated user found.");
  });

  it("saves the display name and completes profile + acceptance through one caller-bound RPC", async () => {
    await expect(finishProfile(params)).resolves.toBe("auth-1");
    expect(mockUpdateUser).toHaveBeenCalledWith({ data: { full_name: "Ana Lim Jr." } });
    expect(mockRpc).toHaveBeenCalledTimes(1);
    expect(mockRpc).toHaveBeenCalledWith("complete_mobile_registration", {
      profile_details: details, requested_role: "tenant", terms_accepted: true, privacy_accepted: true,
      terms_version: acceptance.termsVersion, privacy_version: acceptance.privacyVersion,
      registration_source: "mobile_profile_completion", expected_auth_id: "auth-1",
    });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("keeps suffix-free names clean", async () => {
    await finishProfile({ ...params, details: { ...details, suffix: null } });
    expect(mockUpdateUser).toHaveBeenCalledWith({ data: { full_name: "Ana Lim" } });
  });

  it("never falls back to separate profile writes when the transaction fails or is absent", async () => {
    mockRpc.mockResolvedValue({ data: null, error: new Error("Registration unavailable") });
    await expect(finishProfile(params)).rejects.toThrow("Registration unavailable");
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
