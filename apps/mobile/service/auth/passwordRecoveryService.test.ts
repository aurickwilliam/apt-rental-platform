import {
  endPasswordRecovery,
  hasEmailPasswordIdentity,
  PasswordRecoveryError,
  requestPasswordRecovery,
  toRecoveryErrorReason,
  updateRecoveredPassword,
  verifyPasswordRecoveryCode,
} from "./passwordRecoveryService";

const mockResetPasswordForEmail = jest.fn();
const mockVerifyOtp = jest.fn();
const mockUpdateUser = jest.fn();
const mockSignOut = jest.fn();

jest.mock("@repo/supabase", () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: (...args: unknown[]) => mockResetPasswordForEmail(...args),
      verifyOtp: (...args: unknown[]) => mockVerifyOtp(...args),
      updateUser: (...args: unknown[]) => mockUpdateUser(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
    },
  },
}));

const EMAIL = "tenant@example.com";
const CODE = "123456";
const PASSWORD = "N3w-Passw0rd!";

function authError(fields: { name?: string; code?: string; status?: number; message?: string }) {
  return Object.assign(new Error(fields.message ?? "auth error"), fields);
}

const emailUser = { identities: [{ provider: "email" }], app_metadata: { providers: ["email"] } };
const googleUser = { identities: [{ provider: "google" }], app_metadata: { providers: ["google"] } };

async function expectReason(promise: Promise<unknown>, reason: string) {
  await expect(promise).rejects.toBeInstanceOf(PasswordRecoveryError);
  await expect(promise).rejects.toMatchObject({ reason });
}

