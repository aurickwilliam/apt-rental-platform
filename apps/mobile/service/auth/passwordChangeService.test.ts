import { changePassword, getPasswordSignInStatus } from "./passwordChangeService";
import { PasswordError } from "./passwordErrors";

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

async function expectReason(promise: Promise<unknown>, reason: string) {
  await expect(promise).rejects.toBeInstanceOf(PasswordError);
  await expect(promise).rejects.toMatchObject({ reason });
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
    // Neither password ever reaches the logs, including error messages.
    const logged = JSON.stringify(consoleError.mock.calls, (_key, item) =>
      item instanceof Error ? { name: item.name, message: item.message } : item);
    expect(logged).not.toContain(CURRENT);
    expect(logged).not.toContain(NEXT);
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
      await expectReason(getPasswordSignInStatus(), "session_expired");
    });
  });

  describe("changePassword", () => {
    it("verifies the current password, updates, then signs other sessions out, in order", async () => {
      const calls: string[] = [];
      mockSignInWithPassword.mockImplementationOnce(async (credentials: unknown) => {
        calls.push(`verify:${JSON.stringify(credentials)}`);
        return { data: { user: passwordUser, session: {} }, error: null };
      });
      mockUpdateUser.mockImplementationOnce(async (attributes: unknown) => {
        calls.push(`update:${JSON.stringify(attributes)}`);
        return { data: { user: passwordUser }, error: null };
      });
      mockSignOut.mockImplementationOnce(async (options: unknown) => {
        calls.push(`signOut:${JSON.stringify(options)}`);
        return { error: null };
      });

      await changePassword(CURRENT, NEXT);

      expect(calls).toEqual([
        `verify:${JSON.stringify({ email: EMAIL, password: CURRENT })}`,
        `update:${JSON.stringify({ password: NEXT })}`,
        `signOut:${JSON.stringify({ scope: "others" })}`,
      ]);
    });

    it("changes nothing when the current password is wrong", async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: authError({ code: "invalid_credentials", status: 400 }),
      });

      await expectReason(changePassword(CURRENT, NEXT), "wrong_current_password");
      expect(mockUpdateUser).not.toHaveBeenCalled();
      expect(mockSignOut).not.toHaveBeenCalled();
    });

    it("rejects reusing the current password before calling Supabase", async () => {
      await expectReason(changePassword(CURRENT, CURRENT), "same_password");
      expect(mockGetUser).not.toHaveBeenCalled();
      expect(mockSignInWithPassword).not.toHaveBeenCalled();
    });

    it.each([
      [{ code: "same_password", status: 422 }, "same_password"],
      [{ code: "weak_password", status: 422 }, "weak_password"],
      [{ code: "reauthentication_needed", status: 400 }, "reauthentication_required"],
      [{ name: "AuthRetryableFetchError", status: 0 }, "network"],
    ])("maps an update error %o to %s and keeps other sessions", async (fields, reason) => {
      mockUpdateUser.mockResolvedValueOnce({ data: { user: null }, error: authError(fields) });

      await expectReason(changePassword(CURRENT, NEXT), reason);
      expect(mockSignOut).not.toHaveBeenCalled();
    });

    it("surfaces rate limits on the verification step", async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: authError({ code: "over_request_rate_limit", status: 429 }),
      });
      await expectReason(changePassword(CURRENT, NEXT), "rate_limited");
    });

    it("refuses accounts without a password", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: googleUser }, error: null });

      await expectReason(changePassword(CURRENT, NEXT), "unknown");
      expect(mockSignInWithPassword).not.toHaveBeenCalled();
    });

    it("refuses when verification returns a different account", async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        data: { user: { ...passwordUser, id: "someone-else" }, session: {} },
        error: null,
      });

      await expectReason(changePassword(CURRENT, NEXT), "unknown");
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it("still succeeds when signing other sessions out fails", async () => {
      mockSignOut.mockResolvedValueOnce({ error: authError({ code: "unexpected_failure", status: 500 }) });

      await expect(changePassword(CURRENT, NEXT)).resolves.toBeUndefined();
      expect(consoleError).toHaveBeenCalled();
    });

    it("logs unexpected failures without either password", async () => {
      mockUpdateUser.mockResolvedValueOnce({
        data: { user: null },
        error: authError({ code: "unexpected_failure", status: 500, message: `rejected ${NEXT} after ${CURRENT}` }),
      });

      await expectReason(changePassword(CURRENT, NEXT), "unknown");
      expect(consoleError).toHaveBeenCalled();
    });
  });
});
