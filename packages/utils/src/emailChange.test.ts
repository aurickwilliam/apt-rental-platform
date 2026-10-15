import {
  getEmailChangeErrorField,
  getEmailChangeStatus,
  isEligibleForEmailChange,
  isEmailChangeCodeFormat,
  normalizeEmailChangeEmail,
  requestEmailChangeWith,
  resendEmailChangeCodesWith,
  signOutOtherSessionsAfterEmailChange,
  verifyEmailChangeCodeWith,
  type EmailChangeAuth,
  type EmailChangeErrorReason,
} from "./emailChange";
import { EmailChangeError } from "./emailChange";

const mockGetUser = jest.fn();
const mockSignInWithPassword = jest.fn();
const mockUpdateUser = jest.fn();
const mockVerifyOtp = jest.fn();
const mockResend = jest.fn();
const mockSignOut = jest.fn();

const auth: EmailChangeAuth = {
  getUser: (...args) => mockGetUser(...args),
  signInWithPassword: (...args) => mockSignInWithPassword(...args),
  updateUser: (...args) => mockUpdateUser(...args),
  verifyOtp: (...args) => mockVerifyOtp(...args),
  resend: (...args) => mockResend(...args),
  signOut: (...args) => mockSignOut(...args),
};

const CURRENT = "current@example.com";
const NEXT = "new@example.com";
const PASSWORD = "0ld!Passw0rd";
const CODE = "123456";

const emailUser = {
  id: "user-1",
  email: CURRENT,
  new_email: null,
  identities: [{ provider: "email" }],
  app_metadata: { providers: ["email"] },
};
const linkedUser = {
  ...emailUser,
  identities: [{ provider: "google" }, { provider: "email" }],
  app_metadata: { providers: ["google", "email"] },
};
const googleUser = {
  ...emailUser,
  identities: [{ provider: "google" }],
  app_metadata: { providers: ["google"] },
};

function authError(fields: { name?: string; code?: string; status?: number; message?: string }) {
  return Object.assign(new Error(fields.message ?? "auth error"), fields);
}

async function expectReason(promise: Promise<unknown>, reason: string) {
  await expect(promise).rejects.toBeInstanceOf(EmailChangeError);
  await expect(promise).rejects.toMatchObject({ reason });
}

describe("emailChange helpers", () => {
  it("normalizes and validates candidate addresses", () => {
    expect(normalizeEmailChangeEmail("  New@Example.com  ")).toBe("New@Example.com");
    expect(() => normalizeEmailChangeEmail("not-an-email")).toThrow(EmailChangeError);
  });

  it("accepts only 6-digit codes", () => {
    expect(isEmailChangeCodeFormat("123456")).toBe(true);
    expect(isEmailChangeCodeFormat(" 123456 ")).toBe(true);
    expect(isEmailChangeCodeFormat("12345")).toBe(false);
    expect(isEmailChangeCodeFormat("abcdef")).toBe(false);
  });

  it("allows only email/password accounts without Google", () => {
    expect(isEligibleForEmailChange(emailUser)).toBe(true);
    expect(isEligibleForEmailChange(linkedUser)).toBe(false);
    expect(isEligibleForEmailChange(googleUser)).toBe(false);
  });

  it.each<[EmailChangeErrorReason, string]>([
    ["wrong_current_password", "current"],
    ["invalid_email", "new"],
    ["same_email", "new"],
    ["email_unavailable", "new"],
    ["invalid_or_expired_code", "code"],
    ["rate_limited", "code"],
    ["session_expired", "general"],
    ["no_pending_change", "general"],
    ["unknown", "general"],
  ])("shows %s under the %s field", (reason, field) => {
    expect(getEmailChangeErrorField(reason)).toBe(field);
  });
});

describe("requestEmailChangeWith", () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    mockGetUser.mockResolvedValue({ data: { user: emailUser }, error: null });
    mockSignInWithPassword.mockResolvedValue({ data: { user: emailUser }, error: null });
    mockUpdateUser.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    // Secrets never reach the logs, including error messages.
    const logged = JSON.stringify(consoleError.mock.calls, (_key, item) =>
      item instanceof Error ? { name: item.name, message: item.message } : item,
    );
    expect(logged).not.toContain(PASSWORD);
    expect(logged).not.toContain(CODE);
    expect(logged).not.toContain(CURRENT);
    expect(logged).not.toContain(NEXT);
    consoleError.mockRestore();
  });

  it("verifies the password with the canonical email, then requests the change", async () => {
    const result = await requestEmailChangeWith(auth, `  ${NEXT}  `, PASSWORD);

    expect(result).toEqual({ currentEmail: CURRENT, newEmail: NEXT });
    expect(mockSignInWithPassword).toHaveBeenCalledWith({ email: CURRENT, password: PASSWORD });
    expect(mockUpdateUser).toHaveBeenCalledWith({ email: NEXT });
  });

  it("rejects an empty current password before calling Supabase", async () => {
    await expectReason(requestEmailChangeWith(auth, NEXT, ""), "wrong_current_password");
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("rejects the current address without a network call", async () => {
    await expectReason(requestEmailChangeWith(auth, CURRENT.toUpperCase(), PASSWORD), "same_email");
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("refuses Google-linked and Google-only accounts", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: linkedUser }, error: null });
    await expectReason(requestEmailChangeWith(auth, NEXT, PASSWORD), "not_eligible");
    expect(mockUpdateUser).not.toHaveBeenCalled();

    mockGetUser.mockResolvedValueOnce({ data: { user: googleUser }, error: null });
    await expectReason(requestEmailChangeWith(auth, NEXT, PASSWORD), "not_eligible");
  });

  it("changes nothing when the password is wrong", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: null },
      error: authError({ code: "invalid_credentials", status: 400 }),
    });

    await expectReason(requestEmailChangeWith(auth, NEXT, PASSWORD), "wrong_current_password");
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("maps a taken address to a generic message", async () => {
    mockUpdateUser.mockResolvedValueOnce({ error: authError({ code: "email_exists", status: 422 }) });
    await expectReason(requestEmailChangeWith(auth, NEXT, PASSWORD), "email_unavailable");
  });
});