describe("passwordRecoveryService", () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    mockSignOut.mockResolvedValue({ error: null });
  });

  afterEach(() => consoleError.mockRestore());

  describe("requestPasswordRecovery", () => {
    it("sends the code to the trimmed email", async () => {
      mockResetPasswordForEmail.mockResolvedValueOnce({ data: {}, error: null });
      await requestPasswordRecovery(`  ${EMAIL} `);
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith(EMAIL);
    });

    it("rejects an invalid email without calling Supabase", async () => {
      await expectReason(requestPasswordRecovery("not-an-email"), "invalid_email");
      expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
    });

    it("resolves the same way for an unknown account", async () => {
      mockResetPasswordForEmail.mockResolvedValueOnce({
        data: null,
        error: authError({ code: "user_not_found", status: 404 }),
      });
      await expect(requestPasswordRecovery(EMAIL)).resolves.toBeUndefined();
    });

    it("surfaces the email rate limit (also used for resend)", async () => {
      mockResetPasswordForEmail.mockResolvedValueOnce({
        data: null,
        error: authError({ code: "over_email_send_rate_limit", status: 429 }),
      });
      await expectReason(requestPasswordRecovery(EMAIL), "rate_limited");
    });

    it("maps network failures", async () => {
      mockResetPasswordForEmail.mockResolvedValueOnce({
        data: null,
        error: authError({ name: "AuthRetryableFetchError", status: 0 }),
      });
      await expectReason(requestPasswordRecovery(EMAIL), "network");
    });
  });

  describe("verifyPasswordRecoveryCode", () => {
    it("verifies a recovery code and keeps the session for password accounts", async () => {
      mockVerifyOtp.mockResolvedValueOnce({ data: { user: emailUser, session: {} }, error: null });
      await expect(verifyPasswordRecoveryCode(EMAIL, ` ${CODE} `)).resolves.toBe("ready");
      expect(mockVerifyOtp).toHaveBeenCalledWith({ email: EMAIL, token: CODE, type: "recovery" });
      expect(mockSignOut).not.toHaveBeenCalled();
    });

    it("signs Google-only accounts straight back out", async () => {
      mockVerifyOtp.mockResolvedValueOnce({ data: { user: googleUser, session: {} }, error: null });
      await expect(verifyPasswordRecoveryCode(EMAIL, CODE)).resolves.toBe("google_only");
      expect(mockSignOut).toHaveBeenCalledWith({ scope: "local" });
    });

    it("rejects malformed codes without calling Supabase", async () => {
      await expectReason(verifyPasswordRecoveryCode(EMAIL, "12ab56"), "invalid_or_expired_code");
      await expectReason(verifyPasswordRecoveryCode(EMAIL, "12345"), "invalid_or_expired_code");
      expect(mockVerifyOtp).not.toHaveBeenCalled();
    });

    it("maps invalid or expired codes", async () => {
      mockVerifyOtp.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: authError({ code: "otp_expired", status: 403 }),
      });
      await expectReason(verifyPasswordRecoveryCode(EMAIL, CODE), "invalid_or_expired_code");
    });

    it("treats a missing session as an unexpected failure", async () => {
      mockVerifyOtp.mockResolvedValueOnce({ data: { user: emailUser, session: null }, error: null });
      await expectReason(verifyPasswordRecoveryCode(EMAIL, CODE), "unknown");
    });
  });

  describe("updateRecoveredPassword", () => {
    it("sets the new password on the recovery session", async () => {
      mockUpdateUser.mockResolvedValueOnce({ data: { user: emailUser }, error: null });
      await updateRecoveredPassword(PASSWORD);
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: PASSWORD });
    });

    it.each([
      [{ code: "same_password", status: 422 }, "same_password"],
      [{ code: "weak_password", status: 422 }, "weak_password"],
      [{ name: "AuthWeakPasswordError" }, "weak_password"],
      [{ name: "AuthSessionMissingError" }, "session_expired"],
      [{ code: "session_not_found", status: 403 }, "session_expired"],
    ])("maps %o to %s", async (fields, reason) => {
      mockUpdateUser.mockResolvedValueOnce({ data: { user: null }, error: authError(fields) });
      await expectReason(updateRecoveredPassword(PASSWORD), reason);
    });
  });

  describe("endPasswordRecovery", () => {
    it("signs out this device by default and everywhere after a reset", async () => {
      await endPasswordRecovery();
      expect(mockSignOut).toHaveBeenLastCalledWith({ scope: "local" });
      await endPasswordRecovery("global");
      expect(mockSignOut).toHaveBeenLastCalledWith({ scope: "global" });
    });

    it("does not throw when sign-out fails", async () => {
      mockSignOut.mockResolvedValueOnce({ error: authError({ code: "unexpected_failure", status: 500 }) });
      await expect(endPasswordRecovery()).resolves.toBeUndefined();
      expect(consoleError).toHaveBeenCalled();
    });
  });

  describe("hasEmailPasswordIdentity", () => {
    it("recognises email, Google-only and linked accounts", () => {
      expect(hasEmailPasswordIdentity(emailUser)).toBe(true);
      expect(hasEmailPasswordIdentity(googleUser)).toBe(false);
      expect(
        hasEmailPasswordIdentity({ identities: [{ provider: "google" }, { provider: "email" }] }),
      ).toBe(true);
      expect(hasEmailPasswordIdentity({ identities: null, app_metadata: { providers: ["email"] } })).toBe(true);
      expect(hasEmailPasswordIdentity({})).toBe(false);
    });
  });

  it("maps unknown errors and never logs the email, code or password", async () => {
    expect(toRecoveryErrorReason(null)).toBe("unknown");
    expect(toRecoveryErrorReason(authError({ code: "something_new", status: 500 }))).toBe("unknown");

    mockVerifyOtp.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: authError({ code: "unexpected_failure", status: 500, message: `Bad token ${CODE} for ${EMAIL}` }),
    });
    await expectReason(verifyPasswordRecoveryCode(EMAIL, CODE), "unknown");
    mockUpdateUser.mockResolvedValueOnce({
      data: { user: null },
      error: authError({ code: "unexpected_failure", status: 500, message: `rejected ${PASSWORD}` }),
    });
    await expectReason(updateRecoveredPassword(PASSWORD), "unknown");

    expect(consoleError).toHaveBeenCalled();
    const logged = JSON.stringify(consoleError.mock.calls);
    expect(logged).not.toContain(EMAIL);
    expect(logged).not.toContain(CODE);
    expect(logged).not.toContain(PASSWORD);
  });
});
