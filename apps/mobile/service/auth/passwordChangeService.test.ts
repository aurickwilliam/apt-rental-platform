import { changePassword, getPasswordSignInStatus } from "./passwordChangeService";
import { PasswordError } from "@repo/utils";

// The change-password steps themselves are tested with @repo/utils
// (packages/utils/src/passwordChange.test.ts); this covers the mobile wiring.

const mockGetUser = jest.fn();
const mockSignInWithPassword = jest.fn();
const mockUpdateUser = jest.fn();
const mockSignOut = jest.fn();

jest.mock("@repo/supabase", () => ({
  supabase: {
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      updateUser: (...args: unknown[]) => mockUpdateUser(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
    },
  },
}));

const EMAIL = "tenant@example.com";
const CURRENT = "0ld!Passw0rd";
const NEXT = "N3w!Passw0rd";

const passwordUser = { id: "user-1", email: EMAIL, identities: [{ provider: "email" }] };
const linkedUser = { ...passwordUser, identities: [{ provider: "google" }, { provider: "email" }] };
const googleUser = { id: "user-2", email: EMAIL, identities: [{ provider: "google" }] };

function authError(fields: { name?: string; code?: string; status?: number; message?: string }) {
  return Object.assign(new Error(fields.message ?? "auth error"), fields);
}

describe("passwordChangeService", () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    mockGetUser.mockResolvedValue({ data: { user: passwordUser }, error: null });
    mockSignInWithPassword.mockResolvedValue({ data: { user: passwordUser, session: {} }, error: null });
    mockUpdateUser.mockResolvedValue({ data: { user: passwordUser }, error: null });
    mockSignOut.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  describe("getPasswordSignInStatus", () => {
    it.each([
      ["email/password", "has_password", passwordUser],
      ["linked Google-plus-password", "has_password", linkedUser],
      ["Google-only", "no_password", googleUser],
    ])("reports %s accounts as %s", async (_label, status, user) => {
      mockGetUser.mockResolvedValueOnce({ data: { user }, error: null });
      await expect(getPasswordSignInStatus()).resolves.toBe(status);
    });

    it("fails when there is no signed-in user", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: authError({ name: "AuthSessionMissingError" }) });
      const promise = getPasswordSignInStatus();
      await expect(promise).rejects.toBeInstanceOf(PasswordError);
      await expect(promise).rejects.toMatchObject({ reason: "session_expired" });
    });
  });

  describe("changePassword", () => {
    it("runs the shared steps against the mobile Supabase client", async () => {
      await changePassword(CURRENT, NEXT);

      expect(mockSignInWithPassword).toHaveBeenCalledWith({ email: EMAIL, password: CURRENT });
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: NEXT });
      expect(mockSignOut).toHaveBeenCalledWith({ scope: "others" });
    });

    it("passes shared errors through", async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: authError({ code: "invalid_credentials", status: 400 }),
      });

      await expect(changePassword(CURRENT, NEXT)).rejects.toMatchObject({ reason: "wrong_current_password" });
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });
  });
});