describe("verifyEmailChangeCodeWith", () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    mockGetUser.mockReset();
    mockGetUser.mockResolvedValue({ data: { user: { ...emailUser, new_email: NEXT } }, error: null });
    mockVerifyOtp.mockResolvedValue({ data: { user: emailUser }, error: null });
  });

  afterEach(() => {
    const logged = JSON.stringify(consoleError.mock.calls, (_key, item) =>
      item instanceof Error ? { name: item.name, message: item.message } : item,
    );
    expect(logged).not.toContain(CODE);
    expect(logged).not.toContain(CURRENT);
    expect(logged).not.toContain(NEXT);
    consoleError.mockRestore();
  });

  it("does not complete after only the first code", async () => {
    const result = await verifyEmailChangeCodeWith(auth, "current", CODE, NEXT);

    expect(mockVerifyOtp).toHaveBeenCalledWith({ email: CURRENT, token: CODE, type: "email_change" });
    expect(result).toMatchObject({ completed: false, pendingNewEmail: NEXT });
  });

  it("pairs each inbox with this account's own address from Auth", async () => {
    await verifyEmailChangeCodeWith(auth, "new", CODE);
    expect(mockVerifyOtp).toHaveBeenCalledWith({ email: NEXT, token: CODE, type: "email_change" });
  });

  it("completes when Auth shows the new canonical address", async () => {
    mockGetUser.mockReset();
    mockGetUser
      .mockResolvedValueOnce({ data: { user: { ...emailUser, new_email: NEXT } }, error: null })
      .mockResolvedValueOnce({ data: { user: { ...emailUser, email: NEXT, new_email: null } }, error: null });

    const result = await verifyEmailChangeCodeWith(auth, "new", CODE, NEXT);
    expect(result).toEqual({ completed: true, email: NEXT, pendingNewEmail: null });
  });

  it("never reports success when the canonical address is not the pending one", async () => {
    mockGetUser.mockReset();
    mockGetUser
      .mockResolvedValueOnce({ data: { user: { ...emailUser, new_email: NEXT } }, error: null })
      .mockResolvedValueOnce({ data: { user: { ...emailUser, new_email: null } }, error: null });

    await expectReason(verifyEmailChangeCodeWith(auth, "new", CODE, NEXT), "unknown");
  });

  it("refuses when no change is pending", async () => {
    mockGetUser.mockReset();
    mockGetUser.mockResolvedValue({ data: { user: emailUser }, error: null });

    await expectReason(verifyEmailChangeCodeWith(auth, "current", CODE, NEXT), "no_pending_change");
    expect(mockVerifyOtp).not.toHaveBeenCalled();
  });

  it("refuses when another device replaced the pending address", async () => {
    await expectReason(
      verifyEmailChangeCodeWith(auth, "new", CODE, "other@example.com"),
      "no_pending_change",
    );
    expect(mockVerifyOtp).not.toHaveBeenCalled();
  });

  it("rejects malformed codes before calling Supabase", async () => {
    await expectReason(verifyEmailChangeCodeWith(auth, "current", "123", NEXT), "invalid_or_expired_code");
    expect(mockVerifyOtp).not.toHaveBeenCalled();
  });

  it("maps verification failures to the code field", async () => {
    mockVerifyOtp.mockResolvedValueOnce({
      data: { user: null },
      error: authError({ code: "otp_expired", status: 403 }),
    });
    await expectReason(verifyEmailChangeCodeWith(auth, "current", CODE, NEXT), "invalid_or_expired_code");
  });
});

describe("emailChange status, resend, and sign-out", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
    // Earlier tests can leave unused once-values behind.
    mockGetUser.mockReset();
    mockGetUser.mockResolvedValue({ data: { user: emailUser }, error: null });
    mockResend.mockResolvedValue({ error: null });
    mockSignOut.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore?.();
  });

  it("reads canonical Auth state for resume", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { ...emailUser, new_email: NEXT } },
      error: null,
    });
    await expect(getEmailChangeStatus(auth)).resolves.toMatchObject({
      userId: "user-1",
      email: CURRENT,
      pendingNewEmail: NEXT,
    });
  });

  it("resends both codes keyed by the current address", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { ...emailUser, new_email: NEXT } },
      error: null,
    });
    await resendEmailChangeCodesWith(auth);
    expect(mockResend).toHaveBeenCalledWith({ type: "email_change", email: CURRENT });
  });

  it("does not resend when no change is pending", async () => {
    await expectReason(resendEmailChangeCodesWith(auth), "no_pending_change");
    expect(mockResend).not.toHaveBeenCalled();
  });

  it("reports other-session sign-out failures instead of throwing", async () => {
    mockSignOut.mockResolvedValueOnce({ error: authError({ code: "unexpected_failure", status: 500 }) });
    await expect(signOutOtherSessionsAfterEmailChange(auth)).resolves.toEqual({ signOutFailed: true });
  });
});
